'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { 
  MoreVertical, Pencil, Pin, Trash2, X, Save, Ban, Menu, 
  PanelRightClose, PanelRightOpen, Link, BookCopy, Download, 
  AlertCircle, ArrowRight, User // <-- ADDED USER ICON
} from 'lucide-react';
import { ChatSkeleton } from '@/app/components/SkeletonLoader';
// --- NEW: Helper to add Google Font for serif text ---
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap');
    
    /* Custom styles for the new "document" view */
    .font-serif {
      font-family: 'Noto Serif', serif;
    }

    .prose-document h1, .prose-document h2, .prose-document h3 {
      font-family: 'Inter', sans-serif; /* Keep headers in the UI font */
      font-weight: 600;
    }
    
    .prose-document p, .prose-document li, .prose-document a {
      font-family: 'Noto Serif', serif; /* Body text is serif */
      font-size: 1.05rem;
      line-height: 1.7;
      color: #333;
    }

    .prose-document a {
      color: #2563eb;
    }

    .prose-document strong {
      font-weight: 700;
    }
  `}</style>
);


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

// --- NEW: Citation Parsing Function ---
/**
 * Parses text for links and legal acts.
 * @param {string} text - The AI's markdown response.
 * @returns {Array} An array of citation objects.
 */
const parseCitations = (text) => {
  const citations = [];
  
  // Regex for links
  const linkRegex = /(https?:\/\/[^\s\)]+)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    // Check if it's inside markdown link brackets
    const precedingText = text.substring(Math.max(0, match.index - 10), match.index);
    if (!precedingText.endsWith('](')) { // Avoid double-counting markdown links
      citations.push({
        type: 'link',
        title: match[1],
        href: match[1]
      });
    }
  }

  // Regex for Markdown links [title](href)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    citations.push({
      type: 'link',
      title: match[1],
      href: match[2]
    });
  }

  // Regex for legal acts (e.g., "The Copyright Act, 1957")
  const actRegex = /(The\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+Act,\s+\d{4})/g;
  while ((match = actRegex.exec(text)) !== null) {
    citations.push({
      type: 'act',
      title: match[1],
      href: null // No direct link for acts
    });
  }

  return citations;
};


export default function GeneralQueries() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // --- STATE MANAGEMENT ---
  const [caseFiles, setCaseFiles] = useState({});
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('quick');
  const [savedTokens, setSavedTokens] = useState(0); 
  const [animateCounter, setAnimateCounter] = useState(false);
  
  // --- NEW STATE FOR CONTEXTUAL NUDGE ---
  const [showAdvisorNudge, setShowAdvisorNudge] = useState(false);
  
  // --- STATES FOR MENUS, MODALS, AND SIDEBARS ---
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, caseId: null });
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [renamingCaseId, setRenamingCaseId] = useState(null);
  const [newCaseName, setNewCaseName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReferencesOpen, setIsReferencesOpen] = useState(true);
  const [activeReferences, setActiveReferences] = useState([]); // NEW: State for citations

  const messagesEndRef = useRef(null);
  const contextMenuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- NEW: EFFECT FOR NUDGE TRIGGER ---
  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMessage = messages.findLast(m => m.role === 'user')?.text?.toLowerCase() || '';
      if (lastUserMessage.includes('evidence') || lastUserMessage.includes('dispute') || lastUserMessage.includes('stuck') || lastUserMessage.includes('landlord') || lastUserMessage.includes('contract')) {
        setShowAdvisorNudge(true);
      }
    }
  }, [messages]);

  // --- Load cases from localStorage on startup ---
  useEffect(() => {
    const storedCases = JSON.parse(localStorage.getItem('advocat_caseFiles')) || {};
    setCaseFiles(storedCases);
    const lastActiveId = localStorage.getItem('advocat_lastActiveCase');
    if (lastActiveId && storedCases[lastActiveId]) {
      setActiveCaseId(lastActiveId);
    } else if (Object.keys(storedCases).length > 0) {
      setActiveCaseId(Object.keys(storedCases)[0]);
    } else {
      handleCreateNewCase(storedCases); 
    }
  }, []); // Runs once on mount

  // --- Sync messages, tokens, and REFERENCES when activeCaseId changes ---
  useEffect(() => {
    if (activeCaseId && caseFiles[activeCaseId]) {
      const activeCase = caseFiles[activeCaseId];
      setMessages(activeCase.messages);
      setSavedTokens(activeCase.tokensSaved); 
      setActiveReferences(activeCase.references || []); // NEW: Load refs
      localStorage.setItem('advocat_lastActiveCase', activeCaseId);
    } else {
      setMessages([]);
      setSavedTokens(0);
      setActiveReferences([]); // NEW: Clear refs
    }
  }, [activeCaseId, caseFiles]);


  // --- Close context menu on outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.js-context-menu-trigger')) {
        return;
      }
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible, contextMenuRef]);


  // --- Helper function to create a new case ---
  const handleCreateNewCase = (currentCases = caseFiles) => {
    const newCaseId = `case-${Date.now()}`;
    const newCase = {
      title: `Case - ${new Date().toLocaleDateString()}`,
      messages: [],
      tokensSaved: 0,
      references: [] // NEW: Add references array
    };
    const updatedCaseFiles = { ...currentCases, [newCaseId]: newCase };
    setCaseFiles(updatedCaseFiles);
    setActiveCaseId(newCaseId); 
    localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
    localStorage.setItem('advocat_lastActiveCase', newCaseId);
  };

  // --- Helper to select a case ---
  const handleSelectCase = (caseId) => {
    if (caseId === renamingCaseId) return; // Don't switch case while renaming
    setActiveCaseId(caseId);
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = (e, caseId) => {
    e.preventDefault();
    e.stopPropagation();

    // --- FIX: Calculate position relative to the app container, not the document ---
    const container = e.currentTarget.closest('#advocat-app-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = e.currentTarget.getBoundingClientRect();

    // Calculate 'left' so the menu's right edge aligns with the button's right edge
    // w-36 is 144px
    const x = (buttonRect.right - containerRect.left) - 144; 
    // Calculate 'top' to be 5px below the button
    const y = (buttonRect.bottom - containerRect.top) + 5;

    if (contextMenu.visible && contextMenu.caseId === caseId) {
      closeContextMenu();
    } else {
      setContextMenu({ visible: true, x: x, y: y, caseId: caseId });
    }
  };
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false, caseId: null });
  };

  // --- Rename Handlers ---
  const handleStartRename = () => {
    const caseId = contextMenu.caseId;
    setRenamingCaseId(caseId);
    setNewCaseName(caseFiles[caseId].title);
    closeContextMenu();
  };
  const handleRenameSubmit = (e) => {
    e.preventDefault(); 
    const caseId = renamingCaseId;
    if (!caseId || !newCaseName.trim()) {
      handleCancelRename();
      return;
    }
    const updatedCase = { ...caseFiles[caseId], title: newCaseName.trim() };
    const updatedCaseFiles = { ...caseFiles, [caseId]: updatedCase };
    setCaseFiles(updatedCaseFiles);
    localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
    setRenamingCaseId(null);
    setNewCaseName("");
    toast.success("Case renamed!");
  };
  const handleCancelRename = () => {
    setRenamingCaseId(null);
    setNewCaseName("");
  };

  // --- Pin Handler (Placeholder) ---
  const handlePinCase = () => {
    toast.success("Pin feature coming soon!");
    closeContextMenu();
  };

  // --- Delete Handlers (Modal) ---
  const handleShowDeleteModal = () => {
    setShowDeleteModal(contextMenu.caseId);
    closeContextMenu();
  };
  const handleHideDeleteModal = () => {
    setShowDeleteModal(null);
  };
  const handleConfirmDelete = () => {
    const caseId = showDeleteModal;
    if (!caseId) return;
    const updatedCaseFiles = { ...caseFiles };
    delete updatedCaseFiles[caseId];
    setCaseFiles(updatedCaseFiles);
    localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
    if (activeCaseId === caseId) {
      const remainingIds = Object.keys(updatedCaseFiles);
      const nextActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
      setActiveCaseId(nextActiveId);
      if (remainingIds.length === 0) {
        handleCreateNewCase(updatedCaseFiles);
      }
    }
    toast.success('Case deleted.', { duration: 2000 });
    handleHideDeleteModal();
  };

  // --- Sidebar Toggle Functions ---
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const toggleReferences = () => {
    setIsReferencesOpen(!isReferencesOpen);
  };

  // --- NEW: Export Case Function ---
  const handleExportCase = () => {
    if (!activeCaseId || !caseFiles[activeCaseId]) {
      toast.error("No active case to export.");
      return;
    }

    const activeCase = caseFiles[activeCaseId];
    let exportContent = `Case Title: ${activeCase.title}\n`;
    exportContent += `Total Tokens Saved: ${activeCase.tokensSaved}\n`;
    exportContent += `Mode: ${mode}\n`; // Assumes mode is for the whole case, might need adjustment
    exportContent += `------------------------------------\n\n`;

    activeCase.messages.forEach(msg => {
      if (msg.role === 'user') {
        exportContent += `My Query:\n`;
        exportContent += `${msg.text}\n\n`;
      } else if (msg.role === 'model') {
        exportContent += `Advocat's Response:\n`;
        // This dumps the raw markdown text. Simple and effective for .txt
        exportContent += `${msg.text}\n\n`;
      }
      exportContent += `------------------------------------\n\n`;
    });

    if (activeCase.references && activeCase.references.length > 0) {
      exportContent += `\n\n--- Collected References ---\n`;
      activeCase.references.forEach(ref => {
        exportContent += `- [${ref.type.toUpperCase()}] ${ref.title}${ref.href ? ` (${ref.href})` : ''}\n`;
      });
    }

    // Create and download the file
    try {
      const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      // Sanitize title for filename
      const fileName = `${activeCase.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'advocat_case'}.txt`;
      link.download = fileName;
      
      // Append, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(link.href);
      
      toast.success("Case exported as .txt");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed. See console for details.");
    }
  };


  // --- Session validation (FIXED) ---
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        window.location.href = '/auth'; // Use window.location for redirection
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
          window.location.href = '/auth'; // Use window.location for redirection
        }
      } catch (err) {
        localStorage.removeItem('sessionToken');
        window.location.href = '/auth'; // Use window.location for redirection
      }
    };
    validateSession();
  }, []);

  // --- UPDATED handleSubmit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeCaseId) return;

    const userMessage = { role: 'user', text: input };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); // Optimistic update
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: input,
          mode: mode,
          history: messages 
        }),
      });
      const data = await res.json();
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
        const actualSaved = Math.round(Math.max(10, estimatedStandardCost - ourAppCost));
        // --- End token calculation ---

        const aiMessage = { 
          role: 'model', 
          text: data.text,
          used: ourAppCost,
          saved: actualSaved
        };
        const finalMessages = [...newMessages, aiMessage];
        const newTitle = messages.length === 0 
          ? getCaseTitle(finalMessages) 
          : caseFiles[activeCaseId].title;
        const currentCaseSaved = caseFiles[activeCaseId].tokensSaved || 0;
        const newTotalSaved = currentCaseSaved + actualSaved;

        // --- NEW: Citation Processing ---
        let allCitations = activeReferences;
        if (mode === 'deep') {
          const newCitations = parseCitations(aiMessage.text);
          const currentCaseRefs = activeReferences || [];
          // Filter out citations that already exist
          const newUniqueCitations = newCitations.filter(newRef => 
            !currentCaseRefs.some(existingRef => existingRef.title === newRef.title)
          );
          if (newUniqueCitations.length > 0) {
            allCitations = [...currentCaseRefs, ...newUniqueCitations];
            setActiveReferences(allCitations); // Update local state immediately
          }
        }
        // --- End Citation Processing ---

        const updatedCase = {
          ...caseFiles[activeCaseId],
          title: newTitle,
          messages: finalMessages,
          tokensSaved: newTotalSaved,
          references: allCitations // NEW: Save refs
        };
        const updatedCaseFiles = {
          ...caseFiles,
          [activeCaseId]: updatedCase
        };
        setCaseFiles(updatedCaseFiles);
        localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
        setSavedTokens(newTotalSaved);
        setAnimateCounter(true);
        setTimeout(() => setAnimateCounter(false), 1500);
        toast.success(
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">🧡 Tokens Saved!</span>
            <span>💰 {actualSaved} tokens banked vs. standard chat! 🎊</span>
          </div>,
          { duration: 5000, style: { background: '#fed7aa', color: '#92400e' }, icon: '🎉', position: 'top-center' }
        );
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      // --- UPDATED: Tokens Fallback Logic ---
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        used: 0,
        saved: 0
      };
      
      // Grant "pity" tokens
      const pitySaved = mode === 'deep' ? 20 : 10;
      const currentCaseSaved = caseFiles[activeCaseId]?.tokensSaved || 0;
      const newTotalSaved = currentCaseSaved + pitySaved;

      if (activeCaseId && caseFiles[activeCaseId]) {
        const updatedCase = {
          ...caseFiles[activeCaseId],
          messages: [...newMessages, errorMessage], // Add error message to history
          tokensSaved: newTotalSaved // Add pity tokens
        };
        const updatedCaseFiles = {
          ...caseFiles,
          [activeCaseId]: updatedCase
        };
        setCaseFiles(updatedCaseFiles);
        localStorage.setItem('advocat_caseFiles', JSON.stringify(updatedCaseFiles));
        setSavedTokens(newTotalSaved); // Update header
      }
      
      setMessages([...newMessages, errorMessage]); // Update messages in UI

      // Show a different toast
      toast.error(
        <div className="flex items-center gap-2">
          <span className="text-red-700 font-bold">API Error!</span>
          <span>But we saved your query & banked {pitySaved} tokens 🧡</span>
        </div>,
        { duration: 5000, style: { background: '#fecaca', color: '#b91c1c' }, icon: '⚠️', position: 'top-center' }
      );
      // --- End of Tokens Fallback Logic ---
    }
    setIsLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Loading...
      </div>
    );
  }

  // --- NEW 3-PANEL LAYOUT ---
  return (
    <>
      <FontLoader /> {/* Renders the <style> tag for fonts */}
      <div id="advocat-app-container" className="h-screen flex bg-gray-100 relative overflow-hidden">
        
        {/* --- PANEL 1: Left Sidebar (Collapsible) --- */}
        <div 
          className={`w-64 bg-white shadow-md flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-20 ${
            isSidebarOpen ? 'ml-0' : '-ml-64'
          }`}
        >
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
              {Object.entries(caseFiles).sort((a, b) => b[0].localeCompare(a[0])).map(([caseId, caseData]) => (
                <div key={caseId} className="group relative rounded-md">
                  {renamingCaseId === caseId ? (
                    <form onSubmit={handleRenameSubmit} className="p-2 bg-gray-100 rounded-md">
                      <input
                        type="text"
                        value={newCaseName}
                        onChange={(e) => setNewCaseName(e.target.value)}
                        className="w-full text-sm p-2 border border-blue-400 rounded-md text-gray-900"
                        autoFocus
                        onBlur={handleCancelRename}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={handleCancelRename} className="p-1 text-gray-600 hover:text-red-600"><Ban size={18} /></button>
                        <button type="submit" className="p-1 text-gray-600 hover:text-green-600"><Save size={18} /></button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <button
                        onClick={() => handleSelectCase(caseId)}
                        className={`flex-1 text-left p-3 rounded-md transition w-full truncate ${
                          activeCaseId === caseId ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium text-sm truncate">{caseData.title}</p>
                        <p className="text-xs text-orange-600">{caseData.tokensSaved} tokens saved</p>
                      </button>
                      <button
                        onClick={(e) => handleContextMenu(e, caseId)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-0 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity js-context-menu-trigger"
                      >
                        <MoreVertical size={18} className="pointer-events-none" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- PANEL 2: Main Content Area --- */}
        <div className="flex-1 flex flex-col h-screen">
          {/* --- Header (Updated) --- */}
          <header className="bg-white shadow-sm p-4 flex items-center border-b flex-shrink-0 z-10">
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-900 mr-4 p-1 rounded-full hover:bg-gray-100"
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-black truncate max-w-lg">
              {caseFiles[activeCaseId]?.title || 'General Queries Chat'}
            </h1>
            <div className="flex-grow"></div> 
            <div className={`bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold transition-all flex-shrink-0 ${animateCounter ? 'animate-bounce scale-110' : ''}`}>
              Case Tokens Saved: {savedTokens} 🧡
            </div>
            {/* --- NEW: Export Button --- */}
            <button
              onClick={handleExportCase}
              className="text-gray-600 hover:text-gray-900 ml-4 p-1 rounded-full hover:bg-gray-100"
              title="Export this case as .txt"
            >
              <Download size={24} />
            </button>
            {/* --- NEW: Right Sidebar Toggle --- */}
            {mode === 'deep' && (
              <button
                onClick={toggleReferences}
                className="text-gray-600 hover:text-gray-900 ml-4 p-1 rounded-full hover:bg-gray-100"
                title={isReferencesOpen ? "Hide references" : "Show references"}
              >
                {isReferencesOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
              </button>
            )}
          </header>

          {/* --- NEW: "Document" Message List --- */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 && (
                <p className="text-center text-gray-600 italic bg-gray-50 p-6 rounded-lg font-serif">
                  This is a new case file. Describe your situation or ask a question below to begin your consultation.
                </p>
              )}
              {messages.map((msg, index) => (
                <div key={index} className="mb-8">
                  {msg.role === 'user' ? (
                    
                    // --- NEW USER QUERY BLOCK ---
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                          <User size={18} /> {/* <-- FIXED */}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">My Query</h3>
                      </div>
                      <p className="text-gray-800 text-lg pl-11" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </p>
                    </div>

                  ) : (

                    // --- NEW AI RESPONSE BLOCK ---
                    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <BookCopy size={18} /> {/* Already imported */}
                        </span>
                        <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Advocat's Analysis</h3>
                      </div>
                      <div className="prose-document max-w-none pl-11">
                        <ReactMarkdown 
                          components={{ a: MarkdownLink }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      {msg.saved > 0 && (
                        <p className="text-xs text-orange-600 mt-6 p-2 bg-orange-50 rounded font-sans font-medium pl-11">
                          Used {msg.used} tokens | Saved {msg.saved} vs. raw chat 🧡
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* ====================================================
                === THIS IS THE CORRECTED CODE FOR SKELETON      ===
                ====================================================
              */}
              {isLoading && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <ChatSkeleton />
                </div>
              )}
              {/* === END OF CORRECTION === */}


              {/* --- NEW: CONTEXTUAL NUDGE BANNER --- */}
              {showAdvisorNudge && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 mb-6 rounded-lg flex items-center gap-3">
                  <AlertCircle size={20} className="text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-300 mb-1">This sounds like a detailed scenario—want a structured plan with evidence tips?</p>
                    <a 
                      href="/case-advisor" 
                      className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                    >
                      Jump to Case Advisor <ArrowRight size={14} />
                    </a>
                  </div>
                  <button 
                    onClick={() => setShowAdvisorNudge(false)} 
                    className="text-gray-500 hover:text-gray-400 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* --- Input Form (Unchanged) --- */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white shadow-inner border-t flex-shrink-0"
          >
            <div className="flex gap-2 w-full mb-2 max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition ${
                  mode === 'quick' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ⚡ Quick (Rights Skim)
              </button>
              <button
                type="button"
                onClick={() => setMode('deep')}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition ${
                  mode === 'deep' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔍 Deep (Cited Steps)
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mb-2">
              {mode === 'quick' ? 'Quick rights skim + 1 step (low tokens).' : 'Full cited roadmap + templates/links (smart chains).'}
            </p>
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)} // <-- FIX: Was e.pre.textContent, now e.target.value
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

        {/* --- PANEL 3: Right Sidebar (Citations) - UPDATED --- */}
        {mode === 'deep' && (
          <div 
            className={`w-72 bg-white shadow-lg flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-10 ${
              isReferencesOpen ? 'mr-0' : '-mr-72'
            }`}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">References & Citations</h3>
              <button
                onClick={toggleReferences}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeReferences.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Citations and references from your 'Deep' analysis will appear here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {activeReferences.map((ref, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div>
                        {ref.type === 'link' ? (
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">
                            <Link size={14} />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex-shrink-0">
                            <BookCopy size={14} />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {ref.href ? (
                          <a
                            href={ref.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline break-words"
                            title={ref.title}
                          >
                            {ref.title}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-700 break-words" title={ref.title}>
                            {ref.title}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* --- Context Menu Modal (Unchanged) --- */}
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="absolute z-50 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1"
          >
            <button onClick={handleStartRename} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"><Pencil size={14} className="mr-1" /> Rename</button>
            <button onClick={handlePinCase} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"><Pin size={14} className="mr-1" /> Pin</button>
            <button onClick={handleShowDeleteModal} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} className="mr-1" /> Delete</button>
          </div>
        )}

        {/* --- Delete Confirmation Modal (Unchanged) --- */}
        {showDeleteModal && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Case?</h3>
                <button onClick={handleHideDeleteModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "<span className="font-medium">{caseFiles[showDeleteModal]?.title}</span>"? All messages will be permanently lost.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={handleHideDeleteModal} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}