"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from "./chat.module.css";
import Navbar from '../components/navbar/navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, SendHorizontal } from 'lucide-react';
import Pusher from 'pusher-js';

let pusherClient;

const ChatPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState("");
    const messagesEndRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");

   
    if (!pusherClient && typeof window !== "undefined") {
        pusherClient = new Pusher(process.env.PUSHER_KEY || '', { 
            cluster: process.env.PUSHER_CLUSTER || '' 
        });
    }

    useEffect(() => { 
        if (status === "unauthenticated") router.push("/login"); 
    }, [status, router]);


    const handleSendMessage = async (e) => {
        e.preventDefault();
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


    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/chats/conversation")
                .then(async (res) => {
                    if (!res.ok) return [];
                    return res.json();
                })
                .then(data => {
                    setConversations(Array.isArray(data) ? data : (data.conversations || []));
                })
                .catch(err => console.error("Fetch error:", err));
        }
    }, [status]);

 
    useEffect(() => {
        if (selectedChat) {
            fetch(`/api/chats/messages?conversationId=${selectedChat._id}`)
                .then(async (res) => {
                    if (!res.ok) return [];
                    return res.json();
                })
                .then(data => setMessages(Array.isArray(data) ? data : []))
                .catch(err => console.error("Messages fetch error:", err));
        }
    }, [selectedChat]);


    useEffect(() => {
        if (!selectedChat || !pusherClient) return;

        const channel = pusherClient.subscribe(selectedChat._id);
        channel.bind("new-message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            pusherClient.unsubscribe(selectedChat._id);
        };
    }, [selectedChat]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (status === "loading") return <div className={styles.loadingContainer}>Loading...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={`${styles.chatWrapper} ${selectedChat ? styles.wrapperHasActive : ''}`}>
                <div className={styles.chatSidebar}>
                    <h3 className={styles.sidebarHeading}>Chats</h3>
                    <input className={styles.sidebarSearchInput} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <div className={styles.conversationsList}>
                        {Array.isArray(conversations) && conversations
                            .filter(c => c.participants?.some(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())))
                            .map(chat => (
                                <div key={chat._id} onClick={() => setSelectedChat(chat)} className={`${styles.chatCard} ${selectedChat?._id === chat._id ? styles.chatCardActive : ''}`}>
                                    <strong className={styles.username}>{chat.participants.find(p => p._id !== userId)?.name}</strong>
                                    <p className={styles.lastMessage}>{chat.lastMessage}</p>
                                </div>
                        ))}
                    </div>
                </div>

                <div className={styles.chatMain}>
                    {selectedChat ? (
                        <>
                            <div className={styles.mainHeader}>
                                <button className={styles.mobileBackButton} onClick={() => setSelectedChat(null)}><ChevronLeft /></button>
                                <strong>{selectedChat.participants.find(p => p._id !== userId)?.name}</strong>
                            </div>
                            <div className={styles.messagesContainer}>
                                {messages.map(msg => (
                                    <div key={msg._id} className={`${styles.messageGroup} ${msg.senderId === userId ? styles.groupMe : ''}`}>
                                        <div className={`${styles.messageBubble} ${msg.senderId === userId ? styles.messageMe : styles.messageThem}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className={styles.messageForm}>
                                <input className={styles.messageInput} value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} placeholder="Message..." />
                                <button type="submit" className={styles.sendButton}><SendHorizontal size={20} /></button>
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