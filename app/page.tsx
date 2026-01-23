'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Shield, Zap, CreditCard, FileText, ArrowRight, CheckCircle } from 'lucide-react';

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
            <div className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg">M</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MicroFreelance</span>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-md"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-black transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link 
                  href="/login" 
                  className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative pt-20 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-600 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Now with Stripe Payments
          </div>

          <h1 className="text-5xl tracking-tight font-extrabold text-slate-900 sm:text-6xl md:text-7xl mb-6 leading-[1.1]">
            Contracts that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">get you paid.</span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed">
            Generate bulletproof scopes of work with AI, sign digitally, and collect deposits instantly. The all-in-one workspace for modern freelancers.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/create" 
              className="px-8 py-4 bg-black text-white font-bold rounded-xl text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Create Free Contract <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features" 
              className="px-8 py-4 border border-slate-200 text-lg font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all"
            >
              How it works
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-slate-400 font-medium">
            No credit card required · Instant PDF · Free forever plan
          </p>

          {/* Hero Image Mockup */}
          <div className="mt-16 rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-50 p-2 md:p-4 max-w-5xl mx-auto">
             <div className="bg-white rounded-xl border border-gray-100 aspect-[16/9] md:aspect-[21/9] flex items-center justify-center relative overflow-hidden">
                {/* Abstract UI representation */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
                <div className="relative z-10 text-center space-y-4">
                   <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600 shadow-sm">
                      <FileText className="w-8 h-8" />
                   </div>
                   <div>
                      <p className="font-bold text-xl text-gray-900">Project: Website Redesign</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid $5,000
                        </span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* 3. FEATURES GRID */}
      <section id="features" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Everything you need to look pro</h2>
            <p className="text-slate-500">Stop using Word docs and Venmo. Upgrade your workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">AI Drafter</h3>
              <p className="text-slate-500 leading-relaxed">
                Describe your project in one sentence. Our AI writes a detailed, legally-sound Scope of Work in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Instant Payments</h3>
              <p className="text-slate-500 leading-relaxed">
                Connect your bank account via Stripe. Clients can pay directly on the contract page with one click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">E-Signatures</h3>
              <p className="text-slate-500 leading-relaxed">
                Legally binding digital signatures for both you and your client. No need for DocuSign or printing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TEMPLATE GRID (SEO Links) */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200">
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
              <li><Link href="/hire/hire-brand-strategist" className="text-slate-600 hover:text-blue-600 hover:underline">Marketing Consulting</Link></li>
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600 opacity-10 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">Ready to get paid professionally?</h2>
          <p className="text-slate-300 mb-10 text-xl max-w-2xl mx-auto">Join smart freelancers using MicroFreelance to protect their work and look professional.</p>
          <Link 
            href="/create" 
            className="inline-block bg-white text-slate-900 font-bold px-10 py-5 rounded-full shadow-lg hover:bg-gray-100 transition-all text-lg hover:-translate-y-1"
          >
            Start Your First Contract
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white text-slate-400 py-12 text-center text-sm border-t border-slate-200">
        <p className="font-medium text-slate-500 mb-2">&copy; {new Date().getFullYear()} MicroFreelance. All rights reserved.</p>
        <p className="mb-6">Built for freelancers, by freelancers.</p>
        <div className="flex justify-center gap-6">
          <Link href="/terms-of-service" className="hover:text-black hover:underline">Terms of Service</Link>
          <Link href="/disclaimer" className="hover:text-black hover:underline">Disclaimer</Link>
          <Link href="/login" className="hover:text-black hover:underline">Login</Link>
        </div>
      </footer>

    </div>
  );
}