import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { auth } from "@/app/api/auth/[...nextauth]/options";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { targetUserId, callerName, conversationId, mediaType } = await req.json();

  // Broadcast the incoming call to the specific user's private channel
  await pusher.trigger(`private-user-${targetUserId}`, "incoming-call", {
    callerName,
    conversationId,
    mediaType
  });

  return NextResponse.json({ success: true });
}