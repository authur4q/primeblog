"use client"
import React, { useEffect, useState, useRef } from 'react'
import styles from "./chat.module.css"
import Navbar from '../components/navbar/navbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Pusher from 'pusher-js'

let pusherClient;

const ChatPage = () => {
    const router = useRouter()
    const { data: session, status } = useSession()
    const userId = session?.user?.id

    const [conversations, setConversations] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessageText, setNewMessageText] = useState("")
    const messagesEndRef = useRef(null)

    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    if (!pusherClient && typeof window !== "undefined") {
        pusherClient = new Pusher(process.env.PUSHER_KEY || '', {
            cluster: process.env.PUSHER_CLUSTER || '',
        })
    }

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
        if (!searchQuery.trim()) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
                if (res.ok) {
                    const data = await res.json()
                    setSearchResults(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounce)
    }, [searchQuery])

    useEffect(() => {
        if (!userId || !pusherClient || conversations.length === 0) return

        const activeChannels = []

        conversations.forEach(chat => {
            const channelName = `chat_${chat._id}`
            const channel = pusherClient.subscribe(channelName)
            activeChannels.push({ name: channelName, instance: channel })

            channel.bind('incoming-message', (data) => {
                if (selectedChat?._id === data.conversationId) {
                    setMessages((prev) => {
                        if (prev.some(msg => msg._id === data._id || msg.tempId === data.tempId)) return prev
                        return [...prev, data]
                    })
                }

                setConversations((prevChats) => {
                    const targetChat = prevChats.find(c => c._id === data.conversationId)
                    if (!targetChat) return prevChats
                    const updatedChat = { ...targetChat, lastMessage: data.text }
                    const rest = prevChats.filter(c => c._id !== data.conversationId)
                    return [updatedChat, ...rest]
                })
            })
        })

        return () => {
            activeChannels.forEach(ch => {
                ch.instance.unbind('incoming-message')
                pusherClient.unsubscribe(ch.name)
            })
        }
    }, [conversations.length, selectedChat?._id, userId])

    useEffect(() => {
        if (!selectedChat || !selectedChat._id) {
            setMessages([])
            return
        }

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
    }, [selectedChat?._id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSelectUserFromSearch = (targetUser) => {
        const existingChat = conversations.find(chat => 
            chat.participants.some(p => p._id === targetUser._id)
        )

        if (existingChat) {
            setSelectedChat(existingChat)
        } else {
            setSelectedChat({
                participants: [
                    { _id: userId },
                    { _id: targetUser._id, name: targetUser.name, isPremium: targetUser.isPremium }
                ]
            })
        }
        setSearchQuery("")
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessageText.trim() || !selectedChat || !userId) return

        const targetUser = selectedChat.participants.find(p => p._id !== userId)
        const recipientId = targetUser?._id

        const originalText = newMessageText
        setNewMessageText("")

        const tempId = Date.now().toString()
        const optimisticMessage = {
            _id: tempId,
            tempId: tempId,
            conversationId: selectedChat._id || "temp_room",
            senderId: userId,
            text: originalText.trim(),
            createdAt: new Date().toISOString()
        }

        setMessages((prev) => [...prev, optimisticMessage])

        try {
            const res = await fetch("/api/chats/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: selectedChat._id,
                    senderId: userId,
                    text: originalText,
                    tempId: tempId,
                    recipientId: recipientId
                })
            })

            if (res.ok) {
                const savedMsg = await res.json()
                
                if (!selectedChat._id && savedMsg.conversation) {
                    const initializedChat = savedMsg.conversation
                    setSelectedChat(initializedChat)
                    setConversations((prevChats) => [
                        { ...initializedChat, lastMessage: savedMsg.text },
                        ...prevChats
                    ])
                } else {
                    setConversations((prevChats) => {
                        const targetChat = prevChats.find(chat => chat._id === selectedChat._id)
                        if (!targetChat) return prevChats
                        const updatedChat = { ...targetChat, lastMessage: savedMsg.text }
                        const rest = prevChats.filter(chat => chat._id !== selectedChat._id)
                        return [updatedChat, ...rest]
                    })
                }

                setMessages((prev) => 
                    prev.map(msg => msg.tempId === tempId ? savedMsg : msg)
                )
            } else {
                setMessages((prev) => prev.filter(msg => msg.tempId !== tempId))
                setNewMessageText(originalText)
            }
        } catch (err) {
            console.error(err)
            setMessages((prev) => prev.filter(msg => msg.tempId !== tempId))
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
                        
                        <div className={styles.searchWrapper}>
                            <input 
                                type="text"
                                placeholder="Search users to chat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.sidebarSearchInput}
                            />
                        </div>

                        <div className={styles.conversationsList}>
                            {searchQuery.trim().length > 0 ? (
                                isSearching ? (
                                    <p className={styles.searchStatusText}>Searching...</p>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => (
                                        <div 
                                            key={user._id}
                                            onClick={() => handleSelectUserFromSearch(user)}
                                            className={styles.chatCard}
                                        >
                                            <div className={styles.cardHeader}>
                                                <strong className={styles.username}>{user.name}</strong>
                                                {user.isPremium && <span className={styles.proBadge}>PRO</span>}
                                            </div>
                                            <p className={styles.lastMessage}>Click to start messaging</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.emptyStateText}>No users found</p>
                                )
                            ) : conversations.length > 0 ? (
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