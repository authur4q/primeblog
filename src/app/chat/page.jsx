"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from "./chat.module.css";
import Navbar from '../components/navbar/navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, SendHorizontal, Phone, Video } from 'lucide-react';
import Pusher from 'pusher-js';

const ChatPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [isCalling, setIsCalling] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const pusherRef = useRef(null);

    useEffect(() => { 
        if (status === "unauthenticated") router.push("/login"); 
        if (status === "authenticated") {
            pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
                authEndpoint: '/api/pusher/auth'
            });
        }
        return () => pusherRef.current?.disconnect();
    }, [status]);

    useEffect(() => {
        if (!selectedChat || !pusherRef.current) return;
        const channel = pusherRef.current.subscribe(`private-${selectedChat._id}`);
        
        channel.bind("client-typing", (data) => {
            if (data.senderId !== userId) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 2000);
            }
        });
        return () => pusherRef.current.unsubscribe(`private-${selectedChat._id}`);
    }, [selectedChat, userId]);

    const handleTyping = (e) => {
        setNewMessageText(e.target.value);
        if (selectedChat) {
            const channel = pusherRef.current.subscribe(`private-${selectedChat._id}`);
            channel.trigger("client-typing", { senderId: userId });
        }
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault?.();
        if (!newMessageText.trim() || !selectedChat) return;
        
        const tempId = Date.now().toString();
        const optimisticMsg = { _id: tempId, senderId: userId, text: newMessageText.trim(), createdAt: new Date().toISOString() };
        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessageText("");

        await fetch("/api/chats/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: selectedChat._id, text: optimisticMsg.text, senderId: userId })
        });
    };

    const initiateCall = async (mediaType = 'audio') => {
        if (!selectedChat || isCalling) return;
        setIsCalling(true);
        const otherUser = selectedChat.participants.find(p => p._id !== userId);
        try {
            await fetch('/api/calls/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetUserId: otherUser._id, 
                    callerName: session.user.name, 
                    conversationId: selectedChat._id, 
                    mediaType 
                })
            });
            router.push(`/call/${selectedChat._id}?type=${mediaType}`);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsCalling(false); 
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/chats/conversation")
                .then(async (res) => res.ok ? res.json() : [])
                .then(data => {
                    const list = Array.isArray(data) ? data : (data?.conversations || []);
                    setConversations(list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)));
                });
        }
    }, [status]);

    useEffect(() => {
        if (selectedChat) {
            fetch(`/api/chats/messages?conversationId=${selectedChat._id}`)
                .then(async (res) => res.ok ? res.json() : [])
                .then(data => setMessages(Array.isArray(data) ? data : []));
        }
    }, [selectedChat]);

    if (status === "loading") return <div className={styles.loadingContainer}>Loading...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={`${styles.chatWrapper} ${selectedChat ? styles.wrapperHasActive : ''}`}>
                <div className={styles.chatSidebar}>
                    <input className={styles.sidebarSearchInput} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <div className={styles.conversationsList}>
                        {(conversations ?? []).filter(c => c.participants?.some(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))).map(chat => {
                            const lastMsg = chat.lastMessage || (chat.messages?.[chat.messages.length - 1]);
                            return (
                                <div key={chat._id} onClick={() => setSelectedChat(chat)} className={`${styles.chatCard} ${selectedChat?._id === chat._id ? styles.chatCardActive : ''}`}>
                                    <div className={styles.avatar}>{chat.participants.find(p => p._id !== userId)?.name?.charAt(0).toUpperCase() || "?"}</div>
                                    <div className={styles.chatCardContent}>
                                        <strong className={styles.username}>{chat.participants.find(p => p._id !== userId)?.name}</strong>
                                        <p className={styles.lastMessagePreview}>{lastMsg?.text || "Start a conversation..."}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.chatMain}>
                    {selectedChat ? (
                        <>
                            <div className={styles.mainHeader}>
                                <button className={styles.mobileBackButton} onClick={() => setSelectedChat(null)}><ChevronLeft /></button>
                                <strong>{selectedChat.participants?.find(p => p._id !== userId)?.name}</strong>
                                {isTyping && <span className={styles.typingIndicator}>typing...</span>}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className={styles.callButton} onClick={() => initiateCall('audio')} disabled={isCalling}><Phone size={20}/></button>
                                    <button className={styles.callButton} onClick={() => initiateCall('video')} disabled={isCalling}><Video size={20}/></button>
                                </div>
                            </div>
                            <div className={styles.messagesContainer}>
                                {(messages ?? []).map(msg => (
                                    <div key={msg._id} className={`${styles.messageGroup} ${msg.senderId === userId ? styles.groupMe : ''}`}>
                                        <div className={`${styles.messageBubble} ${msg.senderId === userId ? styles.messageMe : styles.messageThem}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSendMessage} className={styles.messageForm}>
                                <textarea className={styles.messageInput} value={newMessageText} onChange={handleTyping} placeholder="Message..." />
                                <button type="submit" className={styles.sendButton}><SendHorizontal size={30} /></button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.noChatSelected}>Select a chat to start</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;