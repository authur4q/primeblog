import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import Conversation from "../../../../../models/conversation";
import User from "../../../../../models/user";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { recipientId } = await req.json();

    if (!recipientId || currentUserId === recipientId) {
      return NextResponse.json({ error: "Invalid recipient ID handle" }, { status: 400 });
    }

    await connectMongoDb();

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId] }
    }).populate("participants", "name username isPremium");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId]
      });
      conversation = await Conversation.findById(conversation._id).populate("participants", "name username isPremium");
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error("Conversation route failure node:", error);
    return NextResponse.json({ error: "Internal server error execution" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectMongoDb();

    const conversations = await Conversation.find({
      participants: session.user.id
    })
      .populate("participants", "name username isPremium")
      .sort({ lastMessageAt: -1 });

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load dynamic conversation clusters" }, { status: 500 });
  }
}