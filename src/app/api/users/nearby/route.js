import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const radius = parseInt(searchParams.get("radius")) || 10000; 

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Invalid or missing coordinates" }, { status: 400 });
    }

    await connectMongoDb();

  
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: { 
            type: "Point", 
            coordinates: [lng, lat] 
          },
          $maxDistance: radius 
        }
      }
    }).select("name username location").lean();

    return NextResponse.json(nearbyUsers);
  } catch (error) {
    console.error("Nearby API Error:", error);
    return NextResponse.json({ error: "Failed to fetch nearby users" }, { status: 500 });
  }
}