"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './nearbymap.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getCustomIcon = (statusString) => {
  const isCoffee = statusString?.toLowerCase().includes("coffee");
  const markerColor = isCoffee ? "green" : "blue";
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
    shadowUrl: 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

function MapRecenter({ centerCoordinates }) {
  const activeMapInstance = useMap();
  useEffect(() => {
    if (centerCoordinates) {
      activeMapInstance.setView(centerCoordinates, activeMapInstance.getZoom());
    }
  }, [centerCoordinates, activeMapInstance]);
  return null;
}

export default function NearbyMap({ 
  userCoordinates, 
  searchRadius, 
  onMarkerSelected, 
  onDatasetSync, 
  authenticatedUserId 
}) {
  const [localUsers, setLocalUsers] = useState([]);

useEffect(() => {
    if (!userCoordinates) return;

    const pullNearbyUsers = async () => {
      try {
        const queryUrl = `/api/users/nearby?lat=${userCoordinates[0]}&lng=${userCoordinates[1]}&radius=${searchRadius}`;
        console.log("Fetching from URL:", queryUrl);

        const rawResponse = await fetch(queryUrl);
        
        if (!rawResponse.ok) {
          console.error(`API response error status: ${rawResponse.status}`);
          return;
        }

        const parsedData = await rawResponse.json();
        console.log("Raw Data received from backend API:", parsedData); 

        const verifiedArray = Array.isArray(parsedData) ? parsedData : [];
        
        setLocalUsers(verifiedArray);
        if (onDatasetSync) {
          onDatasetSync(verifiedArray);
        }
      } catch (fetchError) {
        console.error("Failed syncing nearby user metrics:", fetchError);
      }
    };

    pullNearbyUsers();
  }, [userCoordinates, searchRadius, onDatasetSync]);
  return (
    <div className={styles.canvasContainer}>
      <MapContainer 
        center={userCoordinates} 
        zoom={13} 
        className={styles.leafletCoreContainer}
      >
        <MapRecenter centerCoordinates={userCoordinates} />
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {localUsers.map((item) => {
          if (!item.location?.coordinates) return null;
          const leafLatLng = [item.location.coordinates[1], item.location.coordinates[0]];
          const isCurrentUser = item._id === authenticatedUserId;

          return (
            <Marker
              key={item._id}
              position={leafLatLng}
              icon={getCustomIcon(item.status)}
              eventHandlers={{
                click: () => onMarkerSelected && onMarkerSelected(item)
              }}
            >
              <Popup>
                <div className={styles.miniPopupCard}>
                  <strong>{item.name}</strong>
                  <p className={styles.miniPopupStatus}>"{item.status || "Active Now"}"</p>
                  {!isCurrentUser && (
                    <button 
                      className={styles.popupActionBtn}
                      onClick={() => window.location.href = `/profile/${item._id}`}
                    >
                      View Profile
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}