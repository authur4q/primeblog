import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from "../../../../../../lib/mongodb";
import Post from "../../../../../../models/post";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    await connectMongoDb();

    const post = await Post.findById(id);
    if (!post) return new NextResponse("Post not found", { status: 404 });

    const isBookmarked = post.bookmarkedBy.includes(userId);

    const update = isBookmarked
      ? { $pull: { bookmarkedBy: userId } }
      : { $addToSet: { bookmarkedBy: userId } };

    await Post.findByIdAndUpdate(id, update);

    return NextResponse.json(
      { message: isBookmarked ? "Bookmark removed" : "Bookmark added" },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH Bookmark Error:", err);
    return new NextResponse("Error updating bookmark", { status: 500 });
  }
}