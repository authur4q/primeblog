import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import Conversation from "../../../../../models/conversation";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserId = String(session.user.id);
    const { recipientId } = await req.json();

    if (!recipientId || currentUserId === recipientId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await connectMongoDb();

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId] }
    }).populate("participants", "name username isPremium");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId]
      });
      conversation = await conversation.populate("participants", "name username isPremium");
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongoDb();
    const conversations = await Conversation.find({
      participants: String(session.user.id)
    })
      .populate("participants", "name username isPremium")
      .sort({ updatedAt: -1 });

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}