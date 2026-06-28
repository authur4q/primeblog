import { generateRegistrationOptions } from "@simplewebauthn/server";
import { webAuthnConfig } from "../../../../../../lib/webauthn-config";
import connectMongoDb from "../../../../../../lib/mongodb";
import User from "../../../../../../models/user";



export async function POST(req) {
  try {
    const { userId } = await req.json();
    await connectMongoDb();
    const user = await User.findById(userId);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const options = await generateRegistrationOptions({
      rpName: "Prime Secure Platform",
      rpID: webAuthnConfig.rpID,
      userID: userId.toString(), 
      userName: user.email,
      userDisplayName: user.name,
      
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    user.webAuthnChallenge = options.challenge;
    await user.save();

    return Response.json(options);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}