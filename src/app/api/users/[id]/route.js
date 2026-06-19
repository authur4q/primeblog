import { NextResponse } from "next/server"
import User from "../../../../../models/user" 
import mongoose from "mongoose"
import connectMongoDb from "../../../../../lib/mongodb"
import { auth } from "@/app/api/auth/[...nextauth]/options"

const buildUserQuery = (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        return {
            $or: [
                { _id: id },
                { username: id }
            ]
        }
    }
    return { username: id }
}

export const GET = async (req, { params }) => {
    try {
        const { id } = await params

        if (id === "search") {
            return NextResponse.json({ error: "Route handled by search endpoint" }, { status: 404 })
        }

        await connectMongoDb()

        const queryCondition = buildUserQuery(id)
        const user = await User.findOne(queryCondition).select("-password")
        
        if (!user) {
            console.error(`User account with identifier "${id}" was not found in MongoDB.`)
            return NextResponse.json({ error: "User profile not found" }, { status: 404 })
        }
        
        return NextResponse.json(user, { status: 200 })
    } catch (error) {
        console.error("Critical error in GET /api/users/[id]:", error)
        return NextResponse.json({ error: "Server error retrieving profile details" }, { status: 500 })
    }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params

    if (id === "search") {
        return NextResponse.json({ error: "Route handled by search endpoint" }, { status: 404 })
    }

    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDb()

    const queryCondition = buildUserQuery(id)
    const user = await User.findOne(queryCondition)
    if (!user) {
      return NextResponse.json({ error: "User instance not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "admin"
    const isOwner = session.user.id === user._id.toString()

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Account mismatch access denied" }, { status: 403 })
    }

    const body = await req.json()

    if (isAdmin) {
      if (body.role) user.role = body.role
      if (body.hasOwnProperty('isPremium')) user.isPremium = body.isPremium
      if (body.subscriptionPlan) user.subscriptionPlan = body.subscriptionPlan
    }

    if (body.name) user.name = body.name
    if (body.hasOwnProperty('username')) user.username = body.username || ""
    if (body.hasOwnProperty('primaryPhone')) user.primaryPhone = body.primaryPhone || undefined

    if (user.isPremium || isAdmin) {
      if (body.hasOwnProperty('twitter')) user.twitter = body.twitter || ""
      if (body.hasOwnProperty('Instagram')) user.Instagram = body.Instagram || ""
    }

    await user.save()

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error("API Update Error:", error)
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "The custom username or phone number provided is already claimed by another account." },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Internal Server error processing sync update" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params

    if (id === "search") {
        return NextResponse.json({ error: "Route handled by search endpoint" }, { status: 404 })
    }

    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDb()

    const queryCondition = buildUserQuery(id)
    const userToDelete = await User.findOne(queryCondition)
    
    if (!userToDelete) {
      return NextResponse.json({ error: "Target profile account not found in database memory" }, { status: 404 })
    }

    const isAdmin = session.user.role === "admin"
    const isOwner = session.user.id === userToDelete._id.toString()

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Insufficient operation access permissions" }, { status: 403 })
    }

    await User.deleteOne({ _id: userToDelete._id })

    return NextResponse.json({ message: "Account context and cascade records purged successfully" }, { status: 200 })
  } catch (error) {
    console.error("API Deletion Error:", error)
    return NextResponse.json({ error: "Internal server processing failure executing purge block" }, { status: 500 })
  }
}