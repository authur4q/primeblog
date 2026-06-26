import mongoose, { models, Schema } from "mongoose";

const postSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    tags: { type: [String], default: [] },
    category: { type: String, default: "General" },
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });


postSchema.index({ status: 1, createdAt: -1 });


postSchema.index({ userId: 1, createdAt: -1 });

postSchema.index({ tags: 1 });
postSchema.index({ category: 1 });


const Post = models.Post || mongoose.model("Post", postSchema);

export default Post;