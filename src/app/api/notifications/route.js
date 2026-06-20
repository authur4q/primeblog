import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/options"
import connectMongoDb from "../../../../lib/mongodb"
import Notification from "../../../../models/Notification"

import User from "../../../../models/user" 

export const GET = async (req) => {
  try {
    const session = await auth()
    

    if (!session || !session.user?.id) {
      console.log("Notifications blocked: No active session user ID found.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDb()


    const notifications = await Notification.find({ recipient: session.user.id })
      .populate("sender", "name username isPremium")
      .sort({ read: 1, createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json(notifications, { status: 200 })
  } catch (error) {
    console.error("Failed to fetch notification feed:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export const PATCH = async (req) => {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDb()

    await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { $set: { read: true } }
    )

    return NextResponse.json({ success: true, message: "Feed marked read" }, { status: 200 })
  } catch (error) {
    console.error("Failed to update notification state:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}