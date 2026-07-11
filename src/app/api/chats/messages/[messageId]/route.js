import { NextResponse } from 'next/server';
import Message from '../../../../../../models/messages';
import Conversation from '../../../../../../models/conversation';
import connectMongoDb from "../../../../../../lib/mongodb";
import redis from '../../../../../../lib/redis';

export async function DELETE(request, { params }) {
    try {
        const { messageId } = await params;
        await connectMongoDb();

        const deletedMessage = await Message.findByIdAndDelete(messageId);

        if (!deletedMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        const { conversationId, senderId, receiverId } = deletedMessage;

        if (conversationId) {
           n
            const nextLatestMessage = await Message.findOne({ conversationId })
                .sort({ createdAt: -1 });

 
            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: nextLatestMessage ? nextLatestMessage._id : null
            });

            const historyPattern = `messages:${conversationId}:*`;
            const matchingHistoryKeys = await redis.keys(historyPattern);
            if (matchingHistoryKeys.length > 0) {
                await redis.del(...matchingHistoryKeys);
            }

           
            if (senderId) {
                await redis.del(`conversations:${senderId}`);
                await redis.del(`user:${senderId}:chats`);
            }
            if (receiverId) {
                await redis.del(`conversations:${receiverId}`);
                await redis.del(`user:${receiverId}:chats`);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Delete Message Flow Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}