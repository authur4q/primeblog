import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import Post from "../../../../../models/post"
import mongoose from 'mongoose';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ message: "UserId required" }, { status: 400 });

  try {
    await connectMongoDb();

 
    const bookmarkedPosts = await Post.find({ 
      bookmarkedBy: new mongoose.Types.ObjectId(userId) 
    })
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json(bookmarkedPosts, { status: 200 });
  } catch (err) {
    console.error("GET Bookmarks Error:", err);
    return NextResponse.json({ message: "Error fetching bookmarks" }, { status: 500 });
  }
}