import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const channelName = searchParams.get('channel');
  
  if (!channelName) {
    return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
  }

  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  // Expire in 1 hour
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // The new library uses buildTokenWithUid
  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    0, 
    RtcRole.PUBLISHER,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return NextResponse.json({ token });
}