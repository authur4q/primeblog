"use client";
import { useState, useEffect } from "react";
import styles from "./followbutton.module.css"; 

export default function FollowButton({ targetUserId, onSuccess }) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                const res = await fetch(`/api/users/${targetUserId}/follow`);
                const data = await res.json();
                setIsFollowing(data.following);
            } catch (err) {
                console.error("Error checking follow status:", err);
            } finally {
                setLoading(false);
            }
        };
        checkFollowStatus();
    }, [targetUserId]);

    const toggleFollow = async () => {
        setLoading(true);
        try {
            const method = isFollowing ? "DELETE" : "POST";
            const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
            
            if (res.ok) {
                setIsFollowing(!isFollowing);
                
                if (method === "POST" && onSuccess) {
                    onSuccess();
                }
            }
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={toggleFollow} 
            disabled={loading}
            className={isFollowing ? styles.followingBtn : styles.followBtn}
        >
            {loading ? "..." : (isFollowing ? "Following" : "Follow")}
        </button>
    );
}