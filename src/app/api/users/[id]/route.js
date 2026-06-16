import { NextResponse } from "next/server"
import User from "../../../../../models/user" // Required to register the Schema model in Mongoose runtime for .populate() to work safely
import mongoose from "mongoose"
import connectMongoDb from "../../../../../lib/mongodb"

export const GET = async (req, { params }) => {
    try {
        const { id } = await params

   
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`Invalid MongoDB ObjectId format received: ${id}`)
            return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
        }

        await connectMongoDb()
        

        const user = await User.findById(id).select("-password")
        
        if (!user) {
            console.error(`User account with ID ${id} was not found in MongoDB.`)
            return NextResponse.json({ error: "User profile not found" }, { status: 404 })
        }
        
        return NextResponse.json(user, { status: 200 })
    } catch (error) {
        console.error("Critical error in GET /api/users/[id]:", error)
        return NextResponse.json({ error: "Server error retrieving profile details" }, { status: 500 })
    }
}