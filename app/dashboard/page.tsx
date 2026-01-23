'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit2, Copy, Trash2, CheckSquare, LogOut, Plus, Gem, ArrowUpRight, Wallet, FileText, ExternalLink } from 'lucide-react';
import ConnectStripeButton from '../components/ConnectStripeButton'; 

// 👇 Helper for "Compact" Currency
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

// 👇 Simple SVG Sparkline Component
const Sparkline = () => (
  <svg className="w-full h-12 text-emerald-500 opacity-20" viewBox="0 0 100 40" preserveAspectRatio="none">
    <path d="M0 40 Q 25 35, 50 20 T 100 5 L 100 40 L 0 40 Z" fill="currentColor" />
    <path d="M0 40 Q 25 35, 50 20 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function UpgradeButton({ userId, mobile }: { userId: string, mobile?: boolean }) {
  const handleUpgrade = () => {
    window.location.href = `https://buy.stripe.com/00wbIVa99ais1Ue5RY48002?client_reference_id=${userId}`;
  };

  return (
    <button 
      onClick={handleUpgrade} 
      className={`bg-black text-white hover:bg-gray-800 border border-gray-700 rounded-full font-bold transition-all flex items-center justify-center shadow-lg group ${
        mobile ? 'w-9 h-9 p-0' : 'px-5 py-2 text-sm gap-2'
      }`}
    >
      <Gem className="w-4 h-4 group-hover:scale-110 transition-transform" />
      {!mobile && <span>Upgrade to Pro</span>}
    </button>
  );
}

