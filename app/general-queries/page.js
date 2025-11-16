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

// --- HELPER FUNCTION: Get a short title for the case list ---
const getCaseTitle = (messages) => {
  if (messages.length === 0) {
    return "New Case"; // Default for an empty case
  }
  const firstUserMessage = messages.find(m => m.role === 'user');
  return firstUserMessage ? firstUserMessage.text.substring(0, 30) + '...' : "Case";
};

export default function GeneralQueries() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // --- NEW STATE MANAGEMENT ---
  const [caseFiles, setCaseFiles] = useState({});
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [messages, setMessages] = useState([]);
  // --- END NEW STATE ---

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('quick');
  const [savedTokens, setSavedTokens] = useState(0); // This now shows tokens for the *active case*
  const [animateCounter, setAnimateCounter] = useState(false);
  const router = useRouter();
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- REMOVED old savedTokens useEffects ---

  // --- NEW: Load cases from localStorage on startup ---
  useEffect(() => {
    const storedCases = JSON.parse(localStorage.getItem('advocat_caseFiles')) || {};
    setCaseFiles(storedCases);

    const lastActiveId = localStorage.getItem('advocat_lastActiveCase');

    if (lastActiveId && storedCases[lastActiveId]) {
      setActiveCaseId(lastActiveId);
    } else if (Object.keys(storedCases).length > 0) {
      setActiveCaseId(Object.keys(storedCases)[0]);
    } else {
      // No cases exist, create a fresh one
      handleCreateNewCase(storedCases); // Pass empty object
    }
  }, []); // Runs once on mount

  // --- NEW: Sync messages and token counter when activeCaseId changes ---
  useEffect(() => {
    if (activeCaseId && caseFiles[activeCaseId]) {
      const activeCase = caseFiles[activeCaseId];
      setMessages(activeCase.messages);
      setSavedTokens(activeCase.tokensSaved);
      
      // Save this as the last active case
      localStorage.setItem('advocat_lastActiveCase', activeCaseId);
    } else {
      setMessages([]);
      setSavedTokens(0);
    }
    scrollToBottom();
  }, [activeCaseId, caseFiles]);

  // --- NEW: Helper function to create a new case ---
  const handleCreateNewCase = (currentCases = caseFiles) => {
    const newCaseId = `case-${Date.now()}`;
    const newCase = {
      title: `Case - ${new Date().toLocaleDateString()}`, // We'll update title later
      messages: [],
      tokensSaved: 0
    };

    const updatedCaseFiles = { ...currentCases, [newCaseId]: newCase };
    
    setCaseFiles(updatedCaseFiles);
    setActiveCaseId(newCaseId); // This will trigger the useEffect above
    
    localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
    localStorage.setItem('advocat_lastActiveCase', newCaseId);
  };

  // --- NEW: Helper to select a case ---
  const handleSelectCase = (caseId) => {
    setActiveCaseId(caseId);
  };

  // --- Session validation (unchanged) ---
  useEffect(() => {
    const validateSession = async () => {
      // ... (your existing validation code is perfect)
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

  // --- UPDATED handleSubmit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeCaseId) return;

    const userMessage = { role: 'user', text: input };
    
    // Optimistically update UI
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // --- UPDATED FETCH: Send the 'messages' history array ---
      const res = await fetch('/api/auth/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: input, // Send new prompt
          mode: mode,
          history: messages // <-- SEND THE CONTEXT!
        }),
      });

      const data = await res.json();
      console.log('API Response:', data);

      if (res.ok) {
        // --- Token calculation (unchanged) ---
        const ourAppCost = data.tokensUsed || 0;
        const inputLength = input.length;
        const VAGUE_THRESHOLD = 50;
        const CONCISE_THRESHOLD = 200;
        const maxMultiplier = (mode === 'deep' ? 3.0 : 1.5);
        const minMultiplier = (mode === 'deep' ? 1.2 : 0.7); 
        let clarityFactor = (inputLength - VAGUE_THRESHOLD) / (CONCISE_THRESHOLD - VAGUE_THRESHOLD);
        clarityFactor = Math.max(0, Math.min(1, clarityFactor));
        const finalMultiplier = maxMultiplier - (clarityFactor * (maxMultiplier - minMultiplier));
        const estimatedStandardCost = ourAppCost * finalMultiplier;
        const actualSaved = Math.round(Math.max(0, estimatedStandardCost - ourAppCost));
        // --- End token calculation ---

        const aiMessage = { 
          role: 'model', 
          text: data.text,
          used: ourAppCost,
          saved: actualSaved
        };
        
        // --- NEW: Save message and tokens to the active case file ---
        const finalMessages = [...newMessages, aiMessage];
        
        // Update title only if it's the first user message
        const newTitle = messages.length === 0 
          ? getCaseTitle(finalMessages) 
          : caseFiles[activeCaseId].title;

        // Get current total saved for this case
        const currentCaseSaved = caseFiles[activeCaseId].tokensSaved || 0;
        const newTotalSaved = currentCaseSaved + actualSaved;

        const updatedCase = {
          ...caseFiles[activeCaseId],
          title: newTitle,
          messages: finalMessages,
          tokensSaved: newTotalSaved
        };

        const updatedCaseFiles = {
          ...caseFiles,
          [activeCaseId]: updatedCase
        };

        // --- Save everything to state and localStorage ---
        setCaseFiles(updatedCaseFiles); // This triggers the sync useEffect
        localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
        
        // Update header counter
        setSavedTokens(newTotalSaved);

        // --- Toast (unchanged, but now uses 'actualSaved') ---
        if (actualSaved > 0) {
          setAnimateCounter(true);
          setTimeout(() => setAnimateCounter(false), 1500);
          toast.success(
            <div className="flex items-center gap-2">
              <span className="text-orange-500 font-bold">🧡 Tokens Saved!</span>
              <span>💰 {actualSaved} tokens banked vs. standard chat! 🎊</span>
            </div>,
            { duration: 5000, style: { background: '#fed7aa', color: '#92400e' }, icon: '🎉', position: 'top-center' }
          );
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = {
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now.",
        used: 0,
        saved: 0
      };
      // Revert optimistic UI update on error
      setMessages(messages);
      // We could add the error message to the UI, but let's keep it simple
      // setMessages(prev => [...prev, errorMessage]); 
      console.error('Chat error:', err);
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

  // --- NEW LAYOUT: Sidebar + Chat Area ---
  return (
    <div className="h-screen flex bg-gray-100">
      
      {/* --- Sidebar --- */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={() => handleCreateNewCase()}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition font-semibold"
          >
            Open a New Case
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">My Case Files</h2>
          <div className="space-y-2 px-2">
            {/* Sort cases to show newest first */}
            {Object.entries(caseFiles).sort((a, b) => b[0].localeCompare(a[0])).map(([caseId, caseData]) => (
              <button
                key={caseId}
                onClick={() => handleSelectCase(caseId)}
                className={`w-full text-left p-3 rounded-md transition ${
                  activeCaseId === caseId
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className="font-medium text-sm truncate">{caseData.title}</p>
                <p className="text-xs text-orange-600">
                  {caseData.tokensSaved} tokens saved 🧡
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col h-screen">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold text-black">
            {caseFiles[activeCaseId]?.title || 'General Queries Chat'}
          </h1>
          <div className={`bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold transition-all ${animateCounter ? 'animate-bounce scale-110' : ''}`}>
            Case Tokens Saved: {savedTokens} 🧡
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <p className="text-center text-gray-600 italic bg-gray-200 p-4 rounded">
                This is a new case file. Drop your query below—pick a mode!
              </p>
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
                  <div className="max-w-xl p-3 rounded-lg bg-white text-black shadow">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap overflow-wrap-break-word">
                      <ReactMarkdown 
                        components={{ a: MarkdownLink }}
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
          className="mt-4 p-4 bg-white shadow-sm border-t"
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
              placeholder="Ask a follow-up or new question in this case..."
              className="flex-1 p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !activeCaseId}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50"
              disabled={isLoading || !input.trim() || !activeCaseId}
            >
              Send
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}