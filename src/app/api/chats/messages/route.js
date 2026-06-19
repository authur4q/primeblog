import { NextResponse } from "next/server"
import Message from  "../../../../../models/messages"
import connectMongoDb from "../../../../../lib/mongodb"

export async function GET(req) {
  try {
    await connectMongoDb()

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 }) 

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


export async function POST(req) {
  try {
    await connectMongoDb()

    const body = await req.json()
    const { conversationId, senderId, text } = body

    if (!conversationId || !senderId || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      text: text.trim(),
    })

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}