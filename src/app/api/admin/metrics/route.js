import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/options"
import connectMongoDb from "../../../../../lib/mongodb"
import User from "../../../../../models/user"
import Post from "../../../../../models/post"

export const GET = async (req) => {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized access profile" }, { status: 403 })
    }

    await connectMongoDb()

    const [aggregationResults, estimatedPosts, usersList] = await Promise.all([
      User.aggregate([
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            premiumCount: [
              { 
                $match: { 
                  $or: [
                    { isPremium: true }, 
                    { tier: "premium" }, 
                    { subscriptionPlan: "premium" }
                  ] 
                } 
              },
              { $count: "count" }
            ]
          }
        }
      ]),
      Post.estimatedDocumentCount(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("-password")
        .lean()
    ])

    const facet = aggregationResults[0]
    const totalUsers = facet?.totalCount[0]?.count || 0
    const premiumUsers = facet?.premiumCount[0]?.count || 0

    return NextResponse.json({
      stats: {
        users: totalUsers,
        premium: premiumUsers,
        posts: estimatedPosts
      },
      recentUsers: usersList
    }, { status: 200 })

  } catch (error) {
    console.error("Dashboard metrics aggregation error:", error)
    return NextResponse.json({ message: "Internal server error gathering metrics" }, { status: 500 })
  }
}