import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import Conversation from "../../../../../models/conversation";
import mongoose from "mongoose";
import Pusher from "pusher";

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserId = String(session.user.id);
    const { recipientId } = await req.json();

    if (!recipientId || currentUserId === recipientId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectMongoDb();

    const currentObjId = new mongoose.Types.ObjectId(currentUserId);
    const recipientObjId = new mongoose.Types.ObjectId(recipientId);

    let conversation = await Conversation.findOne({
      participants: { $all: [currentObjId, recipientObjId] }
    }).populate("participants", "name username isPremium");

    if (!conversation) {
      const newConvoDoc = await Conversation.create({
        participants: [currentObjId, recipientObjId]
      });
      
      conversation = await Conversation.findById(newConvoDoc._id)
        .populate("participants", "name username isPremium");

      await pusherServer.trigger(`user-${recipientId}-conversations`, "new-conversation", conversation);
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error("Error in conversation POST:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongoDb();
    
    const userObjId = new mongoose.Types.ObjectId(String(session.user.id));

    const conversations = await Conversation.find({
      participants: userObjId
    })
      .populate("participants", "name username isPremium")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    console.error("Error in conversation GET:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}