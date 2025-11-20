'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import React, { useState, useEffect } from 'react';
// --- 1. ADD usePathname HERE ---
import { useRouter, usePathname } from 'next/navigation'; 
import 'react-loading-skeleton/dist/skeleton.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  // --- 2. GET CURRENT PATH ---
  const pathname = usePathname(); 

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.isValid) {
          setIsLoggedIn(true);
          setUserEmail(data.email || 'User');
        } else {
          localStorage.removeItem('sessionToken');
          setIsLoggedIn(false);
        }
      } catch (err) {
        localStorage.removeItem('sessionToken');
        setIsLoggedIn(false);
      }
    };
    validateSession();
  }, [pathname]); // --- 3. ADD pathname TO DEPENDENCY ARRAY (This fixes the state sync) ---

  const handleLogout = async () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      try { await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (err) { console.error('Logout error:', err); }
    }
    localStorage.removeItem('sessionToken');
    setIsLoggedIn(false);
    setUserEmail('');
    router.push('/auth'); 
  };

  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`} 
      >
        <Navbar 
            isLoggedIn={isLoggedIn} 
            userEmail={userEmail} 
            handleLogout={handleLogout} 
        />

        <main className="flex-1"> 
          {children}
        </main>
        
        <Toaster /> 
        <Footer />
      </body>
    </html>
  );
}