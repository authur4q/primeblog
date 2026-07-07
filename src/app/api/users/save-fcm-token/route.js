
import { NextResponse } from 'next/server';
import User from '../../../../../models/user';
import { auth } from "@/app/api/auth/[...nextauth]/options";

import connectMongoDb from '../../../../../lib/mongodb';

export async function POST(req) {
  await connectMongoDb()
  
  
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { token } = await req.json();

  await User.findByIdAndUpdate(session.user.id, { fcmToken: token });

  return NextResponse.json({ success: true });
}