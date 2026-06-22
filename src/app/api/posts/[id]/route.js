import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import Post from "../../../../../models/post";

export const GET = async (req, { params }) => {
    const { id } = await params;
    try {
        await connectMongoDb();
        const post = await Post.findById(id);
        return NextResponse.json(post, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching post" }, { status: 500 });
    }
};

export const PUT = async (req, { params }) => {
    const { id } = await params;
    try {
        const { title, description, content, status, imageUrl, tags, category } = await req.json();
        await connectMongoDb();
        
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
        
        return NextResponse.json({ message: "Post updated successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating post" }, { status: 500 });
    }
};

export const DELETE = async (req, { params }) => {
    const { id } = await params;
    try {
        await connectMongoDb();
        await Post.findByIdAndDelete(id);
        return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting post" }, { status: 500 });
    }
};