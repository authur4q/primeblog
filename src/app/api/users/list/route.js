import { NextResponse } from "next/server";
import User from "../../../../../models/user";
import Follow from "../../../../../models/follow"; 
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";

export async function GET() {
  try {
    await connectMongoDb();
    const session = await auth();

    let excludedIds = [];

    if (session?.user?.id) {
      const followingRecords = await Follow.find({ follower: session.user.id })
        .select("following")
        .lean();
      
      excludedIds = followingRecords.map((r) => r.following);
     
      excludedIds.push(session.user.id);
    }

    const users = await User.find({ _id: { $nin: excludedIds } })
      .select("name username _id")
      .limit(70)
      .lean();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching filtered user list:", error);
    return NextResponse.json(
      { error: "Failed to fetch user list" }, 
      { status: 500 }
    );
  }
}