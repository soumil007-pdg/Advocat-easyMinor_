'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { 
  MoreVertical, Pencil, Pin, Trash2, X, Save, Ban, Menu, 
  PanelRightClose, PanelRightOpen, Link, BookCopy, Download, 
  AlertCircle, ArrowRight, User 
} from 'lucide-react';
import { ChatSkeleton } from '@/app/components/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';

// --- Font Helper ---
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap');
    
    /* Custom styles for the new "document" view */
    .font-serif {
      font-family: 'Noto Serif', serif;
    }

    /* --- FIX IS HERE: ADD color: #111; --- */
    .prose-document h1, .prose-document h2, .prose-document h3 {
      font-family: 'Inter', sans-serif; 
      font-weight: 600;
      color: #111;  /* <--- ADD THIS LINE (Forces headings to be black) */
      margin-top: 1.5em; /* Optional: Adds nice spacing before headings */
      margin-bottom: 0.5em;
    }
    
    .prose-document p, .prose-document li, .prose-document a {
      font-family: 'Noto Serif', serif; 
      font-size: 1.05rem;
      line-height: 1.7;
      color: #333;
    }

    .prose-document a {
      color: #2563eb;
    }

    .prose-document strong {
      font-weight: 700;
      color: #000; /* Optional: Ensures bold text is strictly black */
    }
  `}</style>
);

const MarkdownLink = ({ children, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
    {children}
  </a>
);

const getCaseTitle = (messages) => {
  if (messages.length === 0) return "New Case";
  const firstUserMessage = messages.find(m => m.role === 'user');
  return firstUserMessage ? firstUserMessage.text.substring(0, 30) + '...' : "Case";
};

const parseCitations = (text) => {
  const citations = [];
  const linkRegex = /(https?:\/\/[^\s\)]+)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const precedingText = text.substring(Math.max(0, match.index - 10), match.index);
    if (!precedingText.endsWith('](')) { 
      citations.push({ type: 'link', title: match[1], href: match[1] });
    }
  }
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    citations.push({ type: 'link', title: match[1], href: match[2] });
  }
  const actRegex = /(The\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+Act,\s+\d{4})/g;
  while ((match = actRegex.exec(text)) !== null) {
    citations.push({ type: 'act', title: match[1], href: null });
  }
  return citations;
};

export default function GeneralQueries() {
  const { isLoggedIn, userEmail, loading } = useAuth(true);

  const [caseFiles, setCaseFiles] = useState({});
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('quick');
  const [savedTokens, setSavedTokens] = useState(0); 
  const [animateCounter, setAnimateCounter] = useState(false);
  const [showAdvisorNudge, setShowAdvisorNudge] = useState(false);
  
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, caseId: null });
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [renamingCaseId, setRenamingCaseId] = useState(null);
  const [newCaseName, setNewCaseName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReferencesOpen, setIsReferencesOpen] = useState(true);
  const [activeReferences, setActiveReferences] = useState([]); 

  const messagesEndRef = useRef(null);
  const contextMenuRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Cap at 150px
    }
  }, [input]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMessage = messages.findLast(m => m.role === 'user')?.text?.toLowerCase() || '';
      if (lastUserMessage.includes('evidence') || lastUserMessage.includes('dispute') || lastUserMessage.includes('stuck')) {
        setShowAdvisorNudge(true);
      }
    }
  }, [messages]);

  useEffect(() => {
    const loadCases = async () => {
      if (userEmail) {
        try {
          const res = await fetch('/api/cases/load', {
            method: 'POST',
            body: JSON.stringify({ email: userEmail }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.cases && Object.keys(data.cases).length > 0) {
              setCaseFiles(data.cases);
              const lastActiveId = localStorage.getItem('advocat_lastActiveCase');
              if (lastActiveId && data.cases[lastActiveId]) {
                setActiveCaseId(lastActiveId);
              } else {
                setActiveCaseId(Object.keys(data.cases)[0]);
              }
            } else {
              handleCreateNewCase({});
            }
          }
        } catch (error) {
          console.error("Failed to load cases", error);
        }
      }
    };
    loadCases();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && Object.keys(caseFiles).length > 0) {
      fetch('/api/cases/save', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, cases: caseFiles }),
      }).catch(err => console.error("Failed to save cases", err));
    }
  }, [caseFiles, userEmail]);

  useEffect(() => {
    if (activeCaseId && caseFiles[activeCaseId]) {
      const activeCase = caseFiles[activeCaseId];
      setMessages(activeCase.messages);
      setSavedTokens(activeCase.tokensSaved); 
      setActiveReferences(activeCase.references || []); 
      localStorage.setItem('advocat_lastActiveCase', activeCaseId);
    } else {
      setMessages([]);
      setSavedTokens(0);
      setActiveReferences([]);
    }
  }, [activeCaseId, caseFiles]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.js-context-menu-trigger')) return;
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.visible]);


  const handleCreateNewCase = (currentCases = caseFiles) => {
    const newCaseId = `case-${Date.now()}`;
    const newCase = {
      title: `Case - ${new Date().toLocaleDateString()}`,
      messages: [],
      tokensSaved: 0,
      references: [] 
    };
    const updatedCaseFiles = { ...currentCases, [newCaseId]: newCase };
    setCaseFiles(updatedCaseFiles);
    setActiveCaseId(newCaseId); 
  };

  const handleSelectCase = (caseId) => {
    if (caseId === renamingCaseId) return; 
    setActiveCaseId(caseId);
  };

  const handleContextMenu = (e, caseId) => {
    e.preventDefault();
    e.stopPropagation();
    const container = e.currentTarget.closest('#advocat-app-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const x = (buttonRect.right - containerRect.left) - 144; 
    const y = (buttonRect.bottom - containerRect.top) + 5;
    if (contextMenu.visible && contextMenu.caseId === caseId) {
      closeContextMenu();
    } else {
      setContextMenu({ visible: true, x, y, caseId });
    }
  };

  const closeContextMenu = () => setContextMenu({ ...contextMenu, visible: false, caseId: null });

  const handleStartRename = () => {
    setRenamingCaseId(contextMenu.caseId);
    setNewCaseName(caseFiles[contextMenu.caseId].title);
    closeContextMenu();
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault(); 
    const caseId = renamingCaseId;
    if (!caseId || !newCaseName.trim()) {
      handleCancelRename();
      return;
    }
    const updatedCaseFiles = { ...caseFiles, [caseId]: { ...caseFiles[caseId], title: newCaseName.trim() } };
    setCaseFiles(updatedCaseFiles);
    setRenamingCaseId(null);
    setNewCaseName("");
    toast.success("Case renamed!");
  };

  const handleCancelRename = () => {
    setRenamingCaseId(null);
    setNewCaseName("");
  };

  const handlePinCase = () => {
    toast.success("Pin feature coming soon!");
    closeContextMenu();
  };

  const handleShowDeleteModal = () => {
    setShowDeleteModal(contextMenu.caseId);
    closeContextMenu();
  };

  const handleHideDeleteModal = () => setShowDeleteModal(null);

  const handleConfirmDelete = () => {
    const caseId = showDeleteModal;
    if (!caseId) return;
    const updatedCaseFiles = { ...caseFiles };
    delete updatedCaseFiles[caseId];
    setCaseFiles(updatedCaseFiles);
    if (activeCaseId === caseId) {
      const remainingIds = Object.keys(updatedCaseFiles);
      setActiveCaseId(remainingIds.length > 0 ? remainingIds[0] : null);
      if (remainingIds.length === 0) handleCreateNewCase(updatedCaseFiles);
    }
    toast.success('Case deleted.');
    handleHideDeleteModal();
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleReferences = () => setIsReferencesOpen(!isReferencesOpen);

  const handleExportCase = () => {
    if (!activeCaseId || !caseFiles[activeCaseId]) {
      toast.error("No active case to export.");
      return;
    }
    const activeCase = caseFiles[activeCaseId];
    let exportContent = `Case Title: ${activeCase.title}\n\n`;
    activeCase.messages.forEach(msg => {
      exportContent += `${msg.role === 'user' ? 'My Query' : "Advocat's Response"}:\n${msg.text}\n\n----------------\n\n`;
    });
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeCase.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Case exported!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeCaseId) return;

    const userMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); 
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, mode: mode, history: messages }),
      });
      const data = await res.json();
      
      if (res.ok) {
        const ourAppCost = data.tokensUsed || 0;
        const actualSaved = Math.round(ourAppCost * (mode === 'deep' ? 1.5 : 0.5)); 

        const aiMessage = { 
          role: 'model', 
          text: data.text,
          used: ourAppCost,
          saved: actualSaved
        };
        const finalMessages = [...newMessages, aiMessage];
        const newTitle = messages.length === 0 ? getCaseTitle(finalMessages) : caseFiles[activeCaseId].title;
        
        let allCitations = activeReferences;
        if (mode === 'deep') {
          const newCitations = parseCitations(aiMessage.text);
          const uniqueNew = newCitations.filter(nc => !activeReferences.some(ac => ac.title === nc.title));
          if (uniqueNew.length > 0) {
             allCitations = [...activeReferences, ...uniqueNew];
             setActiveReferences(allCitations);
          }
        }

        const updatedCaseFiles = {
          ...caseFiles,
          [activeCaseId]: {
            ...caseFiles[activeCaseId],
            title: newTitle,
            messages: finalMessages,
            tokensSaved: (caseFiles[activeCaseId].tokensSaved || 0) + actualSaved,
            references: allCitations
          }
        };
        setCaseFiles(updatedCaseFiles); 
        setSavedTokens(updatedCaseFiles[activeCaseId].tokensSaved);
        setAnimateCounter(true);
        setTimeout(() => setAnimateCounter(false), 1500);
        toast.success("Response received!");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      const errorMessage = { role: 'model', text: "Sorry, connection error. Please try again.", used: 0, saved: 0 };
      setMessages([...newMessages, errorMessage]);
      toast.error("API Error");
    }
    setIsLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isLoggedIn) return null;

  return (
    <>
      <FontLoader />

      {/* App Container: Fits remaining height of screen minus the header (approx 64px).
        The global footer is hidden via CSS injection above.
      */}
      <div id="advocat-app-container" className="h-[calc(100vh-64px)] flex bg-gray-100 relative overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-64 bg-white shadow-md flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-20 ${isSidebarOpen ? 'ml-0' : '-ml-64'}`}>
          <div className="p-4 border-b">
            <button onClick={() => handleCreateNewCase()} className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 font-semibold">Open a New Case</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {Object.entries(caseFiles).sort((a, b) => b[0].localeCompare(a[0])).map(([caseId, caseData]) => (
                <div key={caseId} className="group relative rounded-md">
                  {renamingCaseId === caseId ? (
                    <form onSubmit={handleRenameSubmit} className="p-2 bg-gray-100 rounded-md">
                      <input autoFocus value={newCaseName} onChange={(e) => setNewCaseName(e.target.value)} className="w-full text-sm p-2 border rounded-md" onBlur={handleCancelRename} />
                    </form>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <button onClick={() => handleSelectCase(caseId)} className={`flex-1 text-left p-3 rounded-md w-full truncate ${activeCaseId === caseId ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                        <p className="font-medium text-sm truncate">{caseData.title}</p>
                        <p className="text-xs text-orange-600">{caseData.tokensSaved} tokens saved</p>
                      </button>
                      <button onClick={(e) => handleContextMenu(e, caseId)} className="absolute right-0 px-2 opacity-0 group-hover:opacity-100 js-context-menu-trigger"><MoreVertical size={18} /></button>
                    </div>
                  )}
                </div>
             ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Header - Title Fixed to be BLACK and Visible */}
          <header className="bg-white shadow-sm p-4 flex items-center border-b flex-shrink-0 z-10">
            <button onClick={toggleSidebar} className="mr-4"><Menu size={24} /></button>
            <h1 className="text-2xl font-extrabold text-black truncate max-w-lg">{caseFiles[activeCaseId]?.title || 'General Queries'}</h1>
            <div className="flex-grow"></div>
            <div className={`bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${animateCounter ? 'animate-bounce' : ''}`}>Case Tokens: {savedTokens} 🧡</div>
            <button onClick={handleExportCase} className="ml-4"><Download size={24} /></button>
            {mode === 'deep' && <button onClick={toggleReferences} className="ml-4">{isReferencesOpen ? <PanelRightClose size={24}/> : <PanelRightOpen size={24}/>}</button>}
          </header>

          {/* Chat Messages - Takes all available space */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
             <div className="max-w-4xl mx-auto pb-4">
                {messages.length === 0 && <p className="text-center text-gray-500 italic mt-10">Start a new case consultation...</p>}
                {messages.map((msg, i) => (
                   <div key={i} className="mb-8">
                      {msg.role === 'user' ? (
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
                           <div className="flex items-center gap-3 mb-2">
                             <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center"><User size={18} /></span>
                             <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">My Query</h3>
                           </div>
                           <p className="text-gray-800 text-lg pl-11 whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ) : (
                        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                           <div className="flex items-center gap-3 mb-4">
                             <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><BookCopy size={18} /></span>
                             <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Advocat's Analysis</h3>
                           </div>
                           <div className="prose-document max-w-none pl-11"><ReactMarkdown components={{ a: MarkdownLink }}>{msg.text}</ReactMarkdown></div>
                           {msg.saved > 0 && <p className="text-xs text-orange-600 mt-6 p-2 bg-orange-50 rounded font-sans font-medium pl-11">Used {msg.used} tokens | Saved {msg.saved} vs. raw chat 🧡</p>}
                        </div>
                      )}
                   </div>
                ))}
                {isLoading && <div className="bg-white p-6 rounded-lg shadow-lg"><ChatSkeleton /></div>}
                {showAdvisorNudge && (
                  <div className="bg-blue-900/20 border border-blue-500/30 p-4 mb-6 rounded-lg flex items-center gap-3">
                    <AlertCircle size={20} className="text-blue-400 flex-shrink-0"/> 
                    <div className="flex-1">
                      <p className="text-sm text-blue-300 mb-1">This sounds like a detailed scenario—want a structured plan?</p>
                      <a href="/case-advisor" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1">Jump to Case Advisor <ArrowRight size={14}/></a>
                    </div>
                    <button onClick={() => setShowAdvisorNudge(false)} className="text-gray-500 hover:text-gray-400 ml-2"><X size={16}/></button>
                  </div>
                )}
                <div ref={messagesEndRef} />
             </div>
          </div>

          {/* Input Area - Fixed at bottom, auto-growing */}
          <form onSubmit={handleSubmit} className="p-4 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t flex-shrink-0 z-20 relative">
            <div className="flex gap-2 w-full mb-2 max-w-4xl mx-auto">
               <button type="button" onClick={() => setMode('quick')} className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition ${mode === 'quick' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>⚡ Quick (Rights Skim)</button>
               <button type="button" onClick={() => setMode('deep')} className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition ${mode === 'deep' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>🔍 Deep (Cited Steps)</button>
            </div>
            
            <div className="flex gap-2 max-w-4xl mx-auto items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question..."
                className="flex-1 p-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none no-scrollbar bg-white shadow-sm min-h-[50px] max-h-[200px]"
                rows={1}
                disabled={isLoading || !activeCaseId}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50 shadow-sm h-[50px]"
                disabled={isLoading || !input.trim() || !activeCaseId}
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">{mode === 'quick' ? 'Quick rights skim + 1 step (low tokens).' : 'Full cited roadmap + templates/links (smart chains).'}</p>
          </form>
        </div>

        {/* Right Sidebar */}
        {mode === 'deep' && (
           <div className={`w-72 bg-white shadow-lg flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-10 ${isReferencesOpen ? 'mr-0' : '-mr-72'}`}>
              <div className="p-4 border-b flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-800">References & Citations</h3><button onClick={toggleReferences} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"><X size={20}/></button></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {activeReferences.length === 0 ? <p className="text-sm text-gray-500 italic">Citations appear here.</p> : (
                   <ul className="space-y-3">
                     {activeReferences.map((ref, i) => (
                        <li key={i} className="flex items-start gap-3">
                           <div>
                             {ref.type === 'link' ? <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex-shrink-0"><Link size={14} /></span> : <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex-shrink-0"><BookCopy size={14} /></span>}
                           </div>
                           <div className="flex-1 min-w-0">
                             {ref.href ? <a href={ref.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline break-words">{ref.title}</a> : <span className="text-sm font-medium text-gray-700 break-words">{ref.title}</span>}
                           </div>
                        </li>
                     ))}
                   </ul>
                 )}
              </div>
           </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && (
           <div ref={contextMenuRef} style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-50 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1">
              <button onClick={handleStartRename} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"><Pencil size={14} className="mr-1"/> Rename</button>
              <button onClick={handlePinCase} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"><Pin size={14} className="mr-1"/> Pin</button>
              <button onClick={handleShowDeleteModal} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} className="mr-1"/> Delete</button>
           </div>
        )}
        
        {/* Delete Modal */}
        {showDeleteModal && (
           <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Case?</h3>
                    <button onClick={handleHideDeleteModal} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                 </div>
                 <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete "<span className="font-medium">{caseFiles[showDeleteModal]?.title}</span>"?</p>
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