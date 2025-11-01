'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (res.ok) {
        if (isLogin) {
          if (data.token) {
            localStorage.setItem('sessionToken', data.token);
            console.log('Session token stored:', data.token);
            router.push('/'); // Redirect to userdashboard
          } else {
            setError('Login failed: No session token received');
            console.error('No token in response:', data);
          }
        } else {
          setIsLogin(true);
          setError('Signup successful! Please log in.');
        }
      } else {
        setError(data.message || 'Authentication failed');
        console.error('API error:', data);
      }
    } catch (err) {
      setError('Network error, please try again');
      console.error('Fetch error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"style={{
    backgroundImage: `url(${'/pic4.jpg'})`
  }}>
      <div className="container font-serif p-12 rounded-3xl w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Signup'}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-white text-blue-500 p-3 rounded-lg hover:bg-black hover:text-white transition"
          >
            {isLogin ? 'Login' : 'Signup'}
          </button>
        </form>
        <p className="mt-4 text-center">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-500 text-shadow-2xs text-shadow-black hover:underline"
          >
            {isLogin ? 'Signup' : 'Login'}
          </button>
        </p>
      </div>
      <script src="https://cdn.tailwindcss.com"></script>
    </div>
  );
}