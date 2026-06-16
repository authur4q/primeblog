import { NextResponse } from "next/server"
import connectMongoDb from "../../../../lib/mongodb"
import Post from "../../../../models/post"


export const POST = async (req) => {
    const {title,description,content,userId,name} = await req.json()

    try {
        await connectMongoDb()
        const post = {
        title,
        description,
        content,
        userId,
        name
        }
        await Post.create(post)
        
        
        
        return NextResponse.json({message:"post created successfully"},{status:201})
        
    } catch (error) {
                return NextResponse.json({message:"post not created successfully"},{status:500})
    }
}

export const GET = async (req) => {
    const url = new URL(req.url)
    const userId =  url.searchParams.get("userId")
    

    try {
        await connectMongoDb()

        const posts = await Post.find(userId ? { userId } : {}).sort({createdAt:-1})
        return NextResponse.json(posts,{status:200})

    } catch (error) {
                return NextResponse.json({status:500})
    }
    
}