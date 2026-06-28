import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { webAuthnConfig } from "../../../../../../../lib/webauthn-config";

export async function POST(req) {
  const options = await generateAuthenticationOptions({
    rpID: webAuthnConfig.rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });
  
  // Note: To use resident keys, you must manage challenge storage 
  // globally or via temporary session for this specific login attempt.
  return Response.json(options);
}