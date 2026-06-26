import { NextResponse } from "next/server";
import Follow from "../../../../../../models/follow";
import User from "../../../../../../models/user"; 
import connectMongoDb from "../../../../../../lib/mongodb";
import mongoose from "mongoose";

export async function GET(req, { params }) {
    const { id } = await params;
    await connectMongoDb();

    let userId = id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const user = await User.findOne({ username: id });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        userId = user._id;
    }

  
    const followers = await Follow.find({ following: userId })
        .populate('follower', 'name username');

    return NextResponse.json(followers.map(f => f.follower));
}