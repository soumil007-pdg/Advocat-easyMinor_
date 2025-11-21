'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { 
  MoreVertical, Pencil, Trash2, X, Menu, 
  PanelRightClose, PanelRightOpen, Link as LinkIcon, 
  BookCopy, Send, Zap, FileText, User, Sparkles, Pin, Info
} from 'lucide-react';
import { ChatSkeleton } from '@/app/components/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';

// --- Styles & Animations ---
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Inter:wght@400;500;600&display=swap');
    
    .font-serif { font-family: 'Merriweather', serif; }
    .font-sans { font-family: 'Inter', sans-serif; }

    .prose-legal h1, .prose-legal h2, .prose-legal h3 {
      color: #171717; font-family: 'Inter', sans-serif; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.5em;
    }
    .prose-legal p, .prose-legal li {
      font-family: 'Merriweather', serif; font-size: 1rem; line-height: 1.8; color: #334155;
    }
    .prose-legal strong { color: #000; font-weight: 700; }
    
    /* LINK STYLING: Bright Orange, Underlined, Pointer Cursor */
    .prose-legal a { 
      color: #FF5B33 !important; 
      text-decoration: underline; 
      text-underline-offset: 3px; 
      font-weight: 600;
      cursor: pointer;
    }
    .prose-legal a:hover {
      color: #e04f2a !important;
    }

    @keyframes floatUp {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-20px); }
    }
    .animate-float { animation: floatUp 1.5s ease-out forwards; }
  `}</style>
);

// --- Custom Link Renderer to ensure clickable links ---
const MarkdownComponents = {
  a: ({ node, ...props }) => (
    <a 
      {...props} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-[#FF5B33] font-bold hover:underline"
    >
      {props.children}
    </a>
  )
};

export default function GeneralQueries() {
  const { isLoggedIn, userEmail, loading } = useAuth(true);

  const [caseFiles, setCaseFiles] = useState({});
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('quick'); 
  
  const [savedCredits, setSavedCredits] = useState(0); 
  const [creditPop, setCreditPop] = useState(null); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReferencesOpen, setIsReferencesOpen] = useState(true);
  const [activeReferences, setActiveReferences] = useState([]);
  
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, caseId: null });
  const [renamingCaseId, setRenamingCaseId] = useState(null);
  const [newCaseName, setNewCaseName] = useState("");
  const contextMenuRef = useRef(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Load Cases
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
              
              // Default to last active or first case
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

  // Sync Active Case Data (FIXED CREDIT SYNC)
  useEffect(() => {
    if (activeCaseId && caseFiles[activeCaseId]) {
      const activeCase = caseFiles[activeCaseId];
      setMessages(activeCase.messages);
      
      // FIX: Set credits ONLY for this specific case
      setSavedCredits(activeCase.tokensSaved || 0); 
      
      setActiveReferences(activeCase.references || []); 
      localStorage.setItem('advocat_lastActiveCase', activeCaseId);
    }
  }, [activeCaseId, caseFiles]);

  // Save to DB
  useEffect(() => {
    if (userEmail && Object.keys(caseFiles).length > 0) {
      fetch('/api/cases/save', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, cases: caseFiles }),
      }).catch(err => console.error("Failed to save cases", err));
    }
  }, [caseFiles, userEmail]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleCreateNewCase = (currentCases = caseFiles) => {
    const newCaseId = `case-${Date.now()}`;
    const newCase = {
      title: "New Consultation",
      messages: [],
      tokensSaved: 0, // Start at 0
      references: [] 
    };
    const updatedCaseFiles = { ...currentCases, [newCaseId]: newCase };
    setCaseFiles(updatedCaseFiles);
    setActiveCaseId(newCaseId);
    // State updates will handle resetting credits to 0 automatically via useEffect
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleContextMenu = (e, caseId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ visible: true, x: rect.right, y: rect.top, caseId });
  };

  const handleRenameStart = () => {
    setRenamingCaseId(contextMenu.caseId);
    setNewCaseName(caseFiles[contextMenu.caseId].title);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (renamingCaseId && newCaseName.trim()) {
        const updated = { ...caseFiles, [renamingCaseId]: { ...caseFiles[renamingCaseId], title: newCaseName } };
        setCaseFiles(updated);
    }
    setRenamingCaseId(null);
  };

  const handleDeleteCase = () => {
    const updated = { ...caseFiles };
    delete updated[contextMenu.caseId];
    setCaseFiles(updated);
    setContextMenu({ ...contextMenu, visible: false });
    if (activeCaseId === contextMenu.caseId) {
        const keys = Object.keys(updated);
        if (keys.length > 0) setActiveCaseId(keys[0]);
        else handleCreateNewCase(updated);
    }
    toast.success("Consultation deleted");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeCaseId) return;

    const userMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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
        
        setCreditPop(actualSaved);
        
        // Calculate new total for THIS case only
        const currentTotal = caseFiles[activeCaseId].tokensSaved || 0;
        const newTotalCredits = currentTotal + actualSaved;
        
        setSavedCredits(newTotalCredits); // Update UI immediately
        setTimeout(() => setCreditPop(null), 2000);

        const aiMessage = { 
            role: 'model', 
            text: data.text,
            credits: actualSaved 
        };
        const finalMessages = [...newMessages, aiMessage];
        
        let newTitle = caseFiles[activeCaseId].title;
        if (messages.length === 0) {
           newTitle = input.substring(0, 25) + (input.length > 25 ? '...' : '');
        }

        let allCitations = activeReferences;
        if (mode === 'deep') {
           const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
           let match;
           while ((match = linkRegex.exec(data.text)) !== null) {
             if (!allCitations.some(c => c.href === match[2])) {
               allCitations = [...allCitations, { type: 'link', title: match[1], href: match[2] }];
             }
           }
        }

        const updatedCase = {
            ...caseFiles[activeCaseId],
            title: newTitle,
            messages: finalMessages,
            tokensSaved: newTotalCredits, // Save specific case credits
            references: allCitations
        };

        setCaseFiles({ ...caseFiles, [activeCaseId]: updatedCase });
      } else {
        toast.error(data.message || "Failed to get response");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const ModeToggle = () => (
    <div className="flex bg-slate-100 p-1 rounded-lg self-start md:self-auto">
        <button 
            onClick={() => setMode('quick')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${mode === 'quick' ? 'bg-white text-[#FF5B33] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <Zap size={14} /> Quick
        </button>
        <button 
            onClick={() => setMode('deep')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${mode === 'deep' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <FileText size={14} /> Deep
        </button>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isLoggedIn) return null;

  return (
    <>
      <FontLoader />
      <div className="h-[calc(100vh-64px)] flex bg-[#F8FAFC] relative overflow-hidden font-sans text-slate-900">
        
        {/* Sidebar */}
        <div className={`
            absolute inset-y-0 left-0 z-20 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-hidden
            ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0'}
            md:relative md:opacity-100
            ${!isSidebarOpen && 'md:w-0 md:border-none'} 
        `}>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center min-w-[288px]">
             <h2 className="font-bold text-slate-700">My Consultations</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><X size={20}/></button>
          </div>
          <div className="p-4 min-w-[288px]">
            <button onClick={() => handleCreateNewCase()} className="w-full bg-[#171717] text-white py-3 px-4 rounded-lg hover:bg-black transition font-semibold flex items-center justify-center gap-2 shadow-md shadow-slate-900/10">
                <Pencil size={16} /> New Consultation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[288px]">
             {Object.entries(caseFiles).sort((a, b) => b[0].localeCompare(a[0])).map(([caseId, caseData]) => (
                <div key={caseId} className="group relative">
                    {renamingCaseId === caseId ? (
                        <form onSubmit={handleRenameSubmit} className="p-2">
                            <input 
                                autoFocus
                                className="w-full p-2 text-sm border border-blue-300 rounded" 
                                value={newCaseName} 
                                onChange={e => setNewCaseName(e.target.value)}
                                onBlur={() => setRenamingCaseId(null)}
                            />
                        </form>
                    ) : (
                        <button 
                            onClick={() => setActiveCaseId(caseId)}
                            className={`w-full text-left p-3 rounded-lg transition-colors pr-8 relative ${activeCaseId === caseId ? 'bg-orange-50 text-orange-900 border border-orange-100' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                            <p className="font-medium text-sm truncate">{caseData.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(parseInt(caseId.split('-')[1])).toLocaleDateString()}</p>
                            <div 
                                onClick={(e) => handleContextMenu(e, caseId)}
                                className="absolute right-2 top-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical size={16} />
                            </div>
                        </button>
                    )}
                </div>
             ))}
          </div>
        </div>

        {contextMenu.visible && (
            <div 
                ref={contextMenuRef}
                className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg py-1 w-32"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                <button onClick={() => toast.success("Pinned (Demo)")} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><Pin size={14}/> Pin</button>
                <button onClick={handleRenameStart} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><Pencil size={14}/> Rename</button>
                <button onClick={handleDeleteCase} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
            </div>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col h-full relative w-full transition-all duration-300">
          
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:text-[#171717] p-1 rounded-md hover:bg-slate-100 transition">
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 truncate max-w-[150px] md:max-w-sm">
                        {caseFiles[activeCaseId]?.title || 'New Consultation'}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={`w-2 h-2 rounded-full ${activeCaseId ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                        {activeCaseId ? 'Active Session' : 'Ready'}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
                <div className="group relative hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100 text-xs font-bold cursor-help">
                    <Sparkles size={14} className="text-[#FF5B33] fill-[#FF5B33]" />
                    <span>{savedCredits} Credits Saved</span>
                    <Info size={14} className="ml-1 text-orange-300 group-hover:text-orange-600 transition-colors" />
                    
                    <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-white shadow-2xl border border-slate-200 rounded-xl text-left invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Sparkles size={14} className="text-[#FF5B33]"/> How Credits Work
                        </h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                            We calculate "Effort Saved" based on the complexity of your query.
                        </p>
                        <ul className="space-y-2 text-[11px]">
                            <li className="flex items-start gap-2">
                                <span className="bg-orange-100 text-orange-700 px-1.5 rounded font-bold">Vague</span>
                                <span className="text-slate-600">High Credits (1.5x - 3.0x). AI bridges the gaps.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-green-100 text-green-700 px-1.5 rounded font-bold">Specific</span>
                                <span className="text-slate-600">Lower Credits. You provided the context.</span>
                            </li>
                        </ul>
                    </div>

                    {creditPop && (
                        <div className="absolute -top-6 right-0 text-[#FF5B33] font-bold text-sm animate-float">
                            +{creditPop}
                        </div>
                    )}
                </div>

                <div className="hidden md:block border-l border-slate-200 h-6 mx-2"></div>
                <ModeToggle />
                {mode === 'deep' && (
                    <button onClick={() => setIsReferencesOpen(!isReferencesOpen)} className="text-slate-400 hover:text-[#FF5B33] transition ml-2">
                        {isReferencesOpen ? <PanelRightClose size={24}/> : <PanelRightOpen size={24}/>}
                    </button>
                )}
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
             <div className="max-w-5xl mx-auto space-y-8 pb-4">
                {messages.length === 0 && (
                    <div className="text-center py-20 px-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <div className="text-3xl">⚖️</div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">How can I help you today?</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Ask about your rights, specific acts, or describe a situation. 
                            Use <span className="font-bold text-[#FF5B33]">Quick</span> for summaries and <span className="font-bold text-blue-600">Deep</span> for detailed legal strategy.
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                   <div key={i} className={`
                        w-full rounded-2xl p-6 shadow-sm relative mb-6 flex
                        ${msg.role === 'user' 
                            ? 'bg-[#FF5B33] text-white border border-[#FF5B33] justify-between' 
                            : 'bg-white border border-slate-200 gap-4'
                        }
                   `}>
                      
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center text-white shrink-0 mt-1">
                            <BookCopy size={14} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                         {msg.role === 'model' ? (
                            <>
                                <div className="prose-legal">
                                    {/* Use custom components for Markdown */}
                                    <ReactMarkdown components={MarkdownComponents}>{msg.text}</ReactMarkdown>
                                </div>
                                {msg.credits > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-orange-600">
                                        <Zap size={12} className="fill-orange-600"/>
                                        {msg.credits} credits saved with this answer
                                    </div>
                                )}
                            </>
                         ) : (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                         )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 mt-1 ml-4">
                            <User size={16} />
                        </div>
                      )}
                   </div>
                ))}
                
                {isLoading && (
                    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center text-white shrink-0 mt-1">
                            <BookCopy size={14} />
                        </div>
                        <div className="flex-1">
                            <ChatSkeleton />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
             </div>
          </div>

          {/* Input */}
          <div className="bg-white border-t border-slate-200 p-4 md:p-6 relative z-20">
            <div className="max-w-5xl mx-auto">
                <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-[#FF5B33] focus-within:ring-4 focus-within:ring-orange-500/10 transition-all shadow-inner">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={mode === 'deep' ? "Describe the full situation in detail for a better legal strategy..." : "Ask a legal question..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none p-3 max-h-32 min-h-[24px] text-slate-800 placeholder:text-slate-400"
                        rows={1}
                        disabled={isLoading || !activeCaseId}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-[#171717] text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed mb-[1px]"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="text-center text-xs text-slate-400 mt-3">
                    Advocat can make mistakes. Please verify legal citations independently.
                </p>
            </div>
          </div>

        </div>

        {mode === 'deep' && (
           <div className={`
                fixed inset-y-0 right-0 z-30 bg-white shadow-2xl border-l border-slate-200 transition-all duration-300 ease-in-out overflow-hidden
                ${isReferencesOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'}
                lg:relative lg:shadow-none
                ${!isReferencesOpen && 'lg:w-0 lg:border-none'}
           `}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 min-w-[320px]">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2"><LinkIcon size={16}/> Citations</h3>
                 <button onClick={() => setIsReferencesOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-[320px]">
                 {activeReferences.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm italic">
                        Citations and relevant acts will appear here when you use <strong>Deep Mode</strong>.
                    </div>
                 ) : (
                   <ul className="space-y-3">
                     {activeReferences.map((ref, i) => (
                        <li key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm hover:border-blue-200 transition-colors">
                           <a href={ref.href || '#'} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                               <span className="mt-0.5 text-blue-500"><BookCopy size={14}/></span>
                               <span className="text-slate-700 font-medium group-hover:text-blue-600 underline decoration-slate-300 group-hover:decoration-blue-400 underline-offset-2 break-words">
                                 {ref.title}
                               </span>
                           </a>
                        </li>
                     ))}
                   </ul>
                 )}
              </div>
           </div>
        )}

      </div>
    </>
  );
}