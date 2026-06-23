import { NextResponse } from 'next/server';
import connectMongoDb from "../../../../../lib/mongodb";
import Post from "../../../../../models/post"; 

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) return NextResponse.json([], { status: 400 });

  await connectMongoDb();

  const posts = await Post.find({
    content: { $regex: query, $options: 'i' }
  });

  return NextResponse.json(posts);
}