export default function Dashboard() {
  const [sows, setSows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [stripeId, setStripeId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  
  // 🆕 STATE FOR UI MODES
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUserEmail(user.email || '');
        setUserId(user.id); 

        // Check for pending template clone
        const pendingTemplateSlug = localStorage.getItem('pending_template');
        if (pendingTemplateSlug) {
          const { data: template } = await supabase.from('sow_documents')
            // @ts-ignore
            .eq('slug', pendingTemplateSlug).single();

          if (template) {
            const { data: newProject, error } = await supabase.from('sow_documents').insert({
                user_id: user.id,
                title: template.title,
                client_name: '[Your Client Name]',
                price: template.price,
                deliverables: template.deliverables,
                status: 'Draft',
                slug: null 
              }).select().single();
            if (!error && newProject) {
              localStorage.removeItem('pending_template');
              router.push(`/sow/${newProject.id}`); 
              return; 
            }
          }
        }

        // Get Projects
        const { data: sowData } = await supabase.from('sow_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (sowData) setSows(sowData);

        // Get Profile (Pro Status & Stripe ID)
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro, stripe_account_id')
          .eq('id', user.id)
          .single();
          
        if (profile) {
            setIsPro(profile.is_pro || false);
            setStripeId(profile.stripe_account_id || null);
        }

      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [supabase, router]);

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await supabase.from('sow_documents').delete().eq('id', id);
    if (!error) setSows(sows.filter((s) => s.id !== id));
  };

  const handleDuplicate = async (sow: any) => {
    setProcessing(true);
    const { data: newDoc, error } = await supabase.from('sow_documents').insert({
          user_id: userId,
          title: `${sow.title} (Copy)`,
          client_name: sow.client_name,
          price: sow.price,
          deliverables: sow.deliverables,
          status: 'Draft',
          slug: null 
        }).select().single();
    if (!error && newDoc) setSows([newDoc, ...sows]);
    setProcessing(false);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} projects?`)) return;
    setProcessing(true);
    const { error } = await supabase.from('sow_documents').delete().in('id', selectedIds);
    if (!error) {
      setSows(sows.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]); 
      setSelectionMode(false);
    }
    setProcessing(false);
  };

  const handleBulkDuplicate = async () => {
    setProcessing(true);
    const { data: originals } = await supabase.from('sow_documents').select('*').in('id', selectedIds);
    if (originals && originals.length > 0) {
      const copies = originals.map(doc => ({
        user_id: userId,
        title: `${doc.title} (Copy)`,
        client_name: doc.client_name,
        price: doc.price,
        deliverables: doc.deliverables,
        status: 'Draft',
        slug: null 
      }));
      const { data: newDocs, error } = await supabase.from('sow_documents').insert(copies).select();
      if (!error && newDocs) {
        setSows([...newDocs, ...sows]);
        setSelectedIds([]);
        setSelectionMode(false);
      }
    }
    setProcessing(false);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((sid) => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sows.length) setSelectedIds([]); 
    else setSelectedIds(sows.map((s) => s.id)); 
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  // 📊 CALCULATIONS
  const pipelineValue = sows.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const averageDeal = sows.length > 0 ? pipelineValue / sows.length : 0;
  const projectedValue = pipelineValue + (averageDeal * 3); 

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative">
      
      {/* 🧼 CLEAN HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-black text-white w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg">M</div>
             <div className="flex flex-col">
                <h1 className="text-sm font-bold text-gray-900 leading-none">MicroFreelance</h1>
                <p className="hidden md:block text-[10px] text-gray-500">{userEmail}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {!isPro ? (
              <>
                <div className="block md:hidden"><UpgradeButton userId={userId} mobile={true} /></div>
                <div className="hidden md:block"><UpgradeButton userId={userId} /></div>
              </>
            ) : (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-200">
                PRO
              </span>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto p-4 space-y-4 mt-4">
        
        {/* ✨ AI BANNER */}
        {isPro && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 rounded-xl shadow-lg text-white flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-0.5">AI Power Unlocked</h3>
              <p className="text-indigo-100 text-xs">AI Drafter & Refiner active.</p>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
               <Gem className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* 🚀 TOP ROW: ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. New Project Block */}
            <Link href="/create" className="group">
                <div className="bg-black hover:bg-gray-900 text-white p-6 rounded-2xl shadow-md transition-all h-full flex flex-col justify-center items-center text-center cursor-pointer border border-gray-800">
                    <div className="bg-white/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">New Project</h3>
                    <p className="text-gray-400 text-xs mt-1">Create a contract & start tracking</p>
                </div>
            </Link>

            {/* 2. Wallet / Payouts Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                           {stripeId ? 'Payouts Active' : 'Wallet'}
                        </p>
                        <div className="flex items-baseline gap-1 mt-1">
                            {/* In a real app, you'd fetch the balance from Stripe API here */}
                            <span className="text-3xl font-bold text-gray-900">
                               {stripeId ? 'Live' : '$0.00'}
                            </span>
                            {stripeId && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">CONNECTED</span>}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-gray-400">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>
                
                {stripeId ? (
                   // If Connected: Show Login Link to Stripe (Emoji Removed)
                   <a href="https://connect.stripe.com/express_login" target="_blank" className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                      View Stripe Balance <ExternalLink className="w-3 h-3" />
                   </a>
                ) : (
                   // If Not Connected: Show Setup Button
                   <ConnectStripeButton userId={userId} />
                )}
            </div>
        </div>

        {/* 📊 BOTTOM ROW: DATA GRAPHS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Pipeline (With Graph) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                 Current Pipeline <ArrowUpRight className="w-3 h-3 text-emerald-500" />
               </p>
               <p className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(pipelineValue)}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
               <Sparkline />
            </div>
          </div>

          {/* Card 2: Annual Projection */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Projected (Year)</p>
               <p className="text-3xl font-bold text-gray-400 mt-1">{formatMoney(projectedValue || 0)}</p>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
               <div className="bg-indigo-500 h-full rounded-full w-[35%]"></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Based on current deal avg.</p>
          </div>

        </div>

        {/* PROJECTS HEADER ROW */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 pt-4">
           <div className="flex items-center gap-2">
             <h2 className="text-lg font-bold text-gray-900">Your Projects</h2>
             <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{sows.length}</span>
           </div>
           
           {/* SELECTION TOGGLE */}
           {sows.length > 0 && (
            selectionMode ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                 <button onClick={() => setSelectionMode(false)} className="text-xs font-bold text-gray-500">Cancel</button>
                 <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={toggleSelectAll}>
                    <input 
                      type="checkbox" 
                      onChange={() => {}} 
                      checked={sows.length > 0 && selectedIds.length === sows.length}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-400 focus:ring-indigo-500 pointer-events-none"
                    />
                    <span className="text-xs text-gray-600 font-bold">All</span>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => setSelectionMode(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Select
              </button>
            )
           )}
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {sows.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-gray-500 font-medium">No projects yet.</p>
              <p className="text-sm text-gray-400 mt-2">Create your first contract above.</p>
            </div>
          ) : (
            sows.map((sow) => (
                <div 
                  key={sow.id} 
                  className={`bg-white p-5 rounded-2xl border shadow-sm transition-all group relative ${
                    selectedIds.includes(sow.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="absolute top-5 right-5 z-10">
                    {selectionMode ? (
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(sow.id)}
                        onChange={() => toggleSelect(sow.id)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setOpenMenuId(openMenuId === sow.id ? null : sow.id);
                          }}
                          className="p-1.5 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === sow.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                             <button onClick={() => router.push(`/edit/${sow.id}`)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Edit2 className="w-4 h-4" /> Edit Project
                             </button>
                             <button onClick={() => handleDuplicate(sow)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Copy className="w-4 h-4" /> Duplicate
                             </button>
                             <div className="h-px bg-gray-100 my-1"></div>
                             <button onClick={() => handleDelete(sow.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Delete
                             </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-1 pr-8">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base md:text-lg group-hover:text-indigo-600 transition-colors">{sow.client_name || 'Untitled Client'}</h3>
                      <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">{sow.title || 'Untitled Project'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-5 mt-3">
                    {/* 👇 UPDATED STATUS COLORS */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      sow.status === 'Signed' ? 'bg-emerald-100 text-emerald-700' : 
                      sow.status === 'Paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sow.status}
                    </span>
                    <p className="text-lg md:text-xl font-bold text-gray-900">{formatMoney(sow.price || 0)}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-50">
                    <Link href={`/sow/${sow.id}`} className="block text-center text-blue-600 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors">
                      View / Share Contract
                    </Link>
                  </div>
                </div>
            ))
          )}
        </div>
        
        {selectionMode && selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 w-[90%] max-w-sm justify-center">
            <span className="font-bold text-sm whitespace-nowrap">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-gray-700"></div>
            <button onClick={handleBulkDuplicate} disabled={processing} className="text-indigo-400 hover:text-white text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
              {processing ? '...' : <><Copy className="w-4 h-4" /> <span className="hidden sm:inline">Duplicate</span></>}
            </button>
            <button onClick={handleBulkDelete} disabled={processing} className="text-red-400 hover:text-white text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}