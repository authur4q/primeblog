import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import Post from "../../../../../models/post";
import User from "../../../../../models/user";


export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("userId"); 

    await connectMongoDb();

  
    const user = await User.findOne({ name: name });
    
    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const posts = await Post.find({ userId: user._id }); 
    
    return NextResponse.json(posts, { status: 200 });
}
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
        await Post.findByIdAndDelete(id);
        return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting post" }, { status: 500 });
    }
};