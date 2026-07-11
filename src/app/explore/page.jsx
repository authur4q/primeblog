"use client";
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import { ArrowLeft } from 'lucide-react'; 

import styles from './explore.module.css';
import UpdateLocationButton from '../components/NearbyMap/UpdateLocationButton/UpdateLocationButton';

const DynamicMapCanvas = lazy(() => import('../components/NearbyMap/NearbyMap'));

export default function ExplorePage() {
  const { data: appSession } = useSession();
  const currentUserId = appSession?.user?.id;
  const router = useRouter();

  const [currentPosition, setCurrentPosition] = useState(null);
  const [focusedProfile, setFocusedProfile] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [cachedUsers, setCachedUsers] = useState([]);

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusInput, setStatusInput] = useState("");

  const fallbackNairobiCenter = useMemo(() => [-1.2921, 36.8219], []);

  const triggerDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setCurrentPosition(fallbackNairobiCenter);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (devicePosition) => {
        const { latitude, longitude } = devicePosition.coords;
        setCurrentPosition([latitude, longitude]);
      },
      (geoError) => {
        console.error("Internal geolocation engine failure:", geoError);
        setCurrentPosition(fallbackNairobiCenter);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [fallbackNairobiCenter]);

  useEffect(() => {
    triggerDeviceLocation();
  }, [triggerDeviceLocation]);

