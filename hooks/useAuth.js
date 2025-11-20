'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth(requireAuth = true) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        setLoading(false);
        if (requireAuth) router.push('/auth');
        return;
      }

      try {
        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (res.ok && data.isValid) {
          setIsLoggedIn(true);
          setUserEmail(data.email);
        } else {
          localStorage.removeItem('sessionToken');
          setIsLoggedIn(false);
          if (requireAuth) router.push('/auth');
        }
      } catch (err) {
        console.error("Auth check failed", err);
        if (requireAuth) router.push('/auth');
      } finally {
        setLoading(false);
      }
    };
    
    validate();
  }, [router, requireAuth]);

  return { isLoggedIn, userEmail, loading };
}