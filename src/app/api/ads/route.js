import { NextResponse } from "next/server";
import connectMongoDb from "../../../../lib/mongodb";
import Ad from "../../../../models/ad";

export async function POST(request) {
  try {
    const { title, description, targetLink, imageUrl } = await request.json();

    if (!title || !description || !targetLink) {
      return NextResponse.json(
        { message: "Missing required fields: title, description, and targetLink are required." },
        { status: 400 }
      );
    }

    await connectMongoDb();
    const newAd = await Ad.create({
      title,
      description,
      targetLink,
      imageUrl: imageUrl || "",
    });

    return NextResponse.json(
      { message: "Ad created successfully. It will expire in 24 hours.", ad: newAd },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create ad", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDb();

    const randomAd = await Ad.aggregate([{ $sample: { size: 10 } }]);

    if (randomAd.length === 0) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(randomAd[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch ad", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    await connectMongoDb();
    const deletedAd = await Ad.findByIdAndDelete(id);

    if (!deletedAd) {
      return NextResponse.json(
        { message: "No advertisement found with the provided identifier" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Advertisement entry pulled from system rotation successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete ad", error: error.message },
      { status: 500 }
    );
  }
}