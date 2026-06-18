import { NextResponse } from "next/server"
import User from "../../../../../models/user" 
import mongoose from "mongoose"
import connectMongoDb from "../../../../../lib/mongodb"
import { getServerSession } from "next-auth/next"
import authOptions from "@/app/api/auth/[...nextauth]/options"

export const GET = async (req, { params }) => {
    try {
        const { id } = await params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`Invalid MongoDB ObjectId format received: ${id}`)
            return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
        }

        await connectMongoDb()

        const user = await User.findById(id).select("-password")
        
        if (!user) {
            console.error(`User account with ID ${id} was not found in MongoDB.`)
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden: Account mismatch" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, primaryPhone, twitter, Instagram } = body;

    await connectMongoDb();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User instance not found" }, { status: 404 });
    }

    if (name) user.name = name;
    
    user.username = username || "";
    user.primaryPhone = primaryPhone || undefined;

    if (user.isPremium) {
      user.twitter = twitter || "";
      user.Instagram = Instagram || "";
    }

    await user.save();

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("API Update Error:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "The custom username or phone number provided is already claimed by another account." },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: "Internal Server error processing sync update" }, { status: 500 });
  }
}