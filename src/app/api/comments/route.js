import { NextResponse } from "next/server"
import connectMongoDb from "../../../../lib/mongodb"
import Comment from "../../../../models/comments"

import User from "../../../../models/user" 

export const POST = async (req) => {
    try {
        const { postId, text, userId } = await req.json()
        console.log("Received comment data:", { postId, text, userId })

        if (!postId || !text || !userId) {
            return NextResponse.json({ error: "Missing required fields: postId, text, or userId" }, { status: 400 })
        }

        await connectMongoDb()
        
        const comment = await Comment.create({ 
            text, 
            post: postId, 
            user: userId 
        })
        
        
        const populatedComment = await Comment.findById(comment._id).populate("user", "name")
        
        console.log("Created comment:", populatedComment)
        return NextResponse.json(populatedComment, { status: 201 })
    } catch (error) {
        console.error("Error creating comment:", error)
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }
}

export const GET = async (req) => {
    const url = new URL(req.url)
    const id = url.searchParams.get("postId")

    if (!id) {
        return NextResponse.json({ error: "Query parameter 'postId' is required" }, { status: 400 })
    }

    try {
        await connectMongoDb()
       
        const comments = await Comment.find({ post: id })
            .populate("user", "name")
            .sort({ createdAt: -1 })
            
        return NextResponse.json(comments, { status: 200 })
    } catch (error) {
        console.error("Error fetching comments:", error)
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }
}

export const DELETE = async (req) => {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const currentUserId = url.searchParams.get("userId") 

    if (!id) {
        return NextResponse.json({ message: "Comment ID parameter 'id' is required" }, { status: 400 })
    }

    try {
        await connectMongoDb()
        
        const targetComment = await Comment.findById(id)
        if (!targetComment) {
            return NextResponse.json({ message: "Comment not found" }, { status: 404 })
        }

        
        if (currentUserId && targetComment.user.toString() !== currentUserId) {
            return NextResponse.json({ message: "Unauthorized: You can only delete your own comments" }, { status: 403 })
        }

        await Comment.findByIdAndDelete(id)
        return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error deleting comment:", error)
        return NextResponse.json({ message: "Error deleting comment" }, { status: 500 })
    }
}