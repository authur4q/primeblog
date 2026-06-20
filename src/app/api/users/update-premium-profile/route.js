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

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "A valid unique username is required" }, { status: 400 });
    }

    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedPhone = whatsapp ? whatsapp.trim() : undefined;

    await connectMongoDb();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        username: sanitizedUsername,
        primaryPhone: sanitizedPhone 
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "The custom username or WhatsApp phone number provided is already claimed by another account." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}