const handleSyncedDataset = useCallback((syncedArray) => {
  setCachedUsers(syncedArray);
  
  setFocusedProfile((current) => {
    if (!current) return null;
    const matchingUser = syncedArray.find(u => u._id === current._id);
    
    if (matchingUser) {
      
      return {
        ...current,
        ...matchingUser,
        profilePicture: matchingUser.profilePicture || current.profilePicture || ""
      };
    }
    
    return current;
  });
}, []);

  const handleSelectProfile = (profile) => {
    setFocusedProfile(profile);
    setStatusInput(profile.status || "");
    setIsEditingStatus(false);
    console.log(focusedProfile)
  };


  const handleSaveStatus = async () => {
    try {
      const res = await fetch("/api/users/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusInput }),
      });

      if (res.ok) {
        setIsEditingStatus(false);
        if (currentPosition) {
          const queryUrl = `/api/users/nearby?lat=${currentPosition[0]}&lng=${currentPosition[1]}&radius=${selectedRadius}`;
          const rawResponse = await fetch(queryUrl);
          const parsedData = await rawResponse.json();
          if (Array.isArray(parsedData)) {
            handleSyncedDataset(parsedData);
          }
        }
      }
    } catch (err) {
      console.error("Error updating status via HUD sheet:", err);
    }
  };

  return (
    <div className={styles.pageViewport}>
      
      <div className={styles.controlHeaderHud}>
        
        <button 
          onClick={() => router.back()} 
          className={styles.backNavigationButton}
          aria-label="Go Back"
        >
          <ArrowLeft size={20} color="#ffffff" />
        </button>

        <div className={styles.menuInputSelect}>
          <select 
            value={selectedRadius} 
            onChange={(e) => setSelectedRadius(Number(e.target.value))}
            className={styles.nativeSelectField}
          >
            <option value={1}>1 kilometers</option>
            <option value={5}>5 kilometers</option>
            <option value={25}>25 kilometers</option>
            <option value={50}>50 kilometers</option>
          </select>
        </div>
        <UpdateLocationButton onLocationUpdated={triggerDeviceLocation} />
      </div>

      
      <div className={styles.mapViewportContainer}>
        {currentPosition ? (
          <Suspense fallback={
            <div className={styles.fallbackScannerFrame}>
              <div className={styles.pulseRadarNode}></div>
              <span>Ta-da! Everything is ready</span>
            </div>
          }>
            <DynamicMapCanvas 
              userCoordinates={currentPosition}
              searchRadius={selectedRadius}
              onMarkerSelected={handleSelectProfile}
              onDatasetSync={handleSyncedDataset}
              authenticatedUserId={currentUserId}
            />
          </Suspense>
        ) : (
          <div className={styles.fallbackScannerFrame}>
            <div className={styles.pulseRadarNode}></div>
            <span>Bypassing local atmosphere noise... Connection stable</span>
          </div>
        )}

       
        {currentPosition && (
          <button 
            className={styles.locateFloatingActionBtn} 
            onClick={triggerDeviceLocation}
            aria-label="Recenter coordinates"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7.06-3.6-7.55-7.55H3v-2h2.45c.49-3.95 3.6-7.06 7.55-7.55V3h2v2.45c3.95.49 7.06 3.6 7.55 7.55H21v2h-2.45c-.49 3.95-3.6 7.06-7.55 7.55V19zm-1-5.93c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
          </button>
        )}

      
        <button 
          className={styles.displayListOverlayTrigger}
          onClick={() => setIsOverlayOpen(true)}
        >
          View Members ({cachedUsers.length})
        </button>
      </div>

      
      {isOverlayOpen && (
        <div className={styles.glassModalDimmer} onClick={() => setIsOverlayOpen(false)}>
          <div className={styles.directoryModalMainPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.directoryModalHeader}>
              <h3>Nearby Connections ({cachedUsers.length})</h3>
              <button className={styles.dismissModalCrossBtn} onClick={() => setIsOverlayOpen(false)}>&times;</button>
            </div>
            <ul className={styles.userListNodeWrapper}>
              {cachedUsers.length === 0 ? (
                <p className={styles.emptyResultsWarningText}>No members localized within this range parameter.</p>
              ) : (
                cachedUsers.map(memberItem => (
                  <li 
                    key={memberItem._id} 
                    className={styles.directoryProfileCardRow}
                    onClick={() => {
                      handleSelectProfile(memberItem);
                      setIsOverlayOpen(false);
                    }}
                  >
                    <span>{memberItem.name}</span>
                    {memberItem.distInMeters && (
                      <small>{(memberItem.distInMeters / 1000).toFixed(1)} km away</small>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}


      <div className={`${styles.bottomSlideProfileSheet} ${focusedProfile ? styles.bottomSheetStateOpen : ''}`}>
        {focusedProfile && (
          <div className={styles.slideProfileContainer}>
            <button className={styles.dismissProfileSheetCrossBtn} onClick={() => setFocusedProfile(null)}>&times;</button>
            <div className={styles.profileSheetOverviewHeader}>
              <div className={styles.avatarCircularWrapper}>
  <img 
    src={focusedProfile.profilePicture || focusedProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"} 
    alt={focusedProfile.name} 
    className={styles.avatarImageNode}
    onError={(avatarLoadError) => {
      avatarLoadError.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face";
    }}
  />
</div>
              <div>
                <strong className={styles.profileSheetNameText}>{focusedProfile.name}</strong>
                <p className={styles.profileSheetDistanceText}>
                  {focusedProfile._id === currentUserId ? "Your Profile" : focusedProfile.distInMeters ? `${(focusedProfile.distInMeters / 1000).toFixed(1)} km away` : "Nearby"}
                </p>
              </div>
            </div>


            <div className={styles.profileSheetStatusBodySection}>
              {isEditingStatus ? (
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <input 
                    type="text"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    maxLength={30}
                    style={{
                      flex: 1,
                      background: '#0b0e11',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button 
                    onClick={handleSaveStatus}
                    style={{
                      background: '#00a884',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0 16px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <p className={styles.profileSheetQuoteText}>"{focusedProfile.status || "Hey there! Let's connect."}"</p>
                  
                  {focusedProfile._id === currentUserId && (
                    <button 
                      onClick={() => setIsEditingStatus(true)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: '#8a99ad',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Status
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={styles.profileSheetInteractiveActions}>
              <a href={`/profile/${focusedProfile._id}`} className={styles.profileSheetViewActionLink}>
                View Complete Profile
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}