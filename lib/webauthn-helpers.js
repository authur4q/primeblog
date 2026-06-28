// lib/webauthn-helpers.js
import WebAuthnCredential from "../models/webAuthnCredential";

/**
 * Finds all stored credentials for a specific user.
 * Used when generating authentication options.
 */
export async function getCredentialsForUser(userId) {
  try {
    const credentials = await WebAuthnCredential.find({ userId });
    return credentials.map(cred => ({
      id: cred.credentialID,
      publicKey: Buffer.from(cred.publicKey, 'base64'),
      counter: cred.counter,
      transports: cred.transports,
    }));
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return [];
  }
}