import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import Post from "../../../../../models/post";
import mongoose from "mongoose";
import Notification from "../../../../../models/Notification";

export async function POST(req) {
    try {
        const { postId, userId, action } = await req.json();
        await connectDB();

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const update = action === 'like' 
            ? { $addToSet: { likes: userObjectId } } 
            : { $pull: { likes: userObjectId } };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true })
            .populate("UserId")
            .populate("user");
        
        if (!updatedPost) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        
        if (action === 'like') {
   
    const postAuthorId = updatedPost.userId?._id || updatedPost.userId;

    if (postAuthorId && postAuthorId.toString() !== userId.toString()) {
        await Notification.create({
            recipient: new mongoose.Types.ObjectId(String(postAuthorId)),
            sender: userObjectId,
            type: "USER_ACTIVITY",
            title: "New Like on Your Post",
            message: "Someone liked your post.",
            read: false,
        });
    }
}
        
        return NextResponse.json({ likes: updatedPost.likes });
    } catch (err) {
        console.error("Like API Error:", err);
        return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get("postId");
        
        if (!postId) {
            return NextResponse.json({ error: "Post ID required" }, { status: 400 });
        }

        await connectDB();
        const post = await Post.findById(postId).select("likes");
        
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        
        return NextResponse.json({ likes: post.likes || [] });
    } catch (err) {
        console.error("Fetch Likes API Error:", err);
        return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
    }
}