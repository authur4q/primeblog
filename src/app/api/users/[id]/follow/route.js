import { NextResponse } from "next/server";
import Follow from "../../../../../../models/follow";
import Notification from "../../../../../../models/Notification"; 
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../../lib/mongodb";

export async function GET(req, { params }) {
    const { id: followingId } = await params;
    const session = await auth();
    
    if (!session) return NextResponse.json({ following: false });

    await connectMongoDb();
    const isFollowing = await Follow.findOne({ follower: session.user.id, following: followingId });
    return NextResponse.json({ following: !!isFollowing });
}

export async function POST(req, { params }) {
    const { id: followingId } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongoDb();
    
   
    await Follow.create({ follower: session.user.id, following: followingId });

    try {
        await Notification.create({
            recipient: followingId,
            sender: session.user.id,
            type: "USER_ACTIVITY",
            title: "New Follower",
            message: `${session.user.name} started following you.`,
            targetLink: `/profile/${session.user.id}`
        });
    } catch (err) {
        console.error("Failed to create follow notification", err);
    }

    return NextResponse.json({ message: "Followed" });
}

export async function DELETE(req, { params }) {
    const { id: followingId } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongoDb();
    await Follow.deleteOne({ follower: session.user.id, following: followingId });
    
    return NextResponse.json({ message: "Unfollowed" });
}