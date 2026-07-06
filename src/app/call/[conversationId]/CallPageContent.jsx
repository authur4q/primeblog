"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import styles from "./call.module.css";

export default function CallPageContent() {
    const { conversationId } = useParams();
    const searchParams = useSearchParams();
    const mediaType = searchParams.get('type') || 'audio';
    
    const [status, setStatus] = useState("Initializing...");
    const [remoteUsers, setRemoteUsers] = useState({});
    const [AgoraRTC, setAgoraRTC] = useState(null);
    
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});
    const clientRef = useRef(null);
    const tracksRef = useRef({ audio: null, video: null });

    useEffect(() => {
        import('agora-rtc-sdk-ng').then((module) => {
            setAgoraRTC(module.default);
        });
    }, []);

    useEffect(() => {
        if (!AgoraRTC || !conversationId) return;

        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        const client = clientRef.current;

        const initCall = async () => {
            try {
                setStatus("Fetching credentials...");
                const response = await fetch(`/api/agora/token?channel=${conversationId}`);
                if (!response.ok) throw new Error("Failed to fetch token");
                const { token } = await response.json();

                setStatus("Joining channel...");
                await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID, conversationId, token, null);

                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                tracksRef.current.audio = audioTrack;

                let videoTrack = null;
                if (mediaType === 'video') {
                    videoTrack = await AgoraRTC.createCameraVideoTrack();
                    tracksRef.current.video = videoTrack;
                    if (localVideoRef.current) videoTrack.play(localVideoRef.current);
                }

                await client.publish(videoTrack ? [audioTrack, videoTrack] : [audioTrack]);
                setStatus("Connected");
            } catch (error) {
                console.error("Agora Error:", error);
                setStatus("Connection Error: " + error.message);
            }
        };

        client.on("user-published", async (user, type) => {
            await client.subscribe(user, type);
            setRemoteUsers(prev => ({ ...prev, [user.uid]: user }));
        });

        client.on("user-unpublished", (user) => {
            setRemoteUsers(prev => {
                const next = { ...prev };
                delete next[user.uid];
                return next;
            });
        });

        initCall();

        return () => {
            tracksRef.current.audio?.close();
            tracksRef.current.video?.close();
            if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
                client.leave();
            }
            client.removeAllListeners();
        };
    }, [AgoraRTC, conversationId, mediaType]);

    useEffect(() => {
        Object.entries(remoteUsers).forEach(([uid, user]) => {
            if (user.videoTrack && remoteVideoRefs.current[uid]) {
                user.videoTrack.play(remoteVideoRefs.current[uid]);
            }
        });
    }, [remoteUsers]);

    return (
        <div className={styles.callContainer}>
            {status !== "Connected" ? (
                <h1 className={styles.statusHeader}>{status}</h1>
            ) : (
                <div className={styles.activeCallUI}>
                    <div className={styles.videoGrid}>
                        {mediaType === 'video' && <div ref={localVideoRef} className={styles.localVideo} />}
                        {Object.values(remoteUsers).map(user => (
                            <div 
                                key={user.uid} 
                                ref={el => remoteVideoRefs.current[user.uid] = el} 
                                className={styles.remoteVideo} 
                            />
                        ))}
                    </div>
                    <button className={styles.endCallButton} onClick={() => window.location.href = '/chat'}>
                        End Call
                    </button>
                </div>
            )}
        </div>
    );
}