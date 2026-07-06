"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import styles from "./call.module.css";

export default function CallPageContent() {
    const { conversationId } = useParams();
    const searchParams = useSearchParams();
    const mediaType = searchParams.get('type') || 'audio';
    
    const [joined, setJoined] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState({});
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [mutedAudio, setMutedAudio] = useState(false);
    const [mutedVideo, setMutedVideo] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(2);
    const [error, setError] = useState(null);
    
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});
    const clientRef = useRef(null);
    const tracksRef = useRef({ audio: null, video: null });

    const handleUserPublished = useCallback(async (user, type) => {
        const client = clientRef.current;
        await client.subscribe(user, type);
        if (type === 'audio') user.audioTrack?.play();
        if (type === 'video') setRemoteUsers(prev => ({ ...prev, [user.uid]: user }));
    }, []);

    const toggleAudio = async () => {
        const track = tracksRef.current.audio;
        await track.setEnabled(mutedAudio);
        setMutedAudio(!mutedAudio);
    };

    const toggleVideo = async () => {
        const track = tracksRef.current.video;
        await track.setEnabled(mutedVideo);
        setMutedVideo(!mutedVideo);
    };

    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            localVideoTrack.play(localVideoRef.current);
        }
    }, [localVideoTrack, joined]);

    const startCall = async () => {
        try {
            const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
            const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            clientRef.current = client;

            client.on("user-published", handleUserPublished);
            client.on("user-unpublished", (user) => {
                setRemoteUsers(prev => {
                    const next = { ...prev };
                    delete next[user.uid];
                    return next;
                });
            });
            client.on("network-quality", (q) => setNetworkQuality(q.uplinkNetworkQuality));

            const res = await fetch(`/api/agora/token?channel=${conversationId}`);
            const { token } = await res.json();
            await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID, conversationId, token, null);

            const [audio, video] = await Promise.all([
                AgoraRTC.createMicrophoneAudioTrack(),
                mediaType === 'video' ? AgoraRTC.createCameraVideoTrack() : null
            ]);

            tracksRef.current = { audio, video };
            setLocalVideoTrack(video);
            await client.publish(video ? [audio, video] : [audio]);
            
            client.remoteUsers.forEach(u => handleUserPublished(u, "video"));
            setJoined(true);
        } catch (err) {
            setError("Connection failed. Check permissions.");
        }
    };

    const leaveCall = () => {
        Object.values(tracksRef.current).forEach(t => t?.close());
        clientRef.current?.leave();
        window.location.href = '/chat';
    };

    useEffect(() => {
        Object.entries(remoteUsers).forEach(([uid, user]) => {
            const container = remoteVideoRefs.current[uid];
            if (container && user.videoTrack) {
                container.innerHTML = '';
                user.videoTrack.play(container);
            }
        });
    }, [remoteUsers]);

    if (!joined) return (
        <div className={styles.lobby}>
            <button onClick={startCall} className={styles.btnJoin}>Join Call</button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.networkIndicator}>
                Signal: {networkQuality > 3 ? "Weak" : "Strong"}
            </div>
            <div className={styles.remoteView}>
                {Object.values(remoteUsers).map(user => (
                    <div key={user.uid} ref={el => remoteVideoRefs.current[user.uid] = el} className={styles.videoPlayer} />
                ))}
            </div>
            <div className={styles.localView} ref={localVideoRef} />
            <div className={styles.controls}>
                <button onClick={toggleAudio}>{mutedAudio ? "Unmute" : "Mute"}</button>
                <button className={styles.btnEnd} onClick={leaveCall}>End Call</button>
                <button onClick={toggleVideo}>{mutedVideo ? "Show Cam" : "Hide Cam"}</button>
            </div>
        </div>
    );
}