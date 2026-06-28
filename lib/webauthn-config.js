// lib/webauthn-config.js
export const webAuthnConfig = {
  // The RP ID must be the domain of your site (without protocol)
  // For local dev, this is usually 'localhost'
  rpID: process.env.RP_ID || 'localhost',
  
  // The name that appears in the browser's native biometric prompt
  rpName: process.env.RP_NAME || 'Prime',
  
  // The full URL of your site, used for origin verification
  origin: process.env.RP_ORIGIN || 'http://localhost:3000',
};