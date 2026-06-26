import { NextResponse } from "next/server";
import Follow from "../../../../../../models/follow";
import User from "../../../../../../models/user"; // Import your User model
import connectMongoDb from "../../../../../../lib/mongodb";
import mongoose from "mongoose";

export async function GET(req, { params }) {
    const { id } = await params;
    await connectMongoDb();

    let userId = id;

    // Check if the id is a valid ObjectId. If not, treat it as a username/slug.
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const user = await User.findOne({ username: id });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        userId = user._id;
    }

    // Now query using the validated ObjectId
    const followers = await Follow.find({ following: userId })
        .populate('follower', 'name username');

    return NextResponse.json(followers.map(f => f.follower));
}