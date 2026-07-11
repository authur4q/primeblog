"use client"
import React, { useState } from 'react';
import styles from './MiniAvatar.module.css';

const MiniAvatar = ({ name, profilePicture, className = "" }) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (userName) => {
    return userName ? userName.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className={`${styles.avatarContainer} ${className}`}>
      {profilePicture && !imageError ? (
        <img 
          src={profilePicture} 
          alt={name} 
          className={styles.avatarImage}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default MiniAvatar;