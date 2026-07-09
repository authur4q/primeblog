import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import Post from "../../../../../models/post";
import redis from "../../../../../lib/redis";
import { UTApi } from "uploadthing/server"; 

const utapi = new UTApi();

export const GET = async (req, { params }) => {
    const { id } = await params;
    try {
        await connectMongoDb();
        const post = await Post.findById(id);
        if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });
        return NextResponse.json(post, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching post" }, { status: 500 });
    }
};

export const PATCH = async (req, { params }) => {
    const { id } = await params;
    try {
        const { title, description, content, status, imageUrl, tags, category } = await req.json();
        await connectMongoDb();
        
        const existingPost = await Post.findById(id);
        if (!existingPost) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const oldStatus = existingPost.status;
        const oldUserId = existingPost.userId;

        await Post.findByIdAndUpdate(id, {
            title,
            description,
            content,
            status,
            imageUrl,
            tags,
            category,
            updatedAt: new Date()
        });
        
        const newStatus = status || oldStatus;

        await Promise.all([
            redis.del(`posts:${oldStatus}:${oldUserId}`),
            redis.del(`posts:${oldStatus}:all`),
            redis.del(`posts:${newStatus}:${oldUserId}`),
            redis.del(`posts:${newStatus}:all`)
        ]);
        
        return NextResponse.json({ message: "Post updated successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating post" }, { status: 500 });
    }
};

export const DELETE = async (req, { params }) => {
    const { id } = await params;
    try {
        await connectMongoDb();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const { userId, status, imageUrl } = post;

        if (imageUrl) {
            const fileKey = imageUrl.split('/').pop();
            if (fileKey) {
                await utapi.deleteFiles(fileKey);
            }
        }

        await Post.findByIdAndDelete(id);

        await Promise.all([
            redis.del(`posts:${status}:${userId}`),
            redis.del(`posts:${status}:all`)
        ]);

        return NextResponse.json({ message: "Post and image deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting post" }, { status: 500 });
    }
};