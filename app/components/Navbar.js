'use client';
import React from "react";
import Link from "next/link";
import { Scale, MessageSquare, FileText } from 'lucide-react'; // Added FileText

// Accept props from layout.js
const Navbar = ({ isLoggedIn, userEmail, handleLogout }) => {
  return (
    <div className="flex w-full justify-between items-center p-3" style={{backgroundColor: 'var(--dark-text)'}}>
      
      {/* Left Side: Logo & Title (Adjusted Logo Icon) */}
      <Link href={"/"} className="flex items-center gap-2 title text-3xl font-extrabold text-white">
        <Scale size={32} style={{color: 'var(--primary-accent)'}} />
        ADVOCAT-Easy
      </Link>
      
      {/* Center: Tagline */}
      <div className="hidden md:block text-sm text-gray-400">
        an EDUCATIONAL legal counsel app
      </div>

      {/* Right Side: User Info & Actions */}
      <div className="flex items-center gap-4 text-white">
        
        {isLoggedIn ? (
          <>
            <span className="text-sm hidden lg:block text-white/80">Welcome, {userEmail}</span>
            <Link 
              href="/general-queries" 
              className="flex items-center gap-1 text-sm font-semibold hover:text-white/70 transition-colors duration-150"
              title="Quick rights chat for casual queries"
            >
              <MessageSquare size={16} /> Queries
            </Link>
            <Link 
              href="/case-advisor" 
              className="flex items-center gap-1 text-sm font-semibold hover:text-white/70 transition-colors duration-150"
              title="Build a detailed case plan for stuck scenarios"
            >
              <FileText size={16} /> Case Advisor
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold hover:text-white/70 transition-colors duration-150"
            >
              Logout
            </button>
          </>
        ) : (
          // Login/Signup Button styled to match the dark theme
          <Link
            href="/auth"
            style={{backgroundColor: 'var(--primary-accent)'}}
            className="text-sm font-bold text-white py-2 px-4 rounded hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;