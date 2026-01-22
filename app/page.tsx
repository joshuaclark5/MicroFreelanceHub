'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  // Check auth just to update the Navbar (don't block the page)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      
      {/* 1. NAVBAR */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold shadow-sm">⚡</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MicroFreelanceHub</span>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link 
                  href="/login" 
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative pt-20 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-full text-sm mb-6 border border-blue-100">
            ✨ AI-Powered • 100% Free for Freelancers
          </div>
          <h1 className="text-5xl tracking-tight font-extrabold text-slate-900 sm:text-6xl md:text-7xl mb-6">
            Turn vague ideas into <br className="hidden md:block" />
            <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">professional contracts.</span>
          </h1>
          {/* Plain English "Pain-First" Hook */}
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed">
            Stop doing extra work for free. Generate rock-solid <strong>Statements of Work (SOW)</strong> that set clear boundaries so you get paid for every change.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/create" 
              className="px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              ✨ Create Free Contract
            </Link>
            <Link 
              href="#templates" 
              className="px-8 py-4 border border-slate-200 text-lg font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 md:text-xl hover:border-slate-300 transition-all"
            >
              View Templates
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400 font-medium">
            No credit card required · Instant PDF · Free forever plan
          </p>
        </div>
      </div>

      {/* 3. SOCIAL PROOF / TRUST BADGES */}
      <div className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 text-center">
            <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="text-4xl mb-4 bg-blue-100 w-16 h-16 flex items-center justify-center rounded-full">🛡️</div>
              <h3 className="font-bold text-lg text-slate-900">Liability Shield</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Automatic legal clauses help protect you from cancellations, scope creep & IP theft.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="text-4xl mb-4 bg-purple-100 w-16 h-16 flex items-center justify-center rounded-full">🤖</div>
              <h3 className="font-bold text-lg text-slate-900">AI Scope Doctor</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Our AI interviews you to turn vague client ideas into strict, payable deliverables.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="text-4xl mb-4 bg-green-100 w-16 h-16 flex items-center justify-center rounded-full">💸</div>
              <h3 className="font-bold text-lg text-slate-900">Smart Tax Calc</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Never eat the cost of taxes. Automatically calculate and add fees to your total.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TEMPLATE GRID (SEO LINKS - 100% MATCHED TO SITEMAP) */}
      <div id="templates" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Find a Contract for Your Niche
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Don't write from scratch. Select your industry to get a pre-filled legal agreement.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Creative Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">🎨 Creative</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/graphic-design-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Graphic Designer Contract</Link></li>
              <li><Link href="/templates/video-editor-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Video Editor Agreement</Link></li>
              <li><Link href="/hire/freelance-ux-designer" className="text-slate-600 hover:text-blue-600 hover:underline">UX/UI Design SOW</Link></li>
              <li><Link href="/templates/event-photographer-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Photography Release</Link></li>
            </ul>
          </div>

          {/* Tech Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">💻 Tech & Dev</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/web-development-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Web Developer Contract</Link></li>
              <li><Link href="/templates/mobile-app-developer-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Mobile App SOW</Link></li>
              <li><Link href="/hire/full-stack-engineer-contractor" className="text-slate-600 hover:text-blue-600 hover:underline">Software Engineer Agreement</Link></li>
              <li><Link href="/hire/unity-developer-for-hire" className="text-slate-600 hover:text-blue-600 hover:underline">Game Dev Contract</Link></li>
            </ul>
          </div>

          {/* Marketing Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">📈 Marketing</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/social-media-manager-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Social Media Contract</Link></li>
              <li><Link href="/templates/seo-specialist-contract" className="text-slate-600 hover:text-blue-600 hover:underline">SEO Retainer Agreement</Link></li>
              <li><Link href="/templates/copywriting-contract" className="text-slate-600 hover:text-blue-600 hover:underline">Copywriting SOW</Link></li>
              <li><Link href="/hire/hire-marketing-consultant" className="text-slate-600 hover:text-blue-600 hover:underline">Marketing Consulting</Link></li>
            </ul>
          </div>

          {/* Trades Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">🔨 Trades</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/hire/hire-plumber" className="text-slate-600 hover:text-blue-600 hover:underline">Plumbing Contract</Link></li>
              <li><Link href="/hire/hire-electrician" className="text-slate-600 hover:text-blue-600 hover:underline">Electrician Work Order</Link></li>
              <li><Link href="/hire/hire-landscaper" className="text-slate-600 hover:text-blue-600 hover:underline">Landscaping Agreement</Link></li>
              <li><Link href="/hire/hire-handyman" className="text-slate-600 hover:text-blue-600 hover:underline">Handyman Invoice</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* 5. FINAL CTA */}
      <div className="bg-slate-900 py-20 relative overflow-hidden">
        {/* Background decorative blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600 opacity-10 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">Ready to get paid professionally?</h2>
          <p className="text-slate-300 mb-10 text-xl max-w-2xl mx-auto">Join smart freelancers using MicroFreelanceHub to protect their work and look professional.</p>
          <Link 
            href="/create" 
            className="inline-block bg-white text-blue-900 font-bold px-10 py-5 rounded-full shadow-lg hover:bg-blue-50 transition-all text-lg hover:-translate-y-1"
          >
            Start Your First Contract
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-50 text-slate-400 py-12 text-center text-sm border-t border-slate-200">
        <p className="font-medium text-slate-500 mb-2">&copy; {new Date().getFullYear()} MicroFreelanceHub. All rights reserved.</p>
        <p className="mb-6">Built for freelancers, by freelancers.</p>
        <div className="flex justify-center gap-6">
          <Link href="/terms-of-service" className="hover:text-blue-600 hover:underline">Terms of Service</Link>
          <Link href="/disclaimer" className="hover:text-blue-600 hover:underline">Disclaimer</Link>
          <Link href="/login" className="hover:text-blue-600 hover:underline">Login</Link>
        </div>
      </footer>

    </div>
  );
}