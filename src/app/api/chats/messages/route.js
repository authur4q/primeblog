import { NextResponse } from "next/server";
import Message from "../../../../../models/messages";
import Notification from "../../../../../models/Notification";
import mongoose from "mongoose";
import connectMongoDb from "../../../../../lib/mongodb";
import redis from "../../../../../lib/redis";
import Pusher from "pusher";

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function GET(req) {
  try {
    await connectMongoDb();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit"), 10) || 20;
    const beforeMessageId = searchParams.get("before");
    const cacheKey = `messages:${conversationId}:${beforeMessageId || 'latest'}:${limit}`;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const cachedMessages = await redis.get(cacheKey);
    if (cachedMessages) {
      try {
        const data = typeof cachedMessages === 'string' ? JSON.parse(cachedMessages) : cachedMessages;
        return NextResponse.json(data.reverse(), { status: 200 });
      } catch {
        await redis.del(cacheKey);
      }
    }

    const query = { conversationId };
    if (beforeMessageId) {
      query._id = { $lt: beforeMessageId };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 });
    }

    await redis.set(cacheKey, JSON.stringify(messages), { ex: 30 });
    return NextResponse.json(messages.reverse(), { status: 200 });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoDb();

    const body = await req.json();
    const { conversationId, senderId, text, recipientId } = body;

    if (!conversationId || !senderId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanText = text.trim();
    const generatedId = new mongoose.Types.ObjectId();

    const newMessage = {
      _id: generatedId,
      conversationId,
      senderId,
      text: cleanText,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let determinedRecipient = recipientId;
    if (!determinedRecipient && mongoose.models.Conversation) {
      const activeConvo = await mongoose.models.Conversation.findById(conversationId).lean();
      if (activeConvo && Array.isArray(activeConvo.participants)) {
        determinedRecipient = activeConvo.participants.find(
          (pId) => pId.toString() !== senderId.toString()
        );
      }
    }

    const productionTasks = [
      Message.create(newMessage),
      pusherServer.trigger(conversationId, "new-message", newMessage),
      mongoose.models.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: cleanText,
        updatedAt: new Date()
      })
    ];

    if (determinedRecipient) {
      productionTasks.push(
        Notification.create({
          recipient: new mongoose.Types.ObjectId(String(determinedRecipient)),
          sender: new mongoose.Types.ObjectId(String(senderId)),
          type: "USER_ACTIVITY",
          title: "New Message Received",
          message: cleanText.length > 40 ? `${cleanText.substring(0, 40)}...` : cleanText,
          read: false,
        })
      );
    }

    await Promise.all(productionTasks);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chats/messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}