import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import admin from 'firebase-admin';
import { auth } from "@/app/api/auth/[...nextauth]/options";
import connectMongoDb from '../../../../../lib/mongodb';
import User from '../../../../../models/user';


const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

export async function POST(req) {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { targetUserId, callerName, conversationId, mediaType } = await req.json();


  await pusher.trigger(`private-user-${targetUserId}`, "incoming-call", {
    callerName,
    conversationId,
    mediaType
  });

 
  try {
    await connectMongoDb()
    const user = await User.findById(targetUserId);
    
    if (user?.fcmToken) {
      const message = {
        token: user.fcmToken,
        data: {
          title: 'Incoming Call',
          body: `${callerName} is calling...`,
          conversationId: conversationId,
          mediaType: mediaType,
          type: 'INCOMING_CALL'
        },
        android: { priority: 'high' },
        apns: { payload: { aps: { 'content-available': 1 } } }
      };

      await admin.messaging().send(message);
    }
  } catch (error) {

    console.error('FCM Notification failed:', error);
  }

  return NextResponse.json({ success: true });
}