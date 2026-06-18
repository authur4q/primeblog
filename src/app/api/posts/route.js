import { NextResponse } from "next/server"
import connectMongoDb from "../../../../lib/mongodb"
import Post from "../../../../models/post"
import User from "../../../../models/user"

export const POST = async (req) => {
    try {
        const { title, description, content, userId, name } = await req.json()

        if (!title || !userId) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        await connectMongoDb()

        const user = await User.findById(userId)
        const isPremiumUser = user ? user.isPremium : false

        const post = {
            title,
            description,
            content,
            userId,
            name,
            isPremium: isPremiumUser
        }

        await Post.create(post)
        return NextResponse.json({ message: "post created successfully" }, { status: 201 })
        
    } catch (error) {
        console.error("Error creating post:", error)
        return NextResponse.json({ message: "post not created successfully" }, { status: 500 })
    }
}

export const GET = async (req) => {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")

    try {
        await connectMongoDb()

        const posts = await Post.find(userId ? { userId } : {})
            .populate("userId", "isPremium")
            .sort({ createdAt: -1 })

        const flatPosts = posts.map((post) => {
            const postObj = post.toObject ? post.toObject() : post
            return {
                ...postObj,
                isPremium: postObj.isPremium || postObj.userId?.isPremium || false
            }
        })

        return NextResponse.json(flatPosts, { status: 200 })

    } catch (error) {
        console.error("Error fetching posts:", error)
        return NextResponse.json({ message: "Error fetching posts" }, { status: 500 })
    }
}