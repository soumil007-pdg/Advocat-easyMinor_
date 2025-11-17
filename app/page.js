'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Importing specific icons used in the inspiration site's design language
import { BookOpen, Scale, MessageSquare, Clock, RefreshCw, Layers, Zap, User, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Use placeholders for the image section
const TabletImagePlaceholder = () => (
    <div className="w-full h-80 md:h-96 bg-gray-200/50 rounded-lg flex items-center justify-center p-8 relative overflow-hidden shadow-xl">
        {/* Placeholder hands/tablet from the video, styled to look sleek */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/pic4.jpg')", opacity: 0.1 }}></div>

        <div className="relative z-10 w-full max-w-sm h-64 bg-white rounded-lg shadow-2xl border-4" style={{borderColor: 'var(--primary-accent)'}} >
            <img src="/public/pic2.jpeg" alt="Constitution" className="w-full h-full object-cover rounded-md opacity-20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-900 p-4">
                <h3 className='text-sm font-bold text-gray-600 mb-2'>LEGAL DOCUMENT PREVIEW</h3>
                <p className='text-md text-center font-serif'>Confidentiality Agreement 2025 Draft</p>
            </div>
        </div>
    </div>
);

// --- Reusable Card Component (Removed hover effect logic here since it's now handled by Link wrapper) ---
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
              {/* --- FIX: Updated link to target #features ID --- */}
              <Link href={isLoggedIn ? "#features" : "/auth"}>
                <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 text-lg">
                  Get Started
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
            {/* FIX: Updated link to target #features ID */}
            <Link href={isLoggedIn ? "#features" : "/auth"}>
              <button style={{backgroundColor: 'var(--primary-accent)'}} className="text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition duration-300">
                Start now
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Section 3: Legal help, simplified (Features Grid) --- */}
      <section id="features" className="py-16 md:py-24" style={{backgroundColor: 'var(--gray-light)'}}>
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
            Legal help, simplified for everyone
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Get clear, practical legal guidance in minutes. Ask questions, understand your rights, and find your next steps—no legal background needed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Case Advisor Card (Clickable, Dark Blue Border) */}
            <Link href={getButtonLink("/case-advisor")}>
                <Card 
                icon={Scale}
                title="Case advisor"
                description="Share your situation for precise, step-by-step legal advice, tailored to your needs."
                accent="var(--dark-blue)" // Dark Blue (Case Advisor Theme)
                />
            </Link>
            
            {/* General Query Card (Clickable, Vibrant Orange-Red Border) */}
            <Link href={getButtonLink("/general-queries")}>
                <Card 
                icon={MessageSquare}
                title="General query"
                description="Ask any legal question and receive clear, straightforward answers—no case details required."
                accent="var(--primary-accent)" // Vibrant Orange-Red (General Query Theme)
                />
            </Link>
            
            {/* Know Your Rights Card (STATIC DIV - Non-clickable) */}
            <div className="cursor-default">
                <Card 
                icon={BookOpen}
                title="Know your rights"
                description="Quickly learn your legal rights with easy explanations to help you make informed choices."
                accent="#10b981" // Emerald/Green (Placeholder)
                isClickable={false} // Override hover/transform effect
                />
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 4: Legal answers made effortless (Value Props Grid) --- */}
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
              description="Access legal help through a straightforward, intuitive interface—for everyone."
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
              title="Save time"
              description="Find quick, relevant answers without sifting through complex documents."
              accent="#f43f5e" // Rose
              isClickable={false}
            />
          </div>

          <div className="text-center mt-12">
            {/* --- FIX: Updated link to target #features ID --- */}
            <Link href={isLoggedIn ? "#features" : "/auth"}>
              <button style={{backgroundColor: 'var(--primary-accent)'}} className="text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition duration-300">
                Start Now
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
                <Link href={getButtonLink("/general-queries")}>
                    <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300">
                        Ask now
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
                    <p className="text-sm text-gray-300">Ask about any legal issue—housing, work, contracts, and more. We cover a wide range of everyday legal topics.</p>
                </div>

                <div>
                    <h4 className="font-semibold text-white">When will I get an answer?</h4>
                    <p className="text-sm text-gray-300">Most answers are **instant**. For complex questions, expect a detailed response within minutes.</p>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
}