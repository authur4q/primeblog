"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSession } from 'next-auth/react';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getMarkerIcon = (status) => {
  const color = status?.toLowerCase().includes("coffee") ? "green" : "blue";
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

function StatusUpdater({ user, currentUserId }) {
  const [status, setStatus] = useState(user.status || "");
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = user._id === currentUserId;

  const saveStatus = async () => {
    const res = await fetch("/api/users/update-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    console.log(status)

    if (res.ok) {
      setIsEditing(false);
      
    }
    console.log(res)
  };

  return (
    <div style={{ textAlign: 'center', minWidth: '150px' }}>
      <strong style={{ fontSize: '1.1em' }}>{user.name}</strong>
      
      {isEditing ? (
        <div style={{ margin: '10px 0' }}>
          <input 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            maxLength={30}
            style={{ 
              width: '90%', 
              color: "black", 
              border: "none", 
              padding: '5px', 
              backgroundColor: '#eee', 
              outline: "none", 
              borderRadius: "10px" 
            }}
          />
          <button 
            onClick={saveStatus} 
            style={{ 
              marginTop: '5px', 
              backgroundColor: "black", 
              color: "white", 
              borderRadius: "10px", 
              padding: "4px 8px", 
              cursor: "pointer" 
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontStyle: 'italic', margin: '5px 0' }}>"{status || "Hello! I'm here."}"</p>
          
          {isOwner && (
            <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.8em', marginBottom: '5px' }}>
              Edit Status
            </button>
          )}
          
          {!isOwner && (
            <>
              <br />
              <button 
                onClick={() => window.location.href = `/profile/${user._id}`}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#df00f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Say Hi
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function NearbyMap() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [position, setPosition] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);

  const fetchNearby = async (lat, lng) => {
    try {
      const res = await fetch(`/api/users/nearby?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setNearbyUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("NearbyMap: API fetch failed:", error);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchNearby(latitude, longitude);
      },
      (err) => {
        const defaultPos = [-1.2921, 36.8219];
        setPosition(defaultPos);
        fetchNearby(defaultPos[0], defaultPos[1]);
      }
    );
  }, []);

  if (!position) {
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
            icon={getMarkerIcon(user.status)}
          >
            <Popup>
              <StatusUpdater user={user} currentUserId={currentUserId} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}