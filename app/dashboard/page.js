'use client';
import React from 'react';
import Link from 'next/link';
import { MessageSquare, FileText, Scale } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Import the new hook

export default function Dashboard() {
  // Use the hook to handle auth checks automatically
  const { isLoggedIn, loading } = useAuth(true); 

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isLoggedIn) return null; // useAuth will handle redirect

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Scale size={48} className="mx-auto mb-4" style={{ color: 'var(--primary-accent)' }} />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Your Rights Toolkit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pick your path: Quick chats for everyday questions or build a detailed case when you're feeling stuck.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Queries Card */}
          <Link href="/general-queries" className="group block">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 border border-gray-200">
              <MessageSquare size={56} className="mx-auto mb-6 text-blue-500 group-hover:scale-110 transition" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Quick Rights Chat</h2>
              <p className="text-gray-600 text-center mb-6">
                Vent a scenario like "My boss skipped my bonus"—get instant insights on your constitutional rights and next steps.
              </p>
              <div className="text-center">
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                  Start Chatting →
                </span>
              </div>
            </div>
          </Link>

          {/* Advisor Card */}
          <Link href="/case-advisor" className="group block">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 border border-gray-200">
              <FileText size={56} className="mx-auto mb-6 text-green-500 group-hover:scale-110 transition" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Case Builder</h2>
              <p className="text-gray-600 text-center mb-6">
                Stuck in a dispute? Map your evidence, location, and details for a custom educational analysis and action plan.
              </p>
              <div className="text-center">
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                  Build My Case →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Tip</h3>
          <p className="text-gray-600">
            Start with Quick Chat for basics, then level up to Case Builder for precision. Remember: This is educational—always consult a pro!
          </p>
        </div>
      </div>
    </div>
  );
}