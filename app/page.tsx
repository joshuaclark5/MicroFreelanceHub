'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone,
  FileSignature
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* 1. NAVBAR */}
      <nav className="border-b border-gray-100/50 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg shadow-lg">M</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MicroFreelance</span>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-black transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link 
                  href="/login" 
                  className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (Updated for Trades) */}
      <section className="px-6 pt-24 pb-24 md:pt-32 md:pb-32 max-w-5xl mx-auto text-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>

        <div className="space-y-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Send Contracts. <br className="hidden md:block" />
            Get Signed. <span className="text-blue-600">Get Paid.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The operating system built for <b>Contractors & Trades</b>. 
            Hand your phone to the client for an instant signature, or email a secure link.
            <br/><span className="text-sm text-slate-500 mt-2 block">(Works for Creative Freelancers too).</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/create" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 rounded-xl px-8 py-4 font-bold text-lg flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-blue-300">
                Start Service Agreement
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
            <Link href="/templates/plumber-contract-template" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl px-8 py-4 font-bold text-lg flex items-center justify-center transition-all">
                See Plumber Demo
              </div>
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 pt-6">
            <span className="inline-flex items-center"><Smartphone className="h-4 w-4 mr-1 text-blue-600"/> Kiosk Mode (Sign on Glass)</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center"><CheckCircle2 className="h-4 w-4 mr-1 text-green-600"/> Free for 3 projects</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center"><FileSignature className="h-4 w-4 mr-1 text-purple-600"/> Zero Liability (You own the contract)</span>
          </div>
        </div>
      </section>

      {/* 4. FOUNDER STORY SECTION */}
      <section className="bg-slate-900 text-white py-20 md:py-28 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-sm font-medium mb-8">
              Why I built this
            </div>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
              "I lost $15k on a refund because of a bad contract."
            </h2>
            <div className="space-y-6 text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              <p>
                I was a metal worker. I did the work, bought the materials, and installed the project. 
                But because my "contract" was just a text message, when the client changed their mind, 
                I had no legal leg to stand on.
              </p>
              <p>
                I built MicroFreelanceHub so that never happens to you. 
                Whether you are fixing a sink or designing a logo, you need a safety net.
              </p>
            </div>
            <div className="pt-10 flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 border border-slate-700">JC</div>
              <div>
                <p className="font-semibold text-white text-lg">Joshua Clark</p>
                <p className="text-slate-400">Founder & Tradesman</p>
              </div>
            </div>
        </div>
      </section>

      {/* 5. TEMPLATES SECTION (REORDERED: Trades First) */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Templates</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Find an Agreement for Your Trade
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Trades (MOVED TO FIRST POSITION) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group shadow-sm hover:shadow-md">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">🔨 Trades & Service</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/plumber-contract-template" className="text-slate-500 hover:text-black hover:underline">Plumbing Agreement</Link></li>
              <li><Link href="/templates/electrician-contract-template" className="text-slate-500 hover:text-black hover:underline">Electrician Service Agrmt</Link></li>
              <li><Link href="/templates/hvac-tech-contract-template" className="text-slate-500 hover:text-black hover:underline">HVAC Work Order</Link></li>
              <li><Link href="/templates/handyman-contract-template" className="text-slate-500 hover:text-black hover:underline">Handyman Contract</Link></li>
              <li><Link href="/templates/landscaper-contract-template" className="text-slate-500 hover:text-black hover:underline">Landscaping Contract</Link></li>
            </ul>
          </div>

          {/* Creative */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">🎨 Creative</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/graphic-design-contract" className="text-slate-500 hover:text-black">Graphic Design SOW</Link></li>
              <li><Link href="/templates/video-editor-contract" className="text-slate-500 hover:text-black">Video Editor Agreement</Link></li>
              <li><Link href="/templates/freelance-ux-designer" className="text-slate-500 hover:text-black">UX/UI Design Scope</Link></li>
            </ul>
          </div>

          {/* Tech */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">💻 Tech</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/web-development-contract" className="text-slate-500 hover:text-black">Web Developer Contract</Link></li>
              <li><Link href="/templates/mobile-app-developer-contract" className="text-slate-500 hover:text-black">Mobile App SOW</Link></li>
              <li><Link href="/templates/full-stack-engineer-contractor" className="text-slate-500 hover:text-black">Software Engineer Agreement</Link></li>
            </ul>
          </div>

          {/* Marketing */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">📈 Marketing</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/social-media-manager-contract" className="text-slate-500 hover:text-black">Social Media Contract</Link></li>
              <li><Link href="/templates/seo-specialist-contract" className="text-slate-500 hover:text-black">SEO Retainer</Link></li>
              <li><Link href="/templates/copywriting-contract" className="text-slate-500 hover:text-black">Copywriting SOW</Link></li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* 6. CTA Footer */}
      <section className="bg-black py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tight">Ready to level up?</h2>
          <p className="text-slate-400 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
             Join the new standard. Create your first agreement in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link 
               href="/create" 
               className="inline-block bg-white text-black font-bold px-10 py-5 rounded-full shadow-xl hover:bg-gray-100 transition-all text-lg hover:-translate-y-1 hover:shadow-white/20"
             >
               Start New Agreement
             </Link>
             <Link 
               href="/login" 
               className="inline-block bg-transparent border border-white/20 text-white font-bold px-10 py-5 rounded-full hover:bg-white/10 transition-all text-lg"
             >
               Login to Account
             </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">No credit card required · Free plan available</p>
        </div>
      </section>
      
    </div>
  );
}