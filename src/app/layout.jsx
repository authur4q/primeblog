import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';

import {AuthProvider} from "./provider"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Prime",
  description: "spark new ideas on prime",
  manifest: "/manifest.json",
};


export const viewport = {
  width: 'device-width',
  themeColor: "#000000",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="page-container">
          <AuthProvider>
             <div className="content-wrapper">
                {children}
             </div>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}