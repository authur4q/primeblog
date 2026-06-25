"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function NearbyMap() {
  const [position, setPosition] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);

  const fetchNearby = async (lat, lng) => {
    try {
      console.log("NearbyMap: Fetching users for:", [lat, lng]);
      const res = await fetch(`/api/users/nearby?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      console.log("NearbyMap: Data received from API:", data);
      setNearbyUsers(data);
    } catch (error) {
      console.error("NearbyMap: API fetch failed:", error);
    }
  };
  const handleUpdateLocation = async () => {
  if (!navigator.geolocation) return alert("Geolocation not supported");

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;

    const res = await fetch("/api/users/update-location", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: latitude, lng: longitude }),
    });

    if (res.ok) alert("Location updated!");
  });
};

  useEffect(() => {
    console.log("NearbyMap: Attempting to get geolocation...");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("NearbyMap: Position found:", [latitude, longitude]);
        setPosition([latitude, longitude]);
        fetchNearby(latitude, longitude);
      },
      (err) => {
        console.warn("NearbyMap: Geolocation denied, defaulting to Nairobi:", err);
        
        const defaultPos = [-1.2921, 36.8219];
        setPosition(defaultPos);
        fetchNearby(defaultPos[0], defaultPos[1]);
      }
    );
  }, []);

  if (!position) {
    console.log("NearbyMap: Waiting for position...");
    return <p>Loading map...</p>;
  }

  return (
    <MapContainer center={position} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {nearbyUsers?.map(user => {
        if (!user.location?.coordinates) return null;
        
        return (
          <Marker 
            key={user._id} 
            position={[user.location.coordinates[1], user.location.coordinates[0]]}
          >
            <Popup>{user.name} is nearby!</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}