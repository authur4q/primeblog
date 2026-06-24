"use client";

import dynamic from 'next/dynamic';


const LazyNearbyMap = dynamic(() => import('./NearbyMap'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});


export default function MapWrapper() {
  return <LazyNearbyMap />;
}