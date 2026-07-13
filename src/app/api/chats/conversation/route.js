import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import Conversation from "../../../../../models/conversation";
import Message from "../../../../../models/messages"; 
import redis from "../../../../../lib/redis";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDb();
    const { recipientId } = await req.json();

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID required" }, { status: 400 });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [session.user.id, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [session.user.id, recipientId]
      });
    }

    try {
      await redis.del(`user:${session.user.id}:chats`);
      await redis.del(`user:${recipientId}:chats`);
    } catch (cacheError) {
      console.error("Cache clear failure in conversation controller:", cacheError);
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error("Failed to initialize conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = String(session.user.id);
    const cacheKey = `user:${userId}:chats`;

   
    try {
      let cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        const parsedChats = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
        if (parsedChats && Array.isArray(parsedChats)) {
          console.log("Serving sidebar list directly from Redis cache layer");
          return NextResponse.json(parsedChats, { status: 200 });
        }
      }
    } catch (cacheError) {
      console.error("Redis read/parse failed, falling back to MongoDB:", cacheError);
      try { await redis.del(cacheKey); } catch (_) {}
    }

    
    await connectMongoDb();
    const userObjId = new mongoose.Types.ObjectId(userId);

  
    const rawConversations = await Conversation.find({ participants: userObjId })
      .populate("participants", "name username isPremium profilePicture")
      .sort({ updatedAt: -1 })
      .lean();


    const conversations = await Promise.all(
      rawConversations.map(async (convo) => {
        if (!convo.lastMessage) {
          const fallbackMsg = await Message.findOne({ conversationId: convo._id })
            .sort({ createdAt: -1 })
            .select("text createdAt senderId seen")
            .populate({
              path: "senderId",
              select: "profilePicture name"
            })
            .lean();

          return {
            ...convo,
            lastMessage: fallbackMsg || null
          };
        }
        
      
        const populatedMsg = await Message.findById(convo.lastMessage)
          .select("text createdAt senderId seen")
          .populate({
            path: "senderId",
            select: "profilePicture name"
          })
          .lean();

        console.log(populatedMsg)
          
        return {
          ...convo,
          lastMessage: populatedMsg || null
        };
      })
    );

   
    try {
      const stringifiedData = JSON.stringify(conversations);
      await redis.setex(cacheKey, 600, stringifiedData);
    } catch (cacheWriteError) {
      console.error("Failed to write fresh dataset to Redis:", cacheWriteError);
    }

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    console.error("Error in conversation GET:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}