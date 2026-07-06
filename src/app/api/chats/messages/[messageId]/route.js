import { NextResponse } from 'next/server';
import Message from '../../../../../../models/messages';
import connectMongoDb from "../../../../../../lib/mongodb"


export async function DELETE(request, { params }) {
    try {
        const { messageId } = params;
        await connectMongoDb()

        
        const deletedMessage = await Message.findByIdAndDelete(messageId);

        if (!deletedMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}