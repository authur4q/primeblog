import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectMongoDb from "../../../../../lib/mongodb"

import User from "../../../../../models/user"

import Post from "../../../../../models/post"

import authOptions from "@/app/api/auth/[...nextauth]/options"

export const GET = async (req) => {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized access profile" }, { status: 403 })
    }

    
    await connectMongoDb()

    const [totalUsers, premiumUsers, totalPosts, usersList] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Post.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select("-password")
    ])

    return NextResponse.json({
      stats: {
        users: totalUsers,
        premium: premiumUsers,
        posts: totalPosts
      },
      recentUsers: usersList
    }, { status: 200 })

  } catch (error) {
    console.error("Dashboard metrics aggregation error:", error)
    return NextResponse.json({ message: "Internal server error gathering metrics" }, { status: 500 })
  }
}