"use client";
import { MapPin } from 'lucide-react';
import styles from "../../chat/chat.module.css";

export default function ShareLocationButton({ onLocationShare }) {
  const handleShare = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported by your browser.");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        onLocationShare(locationLink); 
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location.");
      }
    );
  };

  return (
    <button 
      type="button" 
      onClick={handleShare}
      className={styles.iconButton}
    >
      <MapPin size={20} />
    </button>
  );
}