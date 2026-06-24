"use client";

export default function UpdateLocationButton() {
  const updateLocation = async () => {
    console.log("Button clicked!");

    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return alert("Geolocation is not supported by your browser.");
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        console.log("Position acquired:", pos.coords.latitude, pos.coords.longitude);
        
        try {
          const res = await fetch("/api/users/update-location", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            }),
          });

          const result = await res.json();
          console.log("API Response:", result);
          
          if (res.ok) {
            alert("Location updated successfully!");
          } else {
            alert("Failed to update: " + result.error);
          }
        } catch (error) {
          console.error("Fetch error:", error);
        }
      },
      (err) => {
        console.error("Geolocation Error:", err);
        alert("Permission denied or error: " + err.message);
      }
    );
  };

  return (
    <button 
      onClick={updateLocation} 
      style={{ 
        padding: '10px 20px', 
        cursor: 'pointer',
        backgroundColor: '#0070f3',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#0051ad'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#0070f3'}
    >
      Update My Location
    </button>
  );
}