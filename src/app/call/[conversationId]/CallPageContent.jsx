"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import styles from "./call.module.css";
import { useCall } from '@/context/CallContext';
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Loader2, Wifi, WifiHigh, WifiLow, WifiZero } from 'lucide-react';

export default function CallPageContent() {
    const { setIsCallOngoing, setActiveConversationId, setCallMode } = useCall();
    const { conversationId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const mediaType = searchParams.get('type') || 'audio';
    
    // UI States
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState({});
    const [mutedAudio, setMutedAudio] = useState(false);
    const [mutedVideo, setMutedVideo] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(2);
    const [error, setError] = useState(null);
    
    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});
    const clientRef = useRef(null);
    const tracksRef = useRef({ audio: null, video: null });

    const getWifiIcon = (quality) => {
        switch (quality) {
            case 0: return <Wifi size={20} />;
            case 1: return <WifiHigh size={20} />;
            case 2: return <WifiLow size={20} />;
            case 3: return <WifiZero size={20} />;
            default: return <Wifi size={20} />;
        }
    };

    const cleanupResources = useCallback(async () => {
        Object.values(tracksRef.current).forEach(track => {
            if (track) {
                track.stop();
                track.close();
            }
        });
        tracksRef.current = { audio: null, video: null };

        if (clientRef.current) {
            await clientRef.current.leave();
            clientRef.current = null;
        }
        setRemoteUsers({});
    }, []);

    useEffect(() => {
        return () => { cleanupResources(); };
    }, [cleanupResources]);

    const handleUserPublished = useCallback(async (user, type) => {
        if (!clientRef.current) return;
        try {
            await clientRef.current.subscribe(user, type);
            if (type === 'audio') user.audioTrack?.play();
            if (type === 'video') setRemoteUsers(prev => ({ ...prev, [user.uid]: user }));
        } catch (err) { console.error("Subscription failed", err); }
    }, []);

const startCall = async () => {
        setIsJoining(true);
        setError(null);
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

            const res = await fetch(`/api/agora/token?channel=${conversationId}`);
            if (!res.ok) throw new Error("Failed to fetch token");
            const { token } = await res.json();
            
            await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID, conversationId, token, null);

            const [audio, video] = await Promise.all([
                AgoraRTC.createMicrophoneAudioTrack(),
                mediaType === 'video' ? AgoraRTC.createCameraVideoTrack() : null
            ]);

            tracksRef.current = { audio, video };
            
            // 1. Change layout state to mount the video containers in the DOM
            setJoined(true);
            setIsCallOngoing(true);
            setActiveConversationId(conversationId);

            // 2. Allow React a frame to mount the ref before playing
            setTimeout(() => {
                if (video && localVideoRef.current) {
                    video.play(localVideoRef.current);
                }
            }, 100);
            
            // 3. Publish tracks to the channel
            await client.publish(video ? [audio, video] : [audio]);
        } catch (err) {
            setError("Connection failed. Check permissions.");
            cleanupResources();
        } finally {
            setIsJoining(false);
        }
    };

    const leaveCall = async () => {
        await cleanupResources();
        setIsCallOngoing(false);
        setActiveConversationId(null);
        setCallMode(null);
        router.replace('/chat');
    };

    if (!joined) return (
        <div className={styles.lobby}>
            {isJoining ? (
                <div className={styles.loadingOverlay}>
                    <Loader2 className={styles.spinner} />
                    <p>Connecting to secure line...</p>
                    <button onClick={cleanupResources} className={styles.btnCancel}>Cancel</button>
                </div>
            ) : (
                <button onClick={startCall} className={styles.btnJoin}>Join Call</button>
            )}
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );

    return (
        <div className={styles.callPageContainer}>
            <div className={styles.networkIndicator}>
                {getWifiIcon(networkQuality)}
            </div>
            <div className={styles.remoteView}>
                {Object.values(remoteUsers).map(user => (
                    <div key={user.uid} ref={el => { if (el) remoteVideoRefs.current[user.uid] = el; }} className={styles.videoPlayer} />
                ))}
            </div>
            <div className={styles.localView} ref={localVideoRef} />
            <div className={styles.controls}>
                <button onClick={() => { tracksRef.current.audio?.setEnabled(mutedAudio); setMutedAudio(!mutedAudio); }}>
                    {mutedAudio ? <MicOff /> : <Mic />}
                </button>
                <button className={styles.btnEnd} onClick={leaveCall}><PhoneOff /></button>
                <button onClick={() => { tracksRef.current.video?.setEnabled(mutedVideo); setMutedVideo(!mutedVideo); }}>
                    {mutedVideo ? <CameraOff /> : <Camera />}
                </button>
            </div>
        </div>
    );
}