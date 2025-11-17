import React from 'react';
import Link from 'next/link';
import { Scale } from 'lucide-react'; // Keep Scale for the logo

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-6 border-t border-gray-700" style={{backgroundColor: 'var(--dark-text)'}}>
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* --- Single Row: Logo/Description (Left) | Disclaimer (Right) --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          
          {/* Left Block: Logo, Name, and Simple Description */}
          <div className="flex items-center space-x-6">
            {/* Logo and Name */}
            <div className="flex items-center gap-2">
                <Scale size={28} style={{color: 'var(--primary-accent)'}} />
                <span className="text-xl font-extrabold text-white">ADVOCAT-Easy</span>
            </div>
            {/* Description */}
            <p className="text-sm hidden sm:block">Legal guidance, simplified.</p>
          </div>
          
          {/* Right Block: Disclaimer and Copyright */}
          <div className="text-right text-xs space-y-1 md:space-y-0 md:pl-8">
            <p className="font-semibold text-white">
              Disclaimer: This site is for educational purposes only.
            </p>
            
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;