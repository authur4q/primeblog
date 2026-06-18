import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../../lib/mongodb";
import User from "../../../../../../models/user";

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden: Account mismatch" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, phone, twitter, Instagram } = body;

    await connectMongoDb();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User instance not found" }, { status: 404 });
    }

    if (name) user.name = name;
    
    user.username = username || "";
    user.primaryPhone = phone || undefined;

    if (user.isPremium || session.user.role === "admin") {
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