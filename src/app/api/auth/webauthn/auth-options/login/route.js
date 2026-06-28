import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { webAuthnConfig } from "../../../../../../../lib/webauthn-config";

export async function POST(req) {
  const options = await generateAuthenticationOptions({
    rpID: webAuthnConfig.rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });
  

  return Response.json(options);
}