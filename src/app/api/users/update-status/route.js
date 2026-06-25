import { NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();
    const updatedStatus = status
    console.log(status)
    await connectMongoDb();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });


    await User.updateOne(
      { _id: user._id },
      { $set: { status: updatedStatus } }
    );
    console.log(user)

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })}}