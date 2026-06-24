import mongoose, { models, Schema } from "mongoose";        

const commentSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    }
    
}, { timestamps: true });

const Comment = models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;