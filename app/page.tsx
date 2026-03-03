'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone,
  Wrench,
  Paintbrush,
  Code2,
  TrendingUp,
  BellRing,
  Calculator,
  FileEdit,
  Link as LinkIcon
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

      {/* 2. HERO SECTION (Honest & High-Converting) */}
      <section className="px-6 pt-20 pb-12 md:pt-28 md:pb-16 max-w-6xl mx-auto text-center relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>

        <div className="space-y-8 relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Send Contracts. <br className="hidden md:block" />
            Get Signed. <span className="text-blue-600">Get Paid.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The automated contract and payment engine for freelancers. <strong className="text-slate-900 font-bold">We handle the awkward "please pay me" texts</strong>, you focus on the work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/create" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 rounded-xl px-8 py-4 font-bold text-lg flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-blue-300">
                Start Free Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
            <Link href="/templates/plumber-contract-template" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl px-8 py-4 font-bold text-lg flex items-center justify-center transition-all">
                See Plumber Demo
              </div>
            </Link>
          </div>

          {/* Honest Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-6">
            <div className="flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Mobile Friendly</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-700">Free for 3 Projects</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-bold text-slate-700">Zero Liability</span>
            </div>
          </div>
        </div>

        {/* 3. THE MOCKUP (Realistic & Honest) */}
        <div className="mt-16 relative max-w-4xl mx-auto translate-y-12 z-20 hidden md:block hover:-translate-y-2 transition-transform duration-500">
           <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl -z-10 rounded-full"></div>
           <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-left">
              
              {/* Mock Browser/App Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                 <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                 </div>
                 <div className="text-xs font-mono font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                    <Smartphone className="w-3 h-3" /> Client View
                 </div>
              </div>
              
              {/* Mock App Body - REAL TEXT */}
              <div className="p-8 grid md:grid-cols-2 gap-8 bg-slate-50/50">
                 
                 {/* Left side: Invoice Details */}
                 <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">Invoice #2026-001</div>
                    <div className="text-2xl font-extrabold text-slate-900 mb-2">Emergency Plumbing Repair</div>
                    <div className="text-sm text-slate-500 mb-6">Billed to: John Doe (123 Main St)</div>
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                          <span className="text-slate-600 font-medium">Labor (2 hours)</span>
                          <span className="text-slate-900">$190.00</span>
                       </div>
                       <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                          <span className="text-slate-600 font-medium">Parts (PVC & Sealant)</span>
                          <span className="text-slate-900">$45.00</span>
                       </div>
                    </div>
                 </div>
                 
                 {/* Right side: Total & Action */}
                 <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-center">
                    <div className="flex justify-between border-b border-slate-100 pb-3 mb-3">
                       <span className="text-slate-500 text-sm">Subtotal</span>
                       <span className="font-medium text-slate-900 text-sm">$235.00</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-3 mb-6">
                       <span className="text-slate-500 text-sm">Tax (7%)</span>
                       <span className="font-medium text-slate-900 text-sm">$16.45</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Due</div>
                          <div className="text-3xl font-extrabold text-slate-900">$251.45</div>
                       </div>
                       <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg shadow-emerald-200 font-bold text-sm flex items-center gap-2 cursor-default hover:-translate-y-0.5 transition-transform">
                          <CheckCircle2 className="w-4 h-4" /> Pay Now
                       </button>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      </section>

      {/* 4. THE BENTO BOX: CORE FEATURES */}
      <section className="py-24 bg-slate-50 border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">More than just a PDF generator.</h2>
            <p className="text-lg text-slate-600">
              MicroFreelanceHub automates your entire accounts receivable flow. Ditch the bloated CRMs and stop paying $40/month just to send an invoice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Automated Handoffs (Large) */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -right-10 -top-10 bg-blue-50 w-40 h-40 rounded-full blur-3xl"></div>
              <BellRing className="w-10 h-10 text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Automated Handoffs & Collections</h3>
              <p className="text-slate-600 mb-6 max-w-md leading-relaxed">
                Upload your final files and hit "Project Complete." We automatically email the client their deliverables along with a secure pay link. If they don't pay, our system follows up automatically on days 3, 5, 7, 10, and beyond.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-md border border-blue-100">Zero Awkward Texts</span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-md border border-emerald-100">Get Paid 3x Faster</span>
              </div>
            </div>

            {/* Feature 2: All-in-one Link (Small) */}
            <div className="md:col-span-1 bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <LinkIcon className="w-10 h-10 text-indigo-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">The All-in-One Link</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Scope of work, legal terms, e-signatures, and Stripe checkout are all bundled into one secure link. Once they sign, the payment options instantly unlock.
              </p>
            </div>

            {/* Feature 3: Built-in Accounting (Small/Dark) */}
            <div className="md:col-span-1 bg-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 bg-emerald-500/20 w-32 h-32 rounded-full blur-2xl"></div>
              <Calculator className="w-10 h-10 text-emerald-400 mb-6 relative z-10" />
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Simple Accounting</h3>
              <p className="text-slate-300 text-sm leading-relaxed relative z-10">
                Track all your Stripe earnings and log your manual expenses directly in the dashboard. At the end of the year, download a clean P&L sheet for tax season.
              </p>
            </div>

            {/* Feature 4: Change Orders (Large) */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <FileEdit className="w-10 h-10 text-amber-500 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Bulletproof Change Orders</h3>
              <p className="text-slate-600 mb-6 max-w-lg leading-relaxed">
                Client wants to add "just one more quick thing" mid-project? Edit the live agreement and update the price. The system instantly locks the project and forces a re-signature before you start the new work.
              </p>
              <div className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg border border-slate-200">
                Never do unpaid "Scope Creep" work again.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. FOUNDER STORY SECTION */}
      <section className="bg-slate-900 text-white py-20 md:pt-32 md:pb-28 relative overflow-hidden z-10">
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

      {/* 6. TEMPLATES SECTION */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Templates</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Find an Agreement for Your Trade
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Trades */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group shadow-sm hover:shadow-md">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">
              <Wrench className="w-5 h-5 text-indigo-500" /> Trades & Service
            </h3>
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
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">
              <Paintbrush className="w-5 h-5 text-indigo-500" /> Creative
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/graphic-design-contract" className="text-slate-500 hover:text-black hover:underline">Graphic Design SOW</Link></li>
              <li><Link href="/templates/video-editor-contract" className="text-slate-500 hover:text-black hover:underline">Video Editor Agreement</Link></li>
              <li><Link href="/templates/freelance-ux-designer" className="text-slate-500 hover:text-black hover:underline">UX/UI Design Scope</Link></li>
            </ul>
          </div>

          {/* Tech */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">
              <Code2 className="w-5 h-5 text-indigo-500" /> Tech
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/web-development-contract" className="text-slate-500 hover:text-black hover:underline">Web Developer Contract</Link></li>
              <li><Link href="/templates/mobile-app-developer-contract" className="text-slate-500 hover:text-black hover:underline">Mobile App SOW</Link></li>
              <li><Link href="/templates/full-stack-engineer-contractor" className="text-slate-500 hover:text-black hover:underline">Software Engineer Agreement</Link></li>
            </ul>
          </div>

          {/* Marketing */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Marketing
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/social-media-manager-contract" className="text-slate-500 hover:text-black hover:underline">Social Media Contract</Link></li>
              <li><Link href="/templates/seo-specialist-contract" className="text-slate-500 hover:text-black hover:underline">SEO Retainer</Link></li>
              <li><Link href="/templates/copywriting-contract" className="text-slate-500 hover:text-black hover:underline">Copywriting SOW</Link></li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* 7. CTA Footer */}
      <section className="bg-black py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tight">Ready to level up?</h2>
          <p className="text-slate-400 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
             Join the new standard. Create your first agreement and automated invoice in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link 
               href="/create" 
               className="inline-block bg-white text-black font-bold px-10 py-5 rounded-full shadow-xl hover:bg-gray-100 transition-all text-lg hover:-translate-y-1 hover:shadow-white/20"
             >
               Start Free Project
             </Link>
             <Link 
               href="/login" 
               className="inline-block bg-transparent border border-white/20 text-white font-bold px-10 py-5 rounded-full hover:bg-white/10 transition-all text-lg"
             >
               Login to Account
             </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">No credit card required · Free for 3 projects</p>
        </div>
      </section>
      
    </div>
  );
}