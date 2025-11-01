'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        // console.log('Validation response:', data);
        if (res.ok && data.isValid) {
          setIsLoggedIn(true);
          setUserEmail(data.email || 'User');
          // console.log('Session validated, user:', data.email);
        } else {
          localStorage.removeItem('sessionToken');
          setIsLoggedIn(false);
          console.error('Session invalid:', data.message || 'No valid session');
          router.push('/auth');
        }
      } catch (err) {
        localStorage.removeItem('sessionToken');
        setIsLoggedIn(false);
        console.error('Validation fetch error:', err);
        router.push('/auth');
      }
    };
    validateSession();
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('sessionToken');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <div 
  className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `url(${isLoggedIn ? '/pic5.jpg' : '/pic3.jpeg'})`
  }}
>
  <main className="container mx-auto px-4 py-8 text-center">
    <h1 className="text-4xl font-extrabold text-white text-shadow-md text-shadow-black mb-12">
      {isLoggedIn ? `Welcome ${userEmail}` : "Please Log In"}
    </h1>
    <div className="flex flex-col md:flex-row gap-8 justify-center">
      {isLoggedIn ? (
        <>
          <Link href="/case-advisor">
            <button className="bg-amber-500 shadow-xl shadow-black text-white text-2xl font-semibold py-6 px-12 rounded-lg hover:bg-amber-600 cursor-pointer transition duration-400 w-full md:w-80">
              Case Advisor
            </button>
          </Link>
          <Link href="/general-queries">
            <button className="bg-white shadow-xl shadow-black text-blue-500 hover:text-white text-2xl font-semibold py-6 px-12 rounded-lg hover:bg-blue-400 cursor-pointer transition duration-400 w-full md:w-80">
              General Queries
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-lime-500 shadow-xl shadow-black text-white text-2xl font-semibold py-6 px-12 rounded-lg hover:bg-lime-600 cursor-pointer transition duration-400 w-full md:w-80"
          >
            Logout
          </button>
        </>
      ) : (
        <Link href="/auth">
          <button className="bg-lime-500 text-white text-2xl font-semibold py-6 cursor-pointer px-12 rounded-lg hover:bg-lime-700 transition duration-300 w-full md:w-80">
            Login / Signup
          </button>
        </Link>
      )}
    </div>
  </main>
</div>
  );
}