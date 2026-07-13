"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from "./chat.module.css";

import ShareLocationButton from '../components/ShareLocationButton/ShareLocationButton';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SendHorizontal, Phone, Video, ArrowLeft, MapPin } from 'lucide-react';
import Pusher from 'pusher-js';
import { useCall } from '@/context/CallContext';
 import { useSearchParams } from "next/navigation";
 import { Suspense } from 'react';

const ChatContent = () => {
    const router = useRouter();
    const { isCallOngoing, activeConversationId } = useCall();
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
    const messagesEndRef = useRef(null);

    const searchParams = useSearchParams();
const directChatId = searchParams.get("id");

useEffect(() => {
    if (directChatId && conversations.length > 0) {
        const targetChat = conversations.find(c => c._id === directChatId);
        if (targetChat) {
            setSelectedChat(targetChat);
        }
    }
}, [directChatId, conversations, setSelectedChat]);

useEffect(() => {
    if (selectedChat?._id && selectedChat._id !== directChatId) {
        router.replace(`/chat?id=${selectedChat._id}`);
    }
}, [selectedChat, directChatId, router]);

   



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

        channel.bind("new-message", (incomingMsg) => {
            if (incomingMsg.conversationId === selectedChat._id) {
                setMessages((prev) => {
                    const messageExists = prev.some((msg) => msg._id === incomingMsg._id);
                    if (messageExists) return prev;
                    return [...prev, incomingMsg];
                });
            }
            
            setConversations((prevConvos) =>
                prevConvos.map((convo) =>
                    convo._id === incomingMsg.conversationId
                        ? { ...convo, lastMessage: incomingMsg, updatedAt: incomingMsg.createdAt || new Date().toISOString() }
                        : convo
                ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
            );
        });

        return () => pusherRef.current.unsubscribe(`private-${selectedChat._id}`);
    }, [selectedChat, userId]);

    useEffect(() => {
        if (!userId || !pusherRef.current) return;

        const userChannel = pusherRef.current.subscribe(`user-${userId}-conversations`);

        userChannel.bind("new-conversation", (newConvo) => {
            setConversations((prev) => {
                const exists = prev.some((c) => c._id === newConvo._id);
                if (exists) return prev;
                return [newConvo, ...prev];
            });
        });

        return () => {
            pusherRef.current?.unsubscribe(`user-${userId}-conversations`);
        };
    }, [userId]);

    const handleSendMessage = async (e) => {
        e?.preventDefault?.();
        if (!newMessageText.trim() || !selectedChat) return;
        
        const tempId = Date.now().toString();
        const optimisticMsg = { 
            _id: tempId, 
            senderId: userId, 
            text: newMessageText.trim(), 
            createdAt: new Date().toISOString() 
        };
        
        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessageText("");

        setConversations((prevConversations) =>
            prevConversations.map((chat) => {
                if (chat._id === selectedChat._id) {
                    return {
                        ...chat,
                        lastMessage: optimisticMsg,
                        updatedAt: optimisticMsg.createdAt
                    };
                }
                return chat;
            }).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        );

        try {
            const response = await fetch("/api/chats/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    conversationId: selectedChat._id, 
                    text: optimisticMsg.text, 
                    senderId: userId 
                })
            });

            if (response.ok) {
                const savedMsg = await response.json();
                
                setMessages((prev) =>
                    prev.map((msg) => (msg._id === tempId ? savedMsg : msg))
                );

                setConversations((prevConversations) =>
                    prevConversations.map((chat) => {
                        if (chat._id === selectedChat._id) {
                            return {
                                ...chat,
                                lastMessage: savedMsg,
                                updatedAt: savedMsg.createdAt || new Date().toISOString()
                            };
                        }
                        return chat;
                    }).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                );
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleDeleteMessage = async (messageId, senderId) => {
        console.log("Attempting to delete message:", messageId);
        if (senderId !== userId) return; 
        if (!selectedChat) return;
        await fetch(`/api/chats/messages/${messageId}`, { method: "DELETE" });
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
    };

const handleTyping = (e) => {
    setNewMessageText(e.target.value);
    
    if (selectedChat && pusherRef.current) {
     
        const channelName = `private-${selectedChat._id}`;
        const channel = pusherRef.current.channel(channelName) || pusherRef.current.subscribe(channelName);
        
        
        if (channel.subscribed) {
            channel.trigger("client-typing", { senderId: userId });
        }
    }
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

    const handleGoBack = () => {
        if (window.location.pathname === '/chat') {
            router.push('/');
            return; 
        } else {
            router.back();
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const showbanner = isCallOngoing && activeConversationId === selectedChat?._id;

    if (status === "loading") return <div className={styles.loadingContainer}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={`${styles.chatWrapper} ${selectedChat ? styles.wrapperHasActive : ''}`}>
                <div className={styles.chatSidebar}>
                    <div className={styles.header}>
                        <ArrowLeft onClick={handleGoBack} /> 
                        <h1 className={styles.headerTitle}>chats </h1>
                    </div>
                    <input className={styles.sidebarSearchInput} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
<div className={styles.conversationsList}>
    {Array.isArray(conversations) && conversations
        .filter(c => c.participants?.some(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())))
      
        .sort((a, b) => {
            const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt);
            const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt);
            return timeB - timeA;
        })
        .map(chat => {
            const targetUser = chat.participants.find(p => p._id !== userId);
            
            
            const displayTime = chat.lastMessage?.createdAt || chat.updatedAt;

            return (
                <div key={chat._id} onClick={() => setSelectedChat(chat)} className={`${styles.chatCard} ${selectedChat?._id === chat._id ? styles.chatCardActive : ''}`}>
                    <div className={styles.avatar}>
                        {targetUser?.profilePicture ? (
                            <img src={targetUser.profilePicture} alt={targetUser?.name} className={styles.avatarImage} />
                        ) : (
                            targetUser?.name?.charAt(0).toUpperCase() || "?"
                        )}
                    </div>
                    <div className={styles.chatCardContent}>
                        <div className={styles.chatCardHeader}>
                            <strong className={styles.username}>{targetUser?.name || "New Chat"}</strong>
                           
                            <span className={styles.timestamp}>
                                {displayTime ? new Date(displayTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                            </span>
                        </div>
                        <p className={styles.lastMessage}>
                            {chat.lastMessage && typeof chat.lastMessage === 'object'
                                ? chat.lastMessage.text
                                : ""}
                        </p>
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
                                <div className={styles.backUserName}>
                                    <button className={styles.mobileBackButton} onClick={() => setSelectedChat(null)}><ArrowLeft /></button>
                                    <div className={styles.mainHeaderAvatar}>
                                        {selectedChat.participants?.find(p => p._id !== userId)?.profilePicture ? (
                                            <img 
                                                src={selectedChat.participants.find(p => p._id !== userId).profilePicture} 
                                                alt="Profile" 
                                                className={styles.avatarImage} 
                                            />
                                        ) : (
                                            <div className={styles.avatarFallback}>
                                                {selectedChat.participants?.find(p => p._id !== userId)?.name?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <strong>{selectedChat.participants?.find(p => p._id !== userId)?.name}</strong>
                                </div>
                                {isTyping && <span className={styles.typingIndicator}>typing...</span>}
                                <div className={styles.callButtons}>
                                    <button className={styles.callButton} onClick={() => initiateCall('audio')} disabled={isCalling}><Phone size={20}/></button>
                                    <button className={styles.callButton} onClick={() => initiateCall('video')} disabled={isCalling}><Video size={20}/></button>
                                </div>
                            </div>
                            <div className={styles.messagesContainer}>
                                {showbanner && (
                                    <div className={styles.callBanner}>
                                        <span>Ongoing Call</span>
                                        <button onClick={() => router.push(`/call/${activeConversationId}`)}>
                                            Return
                                        </button>
                                    </div>
                                )}
                                    {(messages ?? []).map(msg => {
   
    const msgSenderId = typeof msg.senderId === 'object' && msg.senderId !== null 
        ? msg.senderId._id 
        : msg.senderId;
        
    const isOwnMessage = String(msgSenderId) === String(userId);

    return (
        <div key={msg._id} className={`${styles.messageGroup} ${isOwnMessage ? styles.groupMe : ''}`}>
            <div className={styles.messageBubbleContainer}>
                <div 
                    onDoubleClick={() => handleDeleteMessage(msg._id, msg.senderId)} 
                    className={`${styles.messageBubble} ${isOwnMessage ? styles.messageMe : styles.messageThem}`}
                >
                    {msg.text.startsWith('http') ? (
                        <a href={msg.text} target="_blank" rel="noopener noreferrer" style={{ color: 'red', textDecoration: 'underline' }}>
                            <MapPin size={34}/>
                        </a>
                    ) : (msg.text)}
                </div>
                <span className={styles.messageTimestamp}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
            </div>
        </div>
    );
})}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className={styles.messageForm}>
                                <ShareLocationButton className={styles.shareLocation} onLocationShare={(link) => setNewMessageText(prev => prev + " " + link)} />
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


const ChatPage = () => {
    return (
        <Suspense fallback={<div>Loading workspace...</div>}>
            <ChatContent />
        </Suspense>
    );
};

export default ChatPage;