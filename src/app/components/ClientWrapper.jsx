'use client'; // This directive makes this file a Client Component

import dynamic from 'next/dynamic';

// Import your heavy components here
const RotatingAd = dynamic(() => import("./RotatingAds/page"), { ssr: false });
const UserSearch = dynamic(() => import("./UserSearch/page"), { ssr: false });
const UserCarousel = dynamic(() => import("./UserCarousel/UserCarousel"), { ssr: false });

export const ClientComponents = () => {
  return (
    <>
      <UserSearch />
      <UserCarousel />
      <RotatingAd />
    </>
  );
};