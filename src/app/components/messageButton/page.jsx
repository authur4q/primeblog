"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './messageButton.module.css'

const MessageButton = ({ recipientId, recipientName }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleStartChat = async () => {
        if (loading) return
        setLoading(true)

        try {
            const res = await fetch("/api/chats/conversation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ recipientId })
            })

            if (res.ok) {
                router.push("/chat")
            } else {
                console.error("Failed to initialize conversation node")
            }
        } catch (err) {
            console.error("Error starting chat channel:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button 
            onClick={handleStartChat}
            disabled={loading}
            className={`${styles.button} ${loading ? styles.disabled : ''}`}
        >
            {loading ? "Connecting..." : `Message ${recipientName || "Author"}`}
        </button>
    )
}

export default MessageButton