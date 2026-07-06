"use client";
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

export default function CallListener() {
    const { data: session } = useSession();
    const router = useRouter();
    const pusherRef = useRef(null);

    useEffect(() => {
        if (!session?.user?.id) return;

       
        pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth'
        });

    
        const channel = pusherRef.current.subscribe(`private-user-${session.user.id}`);

        channel.bind("incoming-call", (data) => {
        
            const accept = confirm(`Incoming call from ${data.callerName}! Accept?`);
            
            if (accept) {
                router.push(`/call/${data.conversationId}?type=${data.mediaType}`);
            }
        });

        return () => {
            if (pusherRef.current) {
                pusherRef.current.unsubscribe(`private-user-${session.user.id}`);
                pusherRef.current.disconnect();
            }
        };
    }, [session?.user?.id, router]);

    return null;
}