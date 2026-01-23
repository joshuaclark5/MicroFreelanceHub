'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Shield, 
  Zap, 
  CreditCard, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Lock,
  PenTool
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
      
      {/* 1. BACKGROUND GRID (The "Graph Paper" Effect) */}
      <div className="absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 opacity-20 blur-[100px]"></div>

      {/* 2. NAVBAR */}
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

      {/* 3. HERO SECTION */}
      <div className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden z-10">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-8 shadow-sm hover:border-indigo-200 transition-colors cursor-default animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Payments Now Active
          </div>

          {/* Headline - "Professional" instead of "Get Paid" guarantee */}
          <h1 className="text-5xl tracking-tight font-extrabold text-slate-900 sm:text-6xl md:text-7xl mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 fill-mode-backwards">
            Agreements that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">work as hard as you do.</span>
          </h1>
          
          {/* Subheadline - "Professional" instead of "Bulletproof" */}
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-500 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-backwards">
            Stop chasing emails. Generate professional Scopes of Work with AI, sign digitally, and facilitate deposits seamlessly.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-backwards">
            <Link 
              href="/create" 
              className="group px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Draft Free Contract 
              <Zap className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
            </Link>
            <Link 
              href="#features" 
              className="px-8 py-4 border border-slate-200 text-lg font-bold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              How it works
            </Link>
          </div>
          
          {/* Social Proof - No Faces, Just Stars */}
          <div className="mt-10 flex items-center justify-center text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-backwards">
             <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                <div className="flex text-yellow-400">
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="font-semibold text-slate-700">Used by modern freelancers</span>
             </div>
          </div>

          {/* 🖥️ HERO VISUAL */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500 fill-mode-backwards">
             {/* Glow Effect */}
             <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
             
             {/* The "App Window" */}
             <div className="relative bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
                {/* Window Header */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                   <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                   </div>
                   <div className="mx-auto text-xs font-mono text-gray-400 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm">
                      microfreelancehub.com/sow/payment-success
                   </div>
                </div>

                {/* Window Body (Success State) */}
                <div className="p-8 md:p-16 bg-white flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-in zoom-in duration-500 delay-700 fill-mode-backwards">
                       <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Payment Received</h2>
                    <p className="text-slate-500 mb-8">The deposit of <strong className="text-slate-900">$1,500.00</strong> has been secured.</p>
                    
                    {/* The "Contract" Card */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 w-full max-w-sm flex items-center gap-4 text-left shadow-sm animate-in slide-in-from-bottom-2 duration-500 delay-1000 fill-mode-backwards">
                       <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="font-bold text-sm text-slate-900">Website Redesign SOW</p>
                          <p className="text-xs text-slate-500">Signed by Client • Jan 22, 2026</p>
                       </div>
                       <div className="ml-auto text-emerald-600 font-bold text-sm bg-emerald-100 px-2 py-1 rounded-md">PAID</div>
                    </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* 4. BENTO GRID FEATURES */}
      <section id="features" className="py-24 bg-gray-50/50 relative z-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">A complete operating system for one-person businesses.</h2>
            <p className="text-slate-500">Replace 3 different tools with one smart link.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: AI (Span 2) - "Comprehensive" instead of "Legally Sound" */}
            <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-48 h-48 text-indigo-600 rotate-12 translate-x-12 -translate-y-12" />
               </div>
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                     <PenTool className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900">AI Contract Drafter</h3>
                  <p className="text-slate-500 leading-relaxed max-w-md">
                    Don't start from a blank page. Describe your project ("I'm building a Shopify store for a client") and our AI generates a comprehensive Scope of Work, Deliverables list, and Standard Terms in seconds.
                  </p>
               </div>
            </div>

            {/* Box 2: Payments - "Facilitate" instead of "Get Paid" */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                     <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Stripe Integration</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Connect your bank account once. Clients can pay directly on the agreement page via Credit Card to initiate the project.
                  </p>
               </div>
            </div>

            {/* Box 3: Legal - "Standard Terms" instead of "Legal Shield" */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                     <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Standard Terms</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Includes templates for Terms & Conditions, Limitations, and Deposits to help clarify expectations and scope.
                  </p>
               </div>
            </div>

            {/* Box 4: E-Sign (Span 2) - "Secure" instead of "Legally Binding" */}
            <div className="md:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-white flex flex-col justify-center">
               <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                  <div className="flex-1">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Secure Digital Signatures</h3>
                      <p className="text-slate-400 leading-relaxed">
                        Capture digital signatures from both parties. The document updates status automatically once signed. No PDF editing required.
                      </p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 w-full max-w-xs">
                      <div className="text-xs text-slate-400 uppercase font-bold mb-2">Signature Status</div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4" /> Signed by Client
                      </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SEO CATEGORIES */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Templates</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Find an Agreement for Your Niche
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Creative */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">🎨 Creative</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/graphic-design-contract" className="text-slate-500 hover:text-black">Graphic Designer Contract</Link></li>
              <li><Link href="/templates/video-editor-contract" className="text-slate-500 hover:text-black">Video Editor Agreement</Link></li>
              <li><Link href="/hire/freelance-ux-designer" className="text-slate-500 hover:text-black">UX/UI Design SOW</Link></li>
            </ul>
          </div>
          {/* Tech */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">💻 Tech</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/web-development-contract" className="text-slate-500 hover:text-black">Web Developer Contract</Link></li>
              <li><Link href="/templates/mobile-app-developer-contract" className="text-slate-500 hover:text-black">Mobile App SOW</Link></li>
              <li><Link href="/hire/full-stack-engineer-contractor" className="text-slate-500 hover:text-black">Software Engineer Agreement</Link></li>
            </ul>
          </div>
          {/* Marketing */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">📈 Marketing</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/templates/social-media-manager-contract" className="text-slate-500 hover:text-black">Social Media Contract</Link></li>
              <li><Link href="/templates/seo-specialist-contract" className="text-slate-500 hover:text-black">SEO Retainer Agreement</Link></li>
              <li><Link href="/templates/copywriting-contract" className="text-slate-500 hover:text-black">Copywriting SOW</Link></li>
            </ul>
          </div>
          {/* Trades */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-600 transition-colors group">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg group-hover:text-indigo-600 transition-colors">🔨 Trades</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/hire/hire-plumber" className="text-slate-500 hover:text-black">Plumbing Contract</Link></li>
              <li><Link href="/hire/hire-electrician" className="text-slate-500 hover:text-black">Electrician Work Order</Link></li>
              <li><Link href="/hire/hire-landscaper" className="text-slate-500 hover:text-black">Landscaping Agreement</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6. CTA Footer */}
      <div className="bg-black py-24 relative overflow-hidden">
         {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tight">Ready to level up?</h2>
          <p className="text-slate-400 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
             Join the new standard of freelancing. Create your first agreement in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link 
               href="/create" 
               className="inline-block bg-white text-black font-bold px-10 py-5 rounded-full shadow-xl hover:bg-gray-100 transition-all text-lg hover:-translate-y-1 hover:shadow-white/20"
             >
               Start Your First Contract
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
      </div>

      {/* FOOTER LINKS */}
      <footer className="bg-black text-slate-500 py-12 text-center text-sm border-t border-slate-800">
        <p className="font-medium mb-4">&copy; {new Date().getFullYear()} MicroFreelance. All rights reserved.</p>
        <div className="flex justify-center gap-8">
          <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
        </div>
      </footer>

    </div>
  );
}