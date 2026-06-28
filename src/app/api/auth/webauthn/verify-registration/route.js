
import { webAuthnConfig } from "../../../../../../lib/webauthn-config";
import WebAuthnCredential from ".././../../../../../models/webAuthnCredential";
import connectMongoDb from "../../../../../../lib/mongodb";
import User from "../../../../../../models/user"

import { verifyRegistrationResponse } from "@simplewebauthn/server";



export async function POST(req) {
  try {
    // 1. Read the body ONCE
    const data = await req.json();
    const { attestation, userId, currentChallenge } = data;

    console.log(currentChallenge)

    if (!attestation || !userId) {
      return new Response("Missing required fields", { status: 400 });
    }

    await connectMongoDb();

    // 2. Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // 3. Verify the registration response
    // The library compares the browser's response against your expected challenge
    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge: currentChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
    });

    if (verification.verified) {
      // 4. Save the new credential to your User model
      const { registrationInfo } = verification;
      
      user.devices = user.devices || [];
      user.devices.push({
        credentialID: registrationInfo.credentialID,
        credentialPublicKey: registrationInfo.credentialPublicKey,
        counter: registrationInfo.counter,
        transports: attestation.transports,
      });

      await user.save();

      return Response.json({ verified: true });
    } else {
      return new Response("Verification failed", { status: 400 });
    }
  } catch (err) {
    console.error("Verification error:", err);
    return new Response("Internal Server Error: " + err.message, { status: 500 });
  }
}