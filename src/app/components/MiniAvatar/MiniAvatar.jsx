import React from 'react';
import styles from './MiniAvatar.module.css';

const MiniAvatar = ({ name, imageUrl, className = "" }) => {
 
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className={`${styles.avatarContainer} ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className={styles.avatarImage}
          loading="lazy"
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