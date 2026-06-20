"use client";
import { useState, useEffect } from "react";
import styles from "./usercarousel.module.css";
import FollowButton from "../followbtn/followbtn";

export default function UserCarousel() {
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const fetchUsers = () => {
    fetch("/api/users/list")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error loading users:", err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (users.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <h3>Discover Creators</h3>
      
      <div className={`${styles.scrollWrapper} ${expanded ? styles.expanded : ''}`}>
        <div className={styles.userGrid}>
          {users.map((user) => (
            <div key={user._id} className={styles.userCard}>
              <div className={styles.avatar}>
                {(user.name || "U")[0].toUpperCase()}
              </div>
              <span className={styles.userName}>{user.name}</span>
            
              <FollowButton 
                targetUserId={user._id} 
                onSuccess={() => setUsers(prev => prev.filter(u => u._id !== user._id))}
              />
            </div>
          ))}
        </div>
      </div>

      <button className={styles.viewMoreBtn} onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show Less" : "View More Creators"}
      </button>
    </div>
  );
}