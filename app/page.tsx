'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 👉 WE ARE STATICALLY IMPORTING ALL IMAGES HERE
import builderImg from './builder.png';
import dashboardImg from './dashboard.png';

import { 
  ArrowRight, 
  BookOpen,
  CheckCircle2, 
  ShieldCheck, 
  Wrench,
  Paintbrush,
  Code2,
  TrendingUp,
  BellRing,
  FileEdit,
  CreditCard,
  FileSignature,
  AlertTriangle,
  Menu,
  X,
  Zap
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
          <div className="hidden md:flex gap-4 items-center">
            <Link href="/articles" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Articles
            </Link>
            <Link href="/templates" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Templates
            </Link>
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login?mode=signin" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="md:hidden rounded-lg border border-slate-200 p-2 text-slate-700"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <Link href="/articles" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Articles
              </Link>
              <Link href="/templates" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Templates
              </Link>
              {user ? (
                <Link href="/dashboard" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                  Dashboard
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link href="/login?mode=signin" className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-bold text-slate-700">
                    Log in
                  </Link>
                  <Link href="/login" className="rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-bold text-white">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="px-6 pt-16 pb-16 md:pt-24 md:pb-24 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center lg:items-start relative z-10">
          
          {/* Left Side: Copy */}
          <div className="space-y-6 text-center lg:text-left lg:pt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm border border-blue-100 mb-2">
               <Zap className="w-4 h-4" /> Built for freelancers & contractors
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Never do <span className="text-blue-600">unpaid work</span> again.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Create a contract, get it signed, and collect the deposit—all in one simple link. <span className="font-bold text-slate-800">No PDFs. No chasing emails. No waiting 30 days.</span>
            </p>

            <div className="flex flex-col items-center lg:items-start gap-4 pt-4">
              <Link href="/create" className="w-full sm:w-auto">
                <div className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 rounded-xl px-8 py-4 font-bold text-lg flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-blue-300">
                  Lock in your first deposit today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </Link>
              
              {/* Objection Handling & Risk Reversal */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 text-sm font-medium text-slate-500 mt-2">
                 <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free for 3 contracts
                 </div>
                 <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
                 </div>
                 <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Client doesn't need an account
                 </div>
              </div>
            </div>

          </div>

          {/* Right Side: The Money Shot */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none mt-8 lg:mt-0 lg:pl-12">
             <div className="absolute -top-5 -left-5 bg-slate-900 text-white text-sm font-bold px-5 py-2 rounded-full z-20 shadow-xl border-2 border-white transform -rotate-2">
                Your client gets one secure link
             </div>
             <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 p-3">
               <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100">
                 <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Secure client link</p>
                     <p className="text-sm font-bold text-slate-900">Kitchen remodel agreement</p>
                   </div>
                   <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                     <ShieldCheck className="w-5 h-5" />
                   </div>
                 </div>

                 <div className="p-6 space-y-5">
                   <div className="rounded-2xl bg-slate-900 text-white p-5">
                     <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Amount due today</p>
                     <div className="flex items-end justify-between gap-4">
                       <div>
                         <p className="text-4xl font-extrabold tracking-tight">$2,500</p>
                         <p className="text-sm text-slate-300 mt-1">50% upfront deposit</p>
                       </div>
                       <CreditCard className="w-8 h-8 text-emerald-300" />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div className="rounded-xl border border-slate-200 p-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project total</p>
                       <p className="text-lg font-extrabold text-slate-900 mt-1">$5,000</p>
                     </div>
                     <div className="rounded-xl border border-slate-200 p-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                       <p className="text-lg font-extrabold text-emerald-600 mt-1">Ready</p>
                     </div>
                   </div>

                   <div className="rounded-2xl border border-slate-200 p-5">
                     <div className="flex items-center justify-between mb-4 gap-3">
                       <p className="font-bold text-slate-900">Agreement checklist</p>
                       <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">Client ready</span>
                     </div>
                     <div className="space-y-3">
                       {['Scope locked', 'E-signature required', 'Stripe deposit link attached'].map((item) => (
                         <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                           <span>{item}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100">
                     Sign & Pay Deposit
                   </button>
                   <p className="text-center text-xs text-slate-400 font-medium">Powered by Stripe. Client does not need an account.</p>
                 </div>
               </div>
             </div>
          </div>

        </div>

        {/* VISUAL FLOW GRAPHIC */}
        <div className="mt-24 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 relative z-20">
           <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-1 bg-gradient-to-r from-slate-200 via-blue-300 to-emerald-300 -z-10 translate-y-2"></div>
           
           <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                 <FileEdit className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">1. Send one link</h3>
              <p className="text-sm text-slate-500 mt-2">Create and send your first contract in under 2 minutes.</p>
           </div>

           <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                 <FileSignature className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">2. Client signs</h3>
              <p className="text-sm text-slate-500 mt-2">They review and securely e-sign from their phone.</p>
           </div>

           <div className="bg-white border-2 border-emerald-400 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50 opacity-50 -z-10"></div>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                 <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">3. You get paid</h3>
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
            One bad client can wipe out weeks of work.
          </h3>
        </div>
      </section>

      {/* 4. THE VISUAL SOLUTION SECTION */}
      <section className="py-24 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">One link handles everything.</h2>
            <p className="text-lg text-slate-600">
              Built for real freelancers, not corporate teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Image Feature 1: The Builder */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-8">
                 <h3 className="text-2xl font-bold text-slate-900 mb-3">1. Build it in seconds</h3>
                 <p className="text-slate-600 leading-relaxed">
                   Itemize your scope, set your tax rates, and clearly define the deliverables. Our builder organizes everything into a clean, professional legal document.
                 </p>
              </div>
              <div className="mt-auto relative rounded-xl overflow-hidden border border-slate-200 shadow-lg h-[350px] bg-white">
                 <Image 
                   src={builderImg} 
                   alt="Contract Builder Screen" 
                   className="w-full h-full object-cover object-top" 
                   quality={100}
                   unoptimized
                 />
              </div>
            </div>

            {/* Image Feature 2: The Dashboard */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-8">
                 <h3 className="text-2xl font-bold text-slate-900 mb-3">2. Track the money</h3>
                 <p className="text-slate-600 leading-relaxed">
                   Treat your freelance gig like a real business. Track your revenue, active projects, and profit margins all from one simple dashboard.
                 </p>
              </div>
              <div className="mt-auto relative rounded-xl overflow-hidden border border-slate-200 shadow-lg h-[350px] bg-white flex items-start">
                 <Image 
                   src={dashboardImg} 
                   alt="Analytics Dashboard Screen" 
                   className="w-full h-full object-cover object-left-top" 
                   quality={100}
                   unoptimized
                 />
              </div>
            </div>

            {/* Feature 3: Automated Collections (Text Row) */}
            <div className="md:col-span-2 bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 mt-4">
              <div className="max-w-xl">
                 <ShieldCheck className="w-12 h-12 text-emerald-400 mb-6" />
                 <h3 className="text-3xl font-bold text-white mb-4">"If it's not signed, you don't start."</h3>
                 <p className="text-slate-300 text-lg leading-relaxed mb-6">
                   Client wants to add "just one more quick thing" mid-project? Edit the live agreement. The system locks the project and forces a re-signature and payment before you do any extra work.
                 </p>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-500/30">
                       <CheckCircle2 className="w-4 h-4" /> Deposit Secured
                    </div>
                    <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg text-sm font-bold border border-blue-500/30">
                       <BellRing className="w-4 h-4" /> Automated Reminders
                    </div>
                 </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                 <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl text-center">
                    <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Powered by</div>
                    <div className="text-2xl font-extrabold text-white flex items-center gap-2 justify-center">
                       <CreditCard className="w-6 h-6 text-indigo-400" /> Stripe
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

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
               {/* Free Tier */}
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                  <div className="text-4xl font-extrabold text-slate-900 mb-6">$0<span className="text-lg text-slate-500 font-medium">/mo</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> First 3 Contracts Free</li>
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> Legally Binding e-Signatures</li>
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> Preview Client Portal</li>
                  </ul>
                  <Link href="/login">
                     <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">Start Free</button>
                  </Link>
               </div>

               {/* Starter Tier */}
               <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <div className="text-4xl font-extrabold text-white mb-6">$9<span className="text-lg text-slate-400 font-medium">/mo</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> 1 Active Client Project</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Live Contract + Deposit Link</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Stripe Payment Collection</li>
                  </ul>
                  <Link href="/login?plan=starter">
                     <button className="w-full py-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50">Get Started</button>
                  </Link>
               </div>

               {/* Pro Tier */}
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
                  <div className="text-4xl font-extrabold text-slate-900 mb-6">$29<span className="text-lg text-slate-500 font-medium">/mo</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> Unlimited Active Projects</li>
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> Automated Dunning Emails</li>
                     <li className="flex items-center gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> Remove Watermarks</li>
                  </ul>
                  <Link href="/login?plan=pro">
                     <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">Go Pro</button>
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
                MicroFreelanceHub was created so that never happens to you. 
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

      {/* ARTICLES / GUIDES */}
      <section className="bg-slate-50 py-20 border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-sm font-bold text-blue-700 mb-4">
                <BookOpen className="h-4 w-4" />
                Freelance business articles
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Learn how to protect the work before you start it.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Daily guides on deposits, payment terms, scope creep, approvals, and client-ready contract workflows.
              </p>
            </div>
            <Link href="/articles" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
              Browse articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Link href="/articles/how-to-ask-for-a-freelance-deposit-before-starting-work" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Freelance Payments</p>
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600">
                How to Ask for a Freelance Deposit Before Starting Work
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                A practical guide to setting upfront payment expectations and sending one contract plus deposit link.
              </p>
            </Link>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Internal linking</p>
              <h3 className="text-xl font-extrabold text-slate-900">Every guide points readers to a useful tool.</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Articles link into templates, profession pages, and the contract builder so search traffic has a clear next step.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">AI search ready</p>
              <h3 className="text-xl font-extrabold text-slate-900">Built for quick answers and topical authority.</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Each article includes focused metadata, a clear answer summary, structured data, and relevant supporting links.
              </p>
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
          <Link href="/templates" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
            Search all templates
            <ArrowRight className="h-4 w-4" />
          </Link>
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
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Don't start your next project without this.</h2>
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
          <p className="mt-8 text-sm text-blue-200">No credit card required · Free for 3 projects</p>
          <p className="mt-4 text-[10px] text-blue-200/50 max-w-xl mx-auto">
             Disclaimer: MicroFreelanceHub is a software platform, not a law firm. The templates and tools provided are for educational and operational purposes and do not constitute formal legal advice.
          </p>
        </div>
      </section>
      
    </div>
  );
}
