import { NextResponse } from "next/server";
import Follow from "../../../../../../models/follow";

import connectMongoDb from "../../../../../../lib/mongodb";

export async function GET(req, { params }) {
    const { id } = await params;
    await connectMongoDb();
    const following = await Follow.find({ follower: id }).populate('following', 'name username');
    return NextResponse.json(following.map(f => f.following));
}