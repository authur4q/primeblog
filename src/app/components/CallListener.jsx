"use client";
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';
import { useCall } from '@/context/CallContext'; 

export default function CallListener() {
    const { data: session } = useSession();
    const { setActiveConversationId, setCallerName, setMediaType } = useCall();
    const pusherRef = useRef(null);

    useEffect(() => {
        if (!session?.user?.id) return;

        pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth'
        });

        const channel = pusherRef.current.subscribe(`private-user-${session.user.id}`);

        channel.bind("incoming-call", (data) => {
            
            setActiveConversationId(data.conversationId);
            setCallerName(data.callerName);
            setMediaType(data.mediaType);
        });

        return () => {
            if (pusherRef.current) {
                pusherRef.current.unsubscribe(`private-user-${session.user.id}`);
                pusherRef.current.disconnect();
            }
        };
    }, [session?.user?.id, setActiveConversationId, setCallerName, setMediaType]);

    return null;
}