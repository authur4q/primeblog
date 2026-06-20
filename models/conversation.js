import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
export default Conversation;