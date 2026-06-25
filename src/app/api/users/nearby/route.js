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

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distInMeters",
          maxDistance: radius,
          spherical: true,
        },
      },
      {
        $project: {
          name: 1,
          status: 1,
          username: 1,
          location: 1,
          distInMeters: 1,
          distInKm: { $divide: ["$distInMeters", 1000] }
        },
      },
    ]);

    return NextResponse.json(nearbyUsers || []);
  } catch (error) {
    console.error("Nearby API Error:", error);
    return NextResponse.json({ error: "Failed to fetch nearby users" }, { status: 500 });
  }
}