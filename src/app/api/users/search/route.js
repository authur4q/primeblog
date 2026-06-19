import { NextResponse } from "next/server";
import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
      return NextResponse.json([], { status: 200 });
    }

    await connectMongoDb();

    const searchRegex = new RegExp(query, "i");

    const users = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { username: { $regex: searchRegex } }
      ]
    })
    .select("name username isPremium")
    .limit(10);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error in user search API:", error);
    return NextResponse.json(
      { error: "Internal server error during search query" }, 
      { status: 500 }
    );
  }
}