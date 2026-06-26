'use client'; 

import dynamic from 'next/dynamic';


const UserSearch = dynamic(() => import("./UserSearch/page"), { ssr: false });
const UserCarousel = dynamic(() => import("./UserCarousel/UserCarousel"), { ssr: false });

export const ClientComponents = () => {
  return (
    <>
      <UserSearch />
      <UserCarousel />
    
    </>
  );
};