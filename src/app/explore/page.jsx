"use client";
import { useState, useEffect } from "react";
import Navbar from "@/app/components/navbar/navbar";
import MapWrapper from "../components/NearbyMap/MapWrapper";
import UpdateLocationButton from "../components/NearbyMap/UpdateLocationButton/UpdateLocationButton";
import styles from "./explore.module.css";
import Link from "next/link";

export default function ExplorePage() {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      
  
      if (!navigator.geolocation) {
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `/api/users/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
            );
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setNearbyUsers(Array.isArray(data) ? data : []);
          } catch (err) {
            console.error("Fetch error:", err);
            setNearbyUsers([]);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error("Geolocation denied:", err);
          setLoading(false);
        }
      );
    };

    fetchUsers();
  }, [radius]);

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.exploreWrapper}>
        <h1>Explore</h1>

        <div className={styles.controls}>
          <UpdateLocationButton />
          <select 
            onChange={(e) => setRadius(Number(e.target.value))} 
            value={radius}
            className={styles.radiusSelect}
          >
            <option value="1000">1 km</option>
            <option value="5000">5 km</option>
            <option value="50000">50 km</option>
          </select>
        </div>

        <div className={styles.exploreLayout}>
          <div className={styles.mapSection}>
            {loading ? (
              <div className={styles.loader}>Searching...</div>
            ) : (
              <MapWrapper users={nearbyUsers} />
            )}
          </div>

          <aside className={styles.proximityFeed}>
            <h2>People Nearby</h2>
            {loading ? (
              <p>Finding users...</p>
            ) : (
              <ul className={styles.userList}>
                {nearbyUsers.length > 0 ? (
                  nearbyUsers.map((user) => (
                    <Link href={`/profile/${user._id}`} key={user._id} className={styles.userItem}>
                      <strong>{user.name}</strong> 
                      {user.username && <span> (@{user.username})</span>}
                    </Link>
                  ))
                ) : (
                  <p>No one found in this range.</p>
                )}
              </ul>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}