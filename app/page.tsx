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
  FileEdit,
  Link as LinkIcon,
  CreditCard,
  FileSignature,
  AlertTriangle
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      
      {/* 1. NAVBAR */}
      <nav className="border-b border-gray-100/50 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg shadow-md">M</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MicroFreelance</span>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link 
                  href="/login" 
                  className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-5xl mx-auto text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>

        <div className="space-y-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Never do <span className="text-blue-600">unpaid work</span> again.
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
        Create a contract, get it signed, and collect the deposit, all in one simple link.
</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/create" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 rounded-xl px-8 py-4 font-bold text-lg flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-blue-300">
                Create your first contract free
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
          </div>

          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest pt-4">
            Built by a freelancer who got tired of chasing payments.
          </p>
        </div>

        {/* VISUAL FLOW GRAPHIC */}
        <div className="mt-20 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 relative z-20">
           <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-1 bg-gradient-to-r from-slate-200 via-blue-300 to-emerald-300 -z-10 translate-y-2"></div>
           
           <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                 <FileEdit className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">1. Create Contract</h3>
              <p className="text-sm text-slate-500 mt-2">Generate a bulletproof SOW in seconds.</p>
           </div>

           <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                 <FileSignature className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">2. Client Signs</h3>
              <p className="text-sm text-slate-500 mt-2">They review and e-sign from their phone.</p>
           </div>

           <div className="bg-white border-2 border-emerald-400 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50 opacity-50 -z-10"></div>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                 <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">3. You Get Paid</h3>
              <p className="text-sm text-slate-700 mt-2">The deposit hits your Stripe account instantly.</p>
           </div>
        </div>
      </section>

      {/* 3. THE PAIN SECTION */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-10 tracking-tight">
            Still doing work without getting paid?
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-12">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
               <div className="text-red-500 font-bold text-xl mt-1">✕</div>
               <div>
                  <h4 className="font-bold text-slate-900">Scope keeps changing</h4>
                  <p className="text-slate-600 text-sm mt-1">Clients ask for "one more thing" because there are no boundaries set.</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
               <div className="text-red-500 font-bold text-xl mt-1">✕</div>
               <div>
                  <h4 className="font-bold text-slate-900">Awkward follow-ups</h4>
                  <p className="text-slate-600 text-sm mt-1">You are stuck sending desperate texts trying to collect the final check.</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
               <div className="text-red-500 font-bold text-xl mt-1">✕</div>
               <div>
                  <h4 className="font-bold text-slate-900">Delayed payments</h4>
                  <p className="text-slate-600 text-sm mt-1">Invoices get lost in their inbox for weeks while your bills pile up.</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
               <div className="text-red-500 font-bold text-xl mt-1">✕</div>
               <div>
                  <h4 className="font-bold text-slate-900">No leverage</h4>
                  <p className="text-slate-600 text-sm mt-1">Without a signed agreement, you have no legal leg to stand on.</p>
               </div>
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-blue-600">
            That stops here.
          </h3>
        </div>
      </section>

      {/* 4. THE SOLUTION BENTO BOX */}
      <section className="py-24 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">One link handles everything.</h2>
            <p className="text-lg text-slate-600">
              Built for real freelancers, not corporate teams. No complicated software, no chasing invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Automated Handoffs (Large) */}
            <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <BellRing className="w-10 h-10 text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Automated Collections</h3>
              <p className="text-slate-600 mb-6 max-w-md leading-relaxed">
                We handle the awkward stuff. If the client doesn't pay, our system automatically follows up with polite, legally-backed reminders on days 3, 15, and 30 so you don't have to.
              </p>
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 text-sm font-bold rounded-lg border border-blue-200">
                Stop chasing money manually.
              </div>
            </div>

            {/* Feature 2: All-in-one Link (Small) */}
            <div className="md:col-span-1 bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <LinkIcon className="w-10 h-10 text-indigo-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">The Magic Link</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Scope of work, legal terms, e-signatures, and Stripe checkout are all bundled into one secure link.
              </p>
            </div>

            {/* Feature 4: Change Orders (Large) */}
            <div className="md:col-span-3 bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                 <ShieldCheck className="w-12 h-12 text-emerald-400 mb-6" />
                 <h3 className="text-3xl font-bold text-white mb-4">"If it's not signed, you don't start."</h3>
                 <p className="text-slate-300 text-lg leading-relaxed">
                   Client wants to add "just one more quick thing" mid-project? Edit the live agreement. The system locks the project and forces a re-signature and payment before you do any extra work.
                 </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                 <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                       <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                    </div>
                    <div>
                       <div className="text-emerald-400 font-bold">Deposit Secured</div>
                       <div className="text-slate-400 text-sm">Via Stripe Checkout</div>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Simple. Secure. Legit.</h2>
            <p className="text-lg text-slate-600 mb-16">Only pay when you are actually using it.</p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
               {/* Free Tier */}
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                  <div className="text-4xl font-extrabold text-slate-900 mb-6">$0<span className="text-lg text-slate-500 font-medium">/mo</span></div>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600" /> First 3 Contracts Free</li>
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600" /> Legally Binding e-Signatures</li>
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600" /> Stripe Payment Integration</li>
                  </ul>
                  <Link href="/login">
                     <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">Start Free</button>
                  </Link>
               </div>

               {/* Pro Tier */}
               <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                  <div className="text-4xl font-extrabold text-white mb-6">$29<span className="text-lg text-slate-400 font-medium">/mo</span></div>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400" /> Unlimited Contracts</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400" /> Automated Dunning Emails</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400" /> Remove Watermarks</li>
                  </ul>
                  <Link href="/login">
                     <button className="w-full py-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50">Get Started</button>
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* 6. FOUNDER STORY */}
      <section className="bg-white py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8 text-slate-900">
              "I lost $15k on a refund because of a bad contract."
            </h2>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
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
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 border border-slate-200">JC</div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">Joshua Clark</p>
                <p className="text-slate-500">Founder & Tradesman</p>
              </div>
            </div>
        </div>
      </section>

      {/* 7. USE CASES / TEMPLATES (SEO Friendly) */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Works for any freelance job.
          </h2>
          <p className="text-slate-500">Find a specific agreement template for your exact trade.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Trades */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
              <Wrench className="w-5 h-5 text-blue-600" /> Trades
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/plumber-contract-template" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Plumbing Agreement</Link></li>
              <li><Link href="/templates/electrician-contract-template" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Electrician Service Agrmt</Link></li>
              <li><Link href="/templates/hvac-tech-contract-template" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">HVAC Work Order</Link></li>
              <li><Link href="/templates/handyman-contract-template" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Handyman Contract</Link></li>
              <li><Link href="/templates/landscaper-contract-template" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Landscaping Contract</Link></li>
            </ul>
          </div>

          {/* Creative */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
              <Paintbrush className="w-5 h-5 text-blue-600" /> Creative
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/graphic-design-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Graphic Design SOW</Link></li>
              <li><Link href="/templates/video-editor-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Video Editor Agreement</Link></li>
              <li><Link href="/templates/freelance-ux-designer" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">UX/UI Design Scope</Link></li>
            </ul>
          </div>

          {/* Tech */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
              <Code2 className="w-5 h-5 text-blue-600" /> Tech
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/web-development-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Web Developer Contract</Link></li>
              <li><Link href="/templates/mobile-app-developer-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Mobile App SOW</Link></li>
              <li><Link href="/templates/full-stack-engineer-contractor" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Software Engineer Agreement</Link></li>
            </ul>
          </div>

          {/* Marketing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Marketing
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/social-media-manager-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Social Media Contract</Link></li>
              <li><Link href="/templates/seo-specialist-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">SEO Retainer</Link></li>
              <li><Link href="/templates/copywriting-contract" className="text-slate-600 hover:text-blue-600 hover:underline font-medium">Copywriting SOW</Link></li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* 8. CTA Footer */}
      <section className="bg-blue-600 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Stop working for free.</h2>
          <p className="text-blue-100 mb-12 text-xl max-w-2xl mx-auto font-medium">
             Create your first contract and collect a deposit in under 5 minutes.
          </p>
          <div className="flex justify-center">
             <Link 
               href="/create" 
               className="inline-block bg-slate-900 text-white font-bold px-10 py-5 rounded-full shadow-xl hover:bg-black transition-all text-lg hover:-translate-y-1 hover:shadow-2xl"
             >
               Get Started Free
             </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
}