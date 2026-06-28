"use client";

import { startRegistration } from "@simplewebauthn/browser";

export default function BiometricToggle({ isEnabled, onToggle, userId }) {
  
  const handleToggle = async () => {
    if (!isEnabled) {
      try {
        const resp = await fetch("/api/auth/webauthn/auth-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId.toString() }),
        });
        
        if (!resp.ok) throw new Error("Failed to get registration options");
        const opts = await resp.json();

        const attestation = await startRegistration(opts);

        const verificationResp = await fetch("/api/auth/webauthn/verify-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            attestation: attestation, 
            userId: userId,
            currentChallenge: opts.challenge
          }),
        });

        if (verificationResp.ok) {
          onToggle();
        }
      } catch (error) {
        console.error("Biometric registration failed:");
      }
    } else {
      onToggle();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
          Biometric Login
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: isEnabled ? '#059669' : '#6b7280' }}>
          {isEnabled ? "Biometrics are currently enabled" : "Secure your account with FaceID or TouchID"}
        </p>
      </div>
      
      <button 
        onClick={handleToggle}
        style={{
          padding: '0.6rem 1.25rem',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          border: 'none',
          transition: 'all 0.2s ease',
          backgroundColor: isEnabled ? '#fef2f2' : '#2563eb',
          color: isEnabled ? '#dc2626' : '#ffffff',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = isEnabled ? '#fee2e2' : '#1d4ed8';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = isEnabled ? '#fef2f2' : '#2563eb';
        }}
      >
        {isEnabled ? "Disable" : "Enable"}
      </button>
    </div>
  );
}