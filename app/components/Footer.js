import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-4">
      <div className="container mx-auto text-center">
        <div><span className="text-white text-shadow-md text-shadow-red-400">Disclaimer</span>: This site is for Educational Purpose only. Always consult a Certified Lawyer before acting upon ANY advice from the Internet.</div>
        <p className="text-lime-400">All rights reserved &copy; {new Date().getFullYear()} Advocat-Easy.</p>
      </div>
    </footer>
  );
};

export default Footer;