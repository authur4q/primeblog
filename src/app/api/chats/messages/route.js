import { NextResponse } from "next/server"
import Message from "../../../../../models/messages"
import Notification from "../../../../../models/Notification" 
import mongoose from "mongoose"
import connectMongoDb from "../../../../../lib/mongodb"

export async function GET(req) {
  try {
    await connectMongoDb()

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    const limit = parseInt(searchParams.get("limit"), 10) || 20
    const beforeMessageId = searchParams.get("before")

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
    }

    const query = { conversationId }
    if (beforeMessageId) {
      query._id = { $lt: beforeMessageId }
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 }) 
      .limit(limit)

    return NextResponse.json(messages.reverse(), { status: 200 })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectMongoDb()

    const body = await req.json()
    const { conversationId, senderId, text, recipientId } = body

    if (!conversationId || !senderId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

   
    const newMessage = await Message.create({
      conversationId,
      senderId,
      text: text.trim(),
    })


    await mongoose.models.Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text.trim(),
      updatedAt: new Date()
    });

    let determinedRecipient = recipientId
    if (!determinedRecipient && mongoose.models.Conversation) {
      const activeConvo = await mongoose.models.Conversation.findById(conversationId).lean()
      if (activeConvo && Array.isArray(activeConvo.participants)) {
        determinedRecipient = activeConvo.participants.find(
          (pId) => pId.toString() !== senderId.toString()
        )
      }
    }

    
    if (determinedRecipient) {
      await Notification.create({
        recipient: new mongoose.Types.ObjectId(String(determinedRecipient)),
        sender: new mongoose.Types.ObjectId(String(senderId)),
        type: "USER_ACTIVITY",
        title: "New Message Received",
        message: text.trim().length > 40 ? `${text.trim().substring(0, 40)}...` : text.trim(),
        read: false,
      })
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/chats/messages:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}