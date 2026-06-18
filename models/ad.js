import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetLink: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400,
    },
  },
  { timestamps: true }
);

const Ad = mongoose.models.Ad || mongoose.model("Ad", adSchema);

export default Ad;