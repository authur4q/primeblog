import { NextResponse } from "next/server";
import connectMongoDb from "../../../../lib/mongodb";
import Post from "../../../../models/post";
import User from "../../../../models/user";

export const POST = async (req) => {
    try {
        const { title, description, content, userId, name, status, imageUrl, tags, category } = await req.json();
        if (!title || !userId) return NextResponse.json({ message: "Missing required fields" }, { status: 400 });

        await connectMongoDb();
        const user = await User.findById(userId);
        const post = {
            title, 
            description, 
            content, 
            userId, 
            name,
            imageUrl,
            tags,
            category,
            status: status || 'published',
            isPremium: user ? user.isPremium : false
        };
        await Post.create(post);
        return NextResponse.json({ message: "Post created successfully" }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Post not created" }, { status: 500 });
    }
};

export const GET = async (req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const status = url.searchParams.get("status");

    try {
        await connectMongoDb();
        
        let query = {};
        
        if (userId) {
            query.userId = userId;
        }
        
        if (status === "draft") {
            query.status = "draft";
        } else {
            query.status = "published";
        }

        const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching posts" }, { status: 500 });
    }
};