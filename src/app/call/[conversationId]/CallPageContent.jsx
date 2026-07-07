"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import styles from "./call.module.css";
import { useCall } from '@/context/CallContext';
import { ArrowLeft, Mic, MicOff, Camera, CameraOff, PhoneOff, Wifi, WifiHigh, WifiLow, WifiZero } from 'lucide-react';

export default function CallPageContent() {
    const { setIsCallOngoing, setActiveConversationId, setCallMode } = useCall();
    const { conversationId } = useParams();
    const router = useRouter();
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

    const getWifiIcon = (quality) => {
        switch (quality) {
            case 0: return <Wifi size={24} />;
            case 1: return <WifiHigh size={24} />;
            case 2: return <WifiLow size={24} />;
            case 3: return <WifiZero size={24} />;
            default: return <Wifi size={24} />;
        }
    };

    const toggleAudio = async () => {
        if (!tracksRef.current.audio) return;
        await tracksRef.current.audio.setEnabled(mutedAudio);
        setMutedAudio(!mutedAudio);
    };

    const toggleVideo = async () => {
        if (!tracksRef.current.video) return;
        await tracksRef.current.video.setEnabled(mutedVideo);
        setMutedVideo(!mutedVideo);
    };

    const goBack = () => router.push(`/chat`);

    
    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoTrack.play(localVideoRef.current);
            } else {
                localVideoRef.current.innerHTML = '';
            }
        }
    }, [localVideoTrack]);

    const startCall = async () => {
        setIsCallOngoing(true);
        setActiveConversationId(conversationId);
        setCallMode(null); 
        
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

    const leaveCall = async () => {
        
        Object.values(tracksRef.current).forEach(track => {
            if (track) {
                track.stop();
                track.close();
            }
        });
        tracksRef.current = { audio: null, video: null };
        setLocalVideoTrack(null);

        if (clientRef.current) {
            await clientRef.current.leave();
        }

        setIsCallOngoing(false);
        setActiveConversationId(null);
        setCallMode(null);
        
        router.replace('/chat');
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
        <div className={styles.callPageContainer}>
            <div className={styles.networkIndicator}>
                <ArrowLeft onClick={goBack} />
                {getWifiIcon(networkQuality)}
            </div>
            <div className={styles.remoteView}>
                {Object.values(remoteUsers).map(user => (
                    <div key={user.uid} ref={el => remoteVideoRefs.current[user.uid] = el} className={styles.videoPlayer} />
                ))}
            </div>
            <div className={styles.localView} ref={localVideoRef} />
            <div className={styles.controls}>
                <button onClick={toggleAudio}>{mutedAudio ? <MicOff /> : <Mic />}</button>
                <button className={styles.btnEnd} onClick={leaveCall}><PhoneOff /></button>
                <button onClick={toggleVideo}>{mutedVideo ? <CameraOff /> : <Camera />}</button>
            </div>
        </div>
    );
}