import mongoose, { models, Schema } from "mongoose";        

const postSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true,
        
    },
    content:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true,
    },  
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
    
},{timestamps: true})

postSchema.index({ userId: 1, createdAt: -1 });

postSchema.index({ createdAt: -1 });

const Post = models.Post || mongoose.model("Post", postSchema);

export default Post;