'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneralQueries() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 1. Check if user is logged in (like on your other pages)
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        router.push('/auth');
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
        } else {
          localStorage.removeItem('sessionToken');
          router.push('/auth');
        }
      } catch (err) {
        localStorage.removeItem('sessionToken');
        router.push('/auth');
      }
    };
    validateSession();
  }, [router]);

  // 2. Handle sending the message to your new API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send the user's prompt to your new backend
      const res = await fetch('/api/auth/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();

      if (res.ok) {
        const aiMessage = { role: 'model', text: data.text };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = {
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Chat error:', err);
    }
    setIsLoading(false);
  };

  // 3. Render the chat UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col justify-between p-4 bg-cover bg-center" // <-- THIS IS THE FIX (line 99)
      style={{ backgroundImage: `url(${'/pic3.jpeg'})` }}
    >
      <div className="flex-1 overflow-y-auto bg-black bg-opacity-50 p-6 rounded-lg backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-4">
          General Queries Chat
        </h1>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xl p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-black'
                }`}
                style={{ whiteSpace: 'pre-wrap' }} // This preserves formatting
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-black p-3 rounded-lg">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex gap-2 p-4 bg-black bg-opacity-75 rounded-lg backdrop-blur-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a general legal question..."
          className="flex-1 p-3 border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition font-semibold"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}