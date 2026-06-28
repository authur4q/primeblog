import { NextResponse } from 'next/server';
import connect from '../../../../../lib/mongodb'; // Your DB connection utility
import User from '../../../../../models/user';   // Your User model

export async function PATCH(request) {
  try {
    const { userId, enabled } = await request.json();
    
    await connect();
    
    // Update the user document in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { biometricsEnabled: enabled },
      { new: true }
    );
    console.log(updatedUser)

    if (!updatedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    return new NextResponse(JSON.stringify({ biometricsEnabled: updatedUser.biometricsEnabled }), { status: 200 });
  } catch (err) {
    return new NextResponse("Database Error: " + err.message, { status: 500 });
  }
}