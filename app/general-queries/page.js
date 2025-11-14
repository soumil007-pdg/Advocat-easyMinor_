'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown'; 

// Custom components for Markdown to style links blue + new tab
const MarkdownLink = ({ children, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
    {children}
  </a>
);

export default function GeneralQueries() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('quick');
  const [savedTokens, setSavedTokens] = useState(0);
  const [animateCounter, setAnimateCounter] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const router = useRouter();
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const stored = localStorage.getItem('savedTokens');
    if (stored) {
      setSavedTokens(parseInt(stored));
    }
    const storedSessions = localStorage.getItem('chatSessions');
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('savedTokens', savedTokens.toString());
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [savedTokens, sessions]);

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

  // Auto-save after AI response
  const autoSaveSession = () => {
    if (messages.length > 1) { // Has user + AI
      const session = {
        id: Date.now(),
        title: messages[0]?.text?.substring(0, 50) + '...',
        messages: [...messages],
        timestamp: new Date().toLocaleString()
      };
      setSessions(prev => {
        const updated = [session, ...prev.filter(s => s.id !== session.id).slice(0, 9)];
        return updated;
      });
    }
  };

  // Load session
  const loadSession = (session) => {
    setMessages(session.messages);
    setShowHistory(false);
    toast.success(`Loaded: ${session.title}`, { duration: 2000 });
  };

  // Clear current chat
  const clearChat = () => {
    setMessages([]);
    setInput('');
    toast.info('Chat cleared. Start fresh!', { duration: 2000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, mode }),
      });

      const data = await res.json();
      console.log('API Response:', data);

      if (res.ok) {
        const aiMessage = { 
          role: 'model', 
          text: data.text,
          used: data.tokensUsed || 0,
          saved: data.savedTokens || 0
        };
        setMessages((prev) => [...prev, aiMessage]);
        const actualSaved = data.savedTokens > 0 ? data.savedTokens : Math.max(30, Math.ceil(input.length * 2) - (data.tokensUsed || 0));
        if (actualSaved > 0) {
          setSavedTokens(prev => prev + actualSaved);
          setAnimateCounter(true);
          setTimeout(() => setAnimateCounter(false), 1500);
          toast.success(
            <div className="flex items-center gap-2">
              <span className="text-orange-500 font-bold">🧡 Coupon Saved!</span>
              <span>💰 {actualSaved} tokens banked vs. GPT! 🎊</span>
            </div>, 
            { 
              duration: 5000, 
              style: { background: '#fed7aa', color: '#92400e' },
              icon: '🎉',
              position: 'top-center'
            }
          );
        }
        autoSaveSession(); // Auto-save here
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = {
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now.",
        used: 0,
        saved: 30
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Chat error:', err);
      autoSaveSession(); // Save even on error for history
    }
    setIsLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 relative">
      {/* New: History Sidebar - Slimmer, slide-in */}
      {showHistory && (
        <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out z-50" style={{ transform: showHistory ? 'translateX(0)' : '-translateX(100%)' }}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Chat History</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <button 
              onClick={clearChat} 
              className="w-full bg-gray-500 text-white py-2 px-4 rounded mb-4 hover:bg-gray-600"
            >
              Clear Chat
            </button>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <li key={session.id} className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 text-sm" onClick={() => loadSession(session)}>
                  <div className="font-medium">{session.title}</div>
                  <div className="text-xs text-gray-500">{session.timestamp}</div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-4">Local-only for privacy. Auto-saves chats.</p>
          </div>
        </div>
      )}

      {/* Overlay for sidebar close on outside click */}
      {showHistory && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowHistory(false)} />}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">General Queries Chat</h1>
          <div className="flex items-center gap-4">
            <div className={`bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold transition-all ${animateCounter ? 'animate-bounce scale-110' : ''}`}>
              Tokens Saved: {savedTokens} 🧡
            </div>
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              History
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 relative" style={{ backgroundImage: `url(${'/pic3.jpeg'})`, backgroundSize: 'cover' }}>
          <div className="absolute inset-0 bg-black bg-opacity-20" /> {/* Overlay for readability */}
          <div className="relative z-10 space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <p className="text-center text-white italic bg-black bg-opacity-50 p-4 rounded">Drop your query below—pick a mode! (Add state like 'Karnataka' for local links; no state = national basics.)</p>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-xl p-3 rounded-lg bg-blue-500 text-white" style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-xl p-3 rounded-lg bg-white bg-opacity-95 text-black shadow">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        components={{
                          a: MarkdownLink
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    {msg.saved > 0 && (
                      <p className="text-xs text-orange-600 mt-2 p-1 bg-orange-50 rounded animate-pulse font-medium">
                        Used {msg.used} tokens | Saved {msg.saved} vs. raw chat 🧡
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-black p-3 rounded-lg">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 p-4 bg-white shadow-sm"
        >
          <div className="flex gap-2 w-full mb-2">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition ${
                mode === 'quick'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⚡ Quick (Rights Skim)
            </button>
            <button
              type="button"
              onClick={() => setMode('deep')}
              className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition ${
                mode === 'deep'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔍 Deep (Cited Steps)
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mb-2">
            {mode === 'quick' ? 'Quick rights skim + 1 step (low tokens).' : 'Full cited roadmap + templates/links (smart chains).'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a general legal question... (e.g., add 'Karnataka' for local links)"
              className="flex-1 p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500" // Fixed: text-black for visibility
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}