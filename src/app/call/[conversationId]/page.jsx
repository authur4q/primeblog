"use client";
import dynamic from 'next/dynamic';

const CallPageContent = dynamic(() => import('./CallPageContent'), {
    ssr: false,
    loading: () => <div style={{ color: '#fff', textAlign: 'center', marginTop: '20%' }}>Initializing secure connection...</div>
});

export default function CallPage() {
    return <CallPageContent />;
}