import mongoose, { Schema } from "mongoose";

const webAuthnCredentialSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  credentialID: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
  transports: [String],
}, { timestamps: true });

const WebAuthnCredential = mongoose.models.WebAuthnCredential || mongoose.model("WebAuthnCredential", webAuthnCredentialSchema);

export default WebAuthnCredential;