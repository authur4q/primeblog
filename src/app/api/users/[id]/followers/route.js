import { NextResponse } from "next/server";
import Follow from "../../../../../../models/follow"; 

import connectMongoDb from "../../../../../../lib/mongodb";

export async function GET(req, { params }) {
    const { id } = await params;
    await connectMongoDb();
    const followers = await Follow.find({ following: id }).populate('follower', 'name username');
    return NextResponse.json(followers.map(f => f.follower));
}