import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import Post from "../../../../../models/post";
import { UTApi } from "uploadthing/server"; 

const utapi = new UTApi();

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

export const PATCH = async (req, { params }) => {
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


        const post = await Post.findById(id);
        
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

      
        if (post.imageUrl) {
           
            const fileKey = post.imageUrl.split('/').pop();
            if (fileKey) {
                await utapi.deleteFiles(fileKey);
            }
        }

     
        await Post.findByIdAndDelete(id);

        return NextResponse.json({ message: "Post and image deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting post" }, { status: 500 });
    }
};