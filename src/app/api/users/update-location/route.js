import { NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/options";
import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";

export async function PATCH(req) {
  try {
    const session = await auth(); 
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { lat, lng, isSharingLocation } = body;
    
    await connectMongoDb();

    
    const update = { isSharingLocation };
    const unset = {};

    if (isSharingLocation && lat !== undefined && lng !== undefined) {
      
      update.location = { 
        type: "Point", 
        coordinates: [lng, lat] 
      };
    } else if (isSharingLocation === false) {
     
      unset.location = ""; 
    }

    const result = await User.findOneAndUpdate(
      { email: session.user.email }, 
      { 
        $set: update,
        ...Object.keys(unset).length > 0 && { $unset: unset }
      },
      { new: true }
    );

    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ message: "Location state updated", user: result });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}