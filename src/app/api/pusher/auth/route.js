import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { auth } from "@/app/api/auth/[...nextauth]/options"

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

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id');
  const channel = params.get('channel_name');

  const authResponse = pusher.authorizeChannel(socketId, channel);
  
  return NextResponse.json(authResponse);
}