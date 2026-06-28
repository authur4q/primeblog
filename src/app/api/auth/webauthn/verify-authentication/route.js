import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { webAuthnConfig } from "../../../../../../lib/webauthn-config";
import connectMongoDb from "../../../../../../lib/mongodb";
import User from "../../../../../../models/user";

export async function POST(req) {
  try {
    const { assertion, userId } = await req.json();
    await connectMongoDb();

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Normalize and find the credential
    // We convert the stored Binary/Buffer credentialID to a base64url string 
    // to match the format of assertion.id
    const credential = user.devices.find((d) => {
      let storedId = d.credentialID;
      
      // If it's a BSON Binary or Buffer, convert to base64url
      if (storedId && typeof storedId !== 'string') {
        storedId = Buffer.from(storedId.buffer || storedId).toString('base64url');
      }
      
      return storedId === assertion.id;
    });

    if (!credential) {
      return Response.json(
        { error: "Authenticator not recognized. Please register this device." },
        { status: 404 }
      );
    }

    // 2. Ensure credentialPublicKey is a Uint8Array
    const pubKeyBuffer = typeof credential.credentialPublicKey === 'string'
      ? Uint8Array.from(atob(credential.credentialPublicKey), c => c.charCodeAt(0))
      : new Uint8Array(credential.credentialPublicKey.buffer || credential.credentialPublicKey);

    // 3. Verify the assertion
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: user.webAuthnChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
      authenticator: {
        credentialPublicKey: pubKeyBuffer,
        credentialID: credential.credentialID,
        counter: credential.counter,
      },
    });

    if (verification.verified) {
      const { newCounter } = verification.authenticationInfo;
      
      user.devices = user.devices.map((d) => {
        let storedId = d.credentialID;
        if (storedId && typeof storedId !== 'string') {
          storedId = Buffer.from(storedId.buffer || storedId).toString('base64url');
        }
        return storedId === assertion.id ? { ...d, counter: newCounter } : d;
      });
      
      user.webAuthnChallenge = null;
      await user.save();
      
      return Response.json({ verified: true });
    }

    return Response.json({ error: "Verification failed" }, { status: 400 });
  } catch (err) {
    console.error("Verification Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}