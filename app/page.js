'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, RefreshCw, Layers, MessageSquare, Scale, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Feature Row Component ---
const FeatureRow = ({ icon: Icon, title, description, accent, variant = 'default' }) => {
  const isFilled = variant === 'filled';
  
  return (
    <div 
      className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 p-10 md:p-12 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group w-full ${isFilled ? 'shadow-lg' : 'bg-white'}`}
      style={{ 
        backgroundColor: isFilled ? accent : 'white', 
        border: isFilled ? 'none' : `2px solid ${accent}20`
      }}
    >
      <div className="flex flex-col md:flex-row items-center gap-6 md:w-1/3 shrink-0 text-center md:text-left">
        <div className={`p-5 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${isFilled ? 'bg-white' : 'bg-gray-50'}`}>
          <Icon size={36} strokeWidth={2.5} style={{ color: accent }} />
        </div>
        <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isFilled ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
      <div className={`md:w-2/3 text-center md:text-left border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-12 ${isFilled ? 'border-white/20' : 'border-gray-100'}`}>
        <p className={`text-lg md:text-xl leading-relaxed font-medium ${isFilled ? 'text-white/90' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  
  const getLink = (path) => isLoggedIn ? path : '/auth';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* --- Section 1: Hero (LOWERED BOTTOM EDGE) --- */}
      {/* Changed pb-24/32 to pb-32/48 to extend orange area */}
      <section className="bg-[#FF5B33] pt-24 pb-32 md:pt-32 md:pb-48 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/noise.png')]"></div>
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
              Understand your <br />
              <span className="text-white opacity-90">rights instantly</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Get clear, practical legal guidance for any question. No jargon—just straightforward answers and next steps, tailored for everyday situations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 md:gap-8">
              
              {/* Button 1: Quick Chat */}
              <Link href={getLink("/general-queries")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-[#FF5B33] font-bold py-4 px-10 rounded-xl shadow-xl hover:bg-gray-50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 text-xl border-2 border-transparent">
                  <MessageSquare size={24} />
                  Quick Rights Chat
                </button>
              </Link>

              {/* Button 2: Case Advisor */}
              <Link href={getLink("/case-advisor")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-[#171717] font-bold py-4 px-10 rounded-xl shadow-xl hover:bg-gray-50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 text-xl border-2 border-transparent">
                  <Scale size={24} />
                  Case Advisor
                </button>
              </Link>

            </div>
        </div>
      </section>

      {/* --- Section 2: Empower your legal knowledge --- */}
      {/* Reduced top padding (pt-12) to minimize white gap */}
      <section className="bg-white pt-12 pb-20">
        <div className="container mx-auto px-4 max-w-6xl flex justify-center">
          <div className="w-full md:w-3/4 bg-white p-10 md:p-14 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#FF5B33]"></div>
            <p className="text-sm font-bold uppercase tracking-widest mb-4 text-[#FF5B33]">LEGAL INSIGHTS</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#171717]">
              Empower your legal knowledge
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
              Discover your rights and get expert advice on any legal issue. Our platform simplifies complex legal information, making it accessible to everyone.
            </p>
            <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
              <button className="bg-[#171717] text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-black hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                {isLoggedIn ? "Open Dashboard" : "Start now"} <ArrowRight size={20}/>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Section 3: Services --- */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#171717] mb-4 text-center">
            Legal help, simplified for everyone
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-3xl mx-auto text-lg">
            Get clear, practical legal guidance in minutes. Ask questions, understand your rights, and find your next steps—no legal background needed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href={getLink("/general-queries")} className="group block h-full">
              <div className="relative bg-white border border-slate-200 p-8 rounded-2xl h-full flex flex-col transition-all duration-300 hover:border-[#FF5B33] hover:shadow-xl hover:-translate-y-1">
                <div className="mb-6 p-4 bg-orange-50 rounded-xl w-fit group-hover:bg-[#FF5B33] transition-colors duration-300">
                  <MessageSquare size={32} className="text-[#FF5B33] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-[#171717] group-hover:text-[#FF5B33] transition-colors">
                  Quick Rights Chat
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Ask any legal question and receive clear, straightforward answers—no case details required. Perfect for everyday doubts.
                </p>
              </div>
            </Link>

            <Link href={getLink("/case-advisor")} className="group block h-full">
              <div className="relative bg-white border border-slate-200 p-8 rounded-2xl h-full flex flex-col transition-all duration-300 hover:border-[#171717] hover:shadow-xl hover:-translate-y-1">
                <div className="mb-6 p-4 bg-slate-50 rounded-xl w-fit group-hover:bg-[#171717] transition-colors duration-300">
                  <Scale size={32} className="text-[#171717] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-[#171717] group-hover:text-[#171717] transition-colors">
                  Case Advisor
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Share your situation for precise, step-by-step legal advice. We'll build a strategy, evidence checklist, and timeline for you.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Section 4: Features --- */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-[#FF5B33] mb-3">DISCOVER OUR CORE FEATURES</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#171717] mb-16 text-center">
            Legal answers made effortless
          </h2>

          <div className="flex flex-col space-y-8">
            <FeatureRow 
              icon={Layers} 
              title="Easy to use" 
              description="Access legal help through a straightforward, intuitive interface designed for everyone—no law degree required. Just type and get answers." 
              accent="#171717" 
              variant="filled" 
            />
            <FeatureRow 
              icon={RefreshCw} 
              title="Accurate responses" 
              description="Get reliable, up-to-date legal information powered by advanced AI that cites specific Indian Constitutional Articles and Acts." 
              accent="#171717" 
              variant="default" 
            />
            <FeatureRow 
              icon={Clock} 
              title="Save tokens" 
              description="Find quick, relevant answers without wasting resources. We optimize every interaction for speed, efficiency, and clarity." 
              accent="#FF5B33" 
              variant="filled" 
            />
          </div>
        </div>
      </section>

      {/* --- Section 5: FAQ & CTA --- */}
      <section className="py-16 md:py-24 bg-[#171717] text-white">
        <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div style={{backgroundColor: 'var(--primary-accent)'}} className="p-10 md:p-12 rounded-3xl shadow-2xl">
                <h2 className="text-4xl font-extrabold mb-6 leading-tight">Your legal questions, answered fast</h2>
                <p className="text-lg text-white/90 mb-8 font-medium">Find clear, practical guidance on your rights and next steps in simple language.</p>
                <Link href={getLink("/dashboard")}>
                    <button className="bg-white text-[#FF5B33] font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 flex items-center gap-2 text-lg">
                        {isLoggedIn ? "Start Your Journey" : "Ask now"} <ArrowRight size={20} />
                    </button>
                </Link>
                <div className="mt-8 pt-6 border-t border-white/20 flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider">
                    <span>Simple • Educational</span>
                </div>
            </div>

            <div className="space-y-8">
                <h3 className="text-2xl font-bold text-white border-b border-gray-700 pb-4 mb-2">Frequently Asked Questions</h3>
                <div>
                    <h4 className="font-bold text-white text-lg mb-1">What are 'Credits Saved'?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Think of AI tokens as "word-coins". A typical chat burns thousands. We do the heavy lifting upfront, optimizing your prompt to get a complete strategy in one go. "Credits Saved" tracks that efficiency.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg mb-1">Can I use this in court?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        No. Advocat-Easy is an <strong>educational tool</strong>. We empower you to understand your rights and strategy so you can talk to a lawyer confidently, but this is not a substitute for professional counsel.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg mb-1">Is my question confidential?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Absolutely. Your details and questions are encrypted and never shared publicly. We use them solely to generate your specific legal analysis during the active session.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg mb-1">Quick Chat vs. Case Advisor?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Use <strong>Quick Chat</strong> for everyday doubts (e.g., "Is this rent clause legal?"). Use <strong>Case Advisor</strong> when you have a specific dispute and need a structured roadmap and evidence checklist.
                    </p>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
}