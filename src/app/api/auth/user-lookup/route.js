import connectMongoDb from "../../../../../lib/mongodb";
import User from "../../../../../models/user";

export async function POST(req) {
  try {
    const { email } = await req.json();
    await connectMongoDb();
    
    const user = await User.findOne({ email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ userId: user._id.toString() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}