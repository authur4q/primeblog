import { NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, whatsapp } = await req.json();

    await connectMongoDb();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        username: username,
        primaryPhone: whatsapp 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}