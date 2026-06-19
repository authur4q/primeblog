"use client"
import React, { useEffect, useState, useRef } from 'react'
import styles from "./chat.module.css"
import Navbar from '../components/navbar/page'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Pusher from 'pusher-js'

const ChatPage = () => {
    const router = useRouter()
    const { data: session, status } = useSession()
    const userId = session?.user?.id

    const [conversations, setConversations] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessageText, setNewMessageText] = useState("")
    const messagesEndRef = useRef(null)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    useEffect(() => {
        if (!userId) return

        const fetchConversations = async () => {
            try {
                const res = await fetch("/api/chats/conversation")
                if (res.ok) {
                    const chatData = await res.json()
                    setConversations(chatData)
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchConversations()
    }, [userId])

    useEffect(() => {
        if (!selectedChat) return

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chats/messages?conversationId=${selectedChat._id}`)
                if (res.ok) {
                    const msgData = await res.json()
                    setMessages(msgData)
                }
            } catch (err) {
                console.error(err)
            }
        }

        fetchMessages()

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
        })

        const channel = pusher.subscribe(`chat_${selectedChat._id}`)
        channel.bind('incoming-message', (data) => {
            setMessages((prev) => {
                if (prev.some(msg => msg._id === data._id)) return prev
                return [...prev, data]
            })
            
            setConversations((prevChats) => 
                prevChats.map(chat => 
                    chat._id === selectedChat._id 
                        ? { ...chat, lastMessage: data.text } 
                        : chat
                )
            )
        })

        return () => {
            channel.unbind_all()
            channel.unsubscribe()
            pusher.disconnect()
        }
    }, [selectedChat])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessageText.trim() || !selectedChat || !userId) return

        const originalText = newMessageText
        setNewMessageText("")

        try {
            const res = await fetch("/api/chats/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: selectedChat._id,
                    senderId: userId,
                    text: originalText
                })
            })

            if (res.ok) {
                const savedMsg = await res.json()
                setMessages((prev) => [...prev, savedMsg])
                
                setConversations((prevChats) => 
                    prevChats.map(chat => 
                        chat._id === selectedChat._id 
                            ? { ...chat, lastMessage: savedMsg.text } 
                            : chat
                    )
                )
            } else {
                setNewMessageText(originalText)
            }
        } catch (err) {
            console.error(err)
            setNewMessageText(originalText)
        }
    }

    const formatTimestamp = (dateString) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    if (status === "loading") {
        return <div className={styles.loadingContainer}>Loading Chats...</div>
    }

    if (status === "authenticated") {
        const hasActiveChat = selectedChat !== null

        return (
            <div className={styles.container}>
                <Navbar />
                
                <div className={`${styles.chatWrapper} ${hasActiveChat ? styles.wrapperHasActive : ''}`}>
                    <div className={styles.chatSidebar}>
                        <h3 className={styles.sidebarHeading}>Chats</h3>
                        <div className={styles.conversationsList}>
                            {conversations.length > 0 ? (
                                conversations.map(chat => {
                                    const secondaryUser = chat.participants.find(p => p._id !== userId)
                                    const isSelected = selectedChat?._id === chat._id
                                    
                                    const displayPreview = isSelected && messages.length > 0
                                        ? messages[messages.length - 1].text 
                                        : (chat.lastMessage || "No messages yet")

                                    return (
                                        <div 
                                            key={chat._id} 
                                            onClick={() => setSelectedChat(chat)} 
                                            className={`${styles.chatCard} ${isSelected ? styles.chatCardActive : ''}`}
                                        >
                                            <div className={styles.cardHeader}>
                                                <strong className={styles.username}>{secondaryUser?.name || "User"}</strong>
                                                {secondaryUser?.isPremium && <span className={styles.proBadge}>PRO</span>}
                                            </div>
                                            <p className={styles.lastMessage}>{displayPreview}</p>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className={styles.emptyStateText}>No chats found</p>
                            )}
                        </div>
                    </div>

                    <div className={styles.chatMain}>
                        {selectedChat ? (
                            <>
                                <div className={styles.mainHeader}>
                                    <button 
                                        className={styles.mobileBackButton} 
                                        onClick={() => setSelectedChat(null)}
                                        aria-label="Go back to conversations list"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="19" y1="12" x2="5" y2="12"></line>
                                            <polyline points="12 19 5 12 12 5"></polyline>
                                        </svg>
                                    </button>
                                    <strong>{selectedChat.participants.find(p => p._id !== userId)?.name}</strong>
                                </div>
                                
                                <div className={styles.messagesContainer}>
                                    {messages.map(msg => {
                                        const isMe = msg.senderId === userId
                                        return (
                                            <div 
                                                key={msg._id} 
                                                className={`${styles.messageGroup} ${isMe ? styles.groupMe : styles.groupThem}`}
                                            >
                                                <div className={`${styles.messageBubble} ${isMe ? styles.messageMe : styles.messageThem}`}>
                                                    {msg.text}
                                                </div>
                                                <span className={styles.messageTime}>
                                                    {formatTimestamp(msg.createdAt || msg.timestamp)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className={styles.messageForm}>
                                    <input 
                                        type="text" 
                                        value={newMessageText} 
                                        onChange={(e) => setNewMessageText(e.target.value)} 
                                        placeholder="Type a message..." 
                                        className={styles.messageInput}
                                    />
                                    <button type="submit" className={styles.sendButton}>Send</button>
                                </form>
                            </>
                        ) : (
                            <div className={styles.noChatSelected}>
                                Select a chat to begin messaging
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return null
}

export default ChatPage