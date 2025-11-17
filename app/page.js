'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Importing specific icons used in the inspiration site's design language
import { BookOpen, Scale, MessageSquare, Clock, RefreshCw, Layers, Zap, User, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';


// Use placeholders for the image section
const TabletImagePlaceholder = () => (
    <div className="w-full h-80 md:h-96 bg-gray-200/50 rounded-lg flex items-center justify-center p-8 relative overflow-hidden shadow-xl">
        {/* Outer placeholder background - keeping it as is for structure */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/pic4.jpg')", opacity: 0.1 }}></div>

        {/* The White Box (Document Preview) - Corrected to include the image layer */}
        <div className="relative z-10 w-full max-w-sm h-64 bg-white rounded-lg shadow-2xl border-4 flex flex-col items-center justify-center overflow-hidden" style={{borderColor: 'var(--primary-accent)'}} >
            
            {/* The Lady Justice Image (as a subtle watermark background) */}
            <img 
                // Using /pic5.jpg which is already in your public folder
                src="/pic5.jpg" 
                alt="Statue of Lady Justice" 
                // Stretch to cover the whole box, center it, and make it very subtle (opacity-20)
                className="absolute inset-0 w-full h-full object-cover rounded-md opacity-40" 
            />

            

        </div>
    </div>
);

// --- Reusable Card Component (Used for Section 4) ---
const Card = ({ icon: Icon, title, description, accent, textColor = 'text-gray-800', isClickable = true }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-t-4 transition-all duration-300 ${isClickable ? 'transform hover:shadow-lg hover:-translate-y-1' : ''}`} style={{ borderColor: accent }}>
      <div className="p-3 mb-4 rounded-full w-fit" style={{ backgroundColor: `${accent}15` }}>
        <Icon size={24} style={{ color: accent }} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

// --- Main Page Component ---
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
  
  const getButtonLink = (path) => isLoggedIn ? path : '/auth';

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--gray-light)'}}>
      
      {/* --- Section 1: Hero (Vibrant Orange-Red Background) --- */}
      <section style={{backgroundColor: 'var(--primary-accent)'}} className="pt-16 pb-4 md:pb-12 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Heading and CTA */}
            <div className="py-12 md:py-24">
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                Understand your <br /><span style={{color: 'var(--light-accent)'}}>rights instantly</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-md">
                Get clear, practical legal guidance for any question. No jargon—just straightforward answers and next steps, tailored for everyday situations.
              </p>
              {/* --- UPDATED: For logged-in users, link to dashboard; guests to auth --- */}
              <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
                <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 text-lg">
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                </button>
              </Link>
            </div>

            {/* Right Column: Image (Placeholder) */}
            <div className="md:order-last order-first">
              <TabletImagePlaceholder />
            </div>

          </div>
        </div>
      </section>

      {/* --- Section 2: Empower your legal knowledge (White Block, Dark Text) --- */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl flex justify-center">
          <div className="w-full md:w-3/4 bg-white p-8 md:p-12 rounded-xl shadow-md relative border-t-4" style={{borderColor: 'var(--primary-accent)'}}>
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{color: 'var(--primary-accent)'}}>LEGAL INSIGHTS</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{color: 'var(--dark-text)'}}>
              Empower your legal knowledge
            </h2>
            <p className="text-md text-gray-700 mb-8 max-w-xl">
              Discover your rights and get expert advice on any legal issue. Our platform simplifies complex legal information, making it accessible to everyone.
            </p>
            {/* --- UPDATED: For logged-in users, link to dashboard; guests to auth --- */}
            <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
              <button style={{backgroundColor: 'var(--primary-accent)'}} className="text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition duration-300">
                {isLoggedIn ? "Open Dashboard" : "Start now"}
              </button>
            </Link>
          </div>
        </div>
      </section>

{/* ==================================================================
      === SECTION 3: REFINED (Consistent Hovers, Proper Caps, Pro Tip) ===
      ==================================================================
      */}
      <section id="features" className="py-16 md:py-24" style={{backgroundColor: 'var(--gray-light)'}}>
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
            Legal help, simplified for everyone
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Get clear, practical legal guidance in minutes. Ask questions, understand your rights, and find your next steps—no legal background needed.
          </p>

          {/* --- REFINED 2-COLUMN GRID: Consistent hover (bg-primary-accent + white text), proper titles --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* === Card 1: Case Advisor === */}
            <Link href={getButtonLink("/case-advisor")} className="group">
              <div 
                className="relative p-8 h-full bg-white rounded-lg shadow-xl border-t-4 
                           group-hover:bg-[var(--primary-accent)] 
                           transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
                           border-t-gray-300 
                           group-hover:border-t-white"
              >
                {/* Icon (using your Lucide icon) */}
                <div className="mb-4">
                  <Scale className="h-12 w-12 text-gray-500 group-hover:text-white transition-colors duration-300" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-white transition-colors duration-300">
                  Case Advisor
                </h3>
                <p className="text-gray-600 group-hover:text-white transition-colors duration-300">
                  Share your situation for precise, step-by-step legal advice, tailored to your needs.
                </p>
              </div>
            </Link>

            {/* === Card 2: General Queries === */}
            <Link href={getButtonLink("/general-queries")} className="group">
              <div 
                className="relative p-8 h-full bg-white rounded-lg shadow-xl border-t-4 
                           group-hover:bg-[var(--primary-accent)] 
                           transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
                           border-t-gray-300 
                           group-hover:border-t-white"
              >
                {/* Icon (using your Lucide icon) */}
                <div className="mb-4">
                  {/* Icon color matches the border, changes to white on hover */}
                  <MessageSquare 
                    className="h-12 w-12 group-hover:text-white transition-colors duration-300
                               text-gray-500"
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-white transition-colors duration-300">
                  General Queries
                </h3>
                <p className="text-gray-600 group-hover:text-white transition-colors duration-300">
                  Ask any legal question and receive clear, straightforward answers—no case details required.
                </p>
              </div>
            </Link>

          </div> {/* --- End Grid --- */}

          {/* --- NEW: Pro Tip Teaser for Feature Discovery --- */}
          {isLoggedIn && (
            <div className="mt-12 text-center">
              <p className="text-sm font-medium text-gray-600 mb-4">
                Pro Tip: Start with <strong>General Queries</strong> for quick insights, then use <strong>Case Advisor</strong> for deeper plans.
              </p>
              <Link href="/dashboard">
                <button className="bg-[var(--primary-accent)] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:opacity-90 transition duration-300">
                  Open Your Dashboard
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>


      {/* --- Section 4: Legal answers made effortless (Value Props Grid) --- */}
      {/* (This section is untouched and will still use your 'Card' component correctly) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">DISCOVER OUR CORE FEATURES</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 text-center">
            Legal answers made effortless
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card 
              icon={Layers}
              title="Easy to use"
              description="Access legal help through a straightforward, intuitive interface for everyone."
              accent="#f59e0b" // Amber/Yellow
              isClickable={false}
            />
            <Card 
              icon={RefreshCw}
              title="Accurate responses"
              description="Get reliable, up-to-date legal information powered by advanced AI."
              accent="#8b5cf6" // Violet
              isClickable={false}
            />
            <Card 
              icon={Clock}
              title="Save tokens"
              description="Find quick, relevant answers without wasting on other AI models." // FIXED: Typo "tockens" → "tokens"; polished desc
              accent="#f43f5e" // Rose
              isClickable={false}
            />
          </div>

          <div className="text-center mt-12">
            {/* --- UPDATED: For logged-in users, link to dashboard; guests to auth --- */}
            <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
              <button style={{backgroundColor: 'var(--primary-accent)'}} className="text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition duration-300">
                {isLoggedIn ? "Explore Dashboard" : "Start Now"}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Section 5: Ask Any Question (Final CTA Bar) --- */}
      <section style={{backgroundColor: 'var(--dark-text)'}} className="py-16 md:py-24 text-white">
        <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: CTA Box */}
            <div style={{backgroundColor: 'var(--primary-accent)'}} className="p-8 md:p-12 rounded-xl shadow-2xl">
                <h2 className="text-4xl font-extrabold mb-6">
                    Your legal questions, answered fast
                </h2>
                <p className="text-lg text-white/80 mb-8">
                    Find clear, practical guidance on your rights and next steps in simple language.
                </p>
                {/* --- UPDATED: Use getButtonLink for consistency; logged-in to dashboard --- */}
                <Link href={getButtonLink("/dashboard")}>
                    <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300">
                        {isLoggedIn ? "Go to Dashboard" : "Ask now"}
                    </button>
                </Link>
            </div>

            {/* Right Column: FAQ */}
            <div className="space-y-6 text-gray-200">
                <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Frequently Asked Questions</h3>
                
                <div>
                    <h4 className="font-semibold text-white">How do I ask a question?</h4>
                    <p className="text-sm text-gray-300">Enter your legal question in our direct query section and get a direct, easy-to-understand answer tailored to your situation.</p>
                </div>
                
                <div>
                    <h4 className="font-semibold text-white">Is my question confidential?</h4>
                    <p className="text-sm text-gray-300">Absolutely. Your details and questions are kept secure and never shared without your explicit permission.</p>
                </div>
                
                <div>
                    <h4 className="font-semibold text-white">What topics can I ask about?</h4>
                    <p className="text-sm text-gray-300">Ask about any legal issue—housing, work, contracts, and more. We cover a wide range of everyday legal topics and civil cases.</p>
                </div>

                <div>
                    <h4 className="font-semibold text-white">When will I get an answer?</h4>
                    <p className="text-sm text-gray-300">Most answers are <b>instant</b>. For complex questions, expect a detailed response within minutes.</p>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
}