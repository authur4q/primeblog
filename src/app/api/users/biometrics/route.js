import { NextResponse } from 'next/server';
import connect from '../../../../../lib/mongodb'; 
import User from '../../../../../models/user';   

export async function PATCH(request) {
  try {
    const { userId, enabled } = await request.json();
    
    await connect();
    
   
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