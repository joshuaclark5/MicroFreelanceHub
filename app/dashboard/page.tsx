'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, Edit2, Copy, Trash2, CheckSquare, LogOut, Plus, 
  Gem, ArrowUpRight, Wallet, FileText, ExternalLink, 
  LayoutGrid, Repeat, Clock, DollarSign, TrendingUp, CheckCircle
} from 'lucide-react';
import ConnectStripeButton from '../components/ConnectStripeButton'; 
import PricingModal from '../components/PricingModal'; // 👈 IMPORT THE MODAL

// 👇 Helper for "Compact" Currency
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

// 👇 Smoother Sparkline
const Sparkline = () => (
  <svg className="w-full h-12 text-emerald-500 opacity-20" viewBox="0 0 100 40" preserveAspectRatio="none">
    <path d="M0 40 Q 25 35, 50 20 T 100 5 L 100 40 L 0 40 Z" fill="currentColor" />
    <path d="M0 40 Q 25 35, 50 20 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function UpgradeButton({ onClick, mobile }: { onClick: () => void, mobile?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`bg-gradient-to-r from-gray-900 to-black text-white hover:to-gray-800 border border-gray-700 rounded-full font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-xl group ${
        mobile ? 'w-9 h-9 p-0' : 'px-5 py-2 text-sm gap-2'
      }`}
    >
      <Gem className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform" />
      {!mobile && <span>Upgrade</span>}
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
  
  // UI Modes
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // 🆕 MODAL STATE
  const [showPricingModal, setShowPricingModal] = useState(false);

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

        // Get Profile
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

  // 💰 NEW: Manual Mark as Paid
  const handleMarkPaid = async (id: string) => {
    if (!confirm('Mark this project as "Paid" manually? This is for payments received outside of Stripe (Cash, Venmo, Check).')) return;
    
    const { error } = await supabase
      .from('sow_documents')
      .update({ 
          status: 'Paid',
          last_payment_date: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
        // Update local state instantly
        setSows(sows.map(s => s.id === id ? { ...s, status: 'Paid' } : s));
    } else {
        alert('Error updating project.');
    }
  };

  const handleDuplicate = async (sow: any) => {
    setProcessing(true);
    if (!isPro) {
        const currentCount = sows.length;
        if (currentCount >= 3) {
            setProcessing(false);
            setShowPricingModal(true); // 👈 TRIGGER NEW MODAL
            return;
        }
    }

    const { data: newDoc, error } = await supabase.from('sow_documents').insert({
          user_id: userId,
          title: `${sow.title} (Copy)`,
          client_name: sow.client_name,
          price: sow.price,
          deliverables: sow.deliverables,
          status: 'Draft',
          slug: null,
          payment_type: sow.payment_type 
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
    if (!isPro) {
        setProcessing(false);
        setShowPricingModal(true); // 👈 TRIGGER NEW MODAL
        return;
    }
    const { data: originals } = await supabase.from('sow_documents').select('*').in('id', selectedIds);
    if (originals && originals.length > 0) {
      const copies = originals.map(doc => ({
        user_id: userId,
        title: `${doc.title} (Copy)`,
        client_name: doc.client_name,
        price: doc.price,
        deliverables: doc.deliverables,
        status: 'Draft',
        slug: null,
        payment_type: doc.payment_type
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
  // 1. 12-Month Projection (Recurring x 12 + One-time)
  const projectionValue = sows.reduce((acc, curr) => {
      const val = curr.price || 0;
      return acc + (curr.payment_type === 'monthly' ? val * 12 : val);
  }, 0);

  // 2. Total Paid (Actual cash collected)
  const totalPaid = sows
    .filter(s => s.status === 'Paid')
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 relative">
      
      {/* 1. BACKGROUND GRID */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {/* 2. HEADER */}
      <div className="border-b border-gray-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-black text-white w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg shadow-sm">M</div>
             <div className="flex flex-col">
                <h1 className="text-sm font-bold text-gray-900 leading-none">MicroFreelance</h1>
                <p className="hidden md:block text-[10px] text-gray-500 font-mono">{userEmail}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isPro ? (
              <UpgradeButton onClick={() => setShowPricingModal(true)} mobile={false} />
            ) : (
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-yellow-200 text-yellow-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Gem className="w-3.5 h-3.5 text-yellow-600" /> PRO MEMBER
              </div>
            )}
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* BENTO STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Create New Agreement */}
            <Link href="/create" className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800 rounded-2xl p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between min-h-[160px]">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Plus className="w-32 h-32 rotate-12 translate-x-8 -translate-y-8" />
                </div>
                <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                   <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h3 className="text-xl font-bold">New Agreement</h3>
                   <p className="text-slate-400 text-sm mt-1">Create a contract & start tracking</p>
                </div>
            </Link>

            {/* Card 2: Total Paid */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Paid</p>
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                         {stripeId ? formatMoney(totalPaid) : '$0.00'}
                      </h3>
                   </div>
                   <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                   </div>
                </div>
                
                <div className="mt-4">
                  {stripeId ? (
                     <a href="https://connect.stripe.com/express_login" target="_blank" className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center gap-1">
                        View Stripe Dashboard <ExternalLink className="w-3 h-3" />
                     </a>
                  ) : (
                     <div className="scale-90 origin-left -ml-1">
                       <ConnectStripeButton userId={userId} />
                     </div>
                  )}
                </div>
            </div>

            {/* Card 3: 12-Month Projection */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                <div className="flex justify-between items-start z-10 relative">
                   <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">12-Month Projection</p>
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{formatMoney(projectionValue)}</h3>
                   </div>
                   <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                   </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-0 opacity-50">
                    <Sparkline />
                </div>
                <div className="z-10 mt-auto pt-4 flex items-center gap-2">
                   <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {sows.length} Active Deals
                   </span>
                </div>
            </div>
        </div>

        {/* PROJECTS HEADER */}
        <div className="flex items-end justify-between border-b border-gray-200/60 pb-4">
             <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   <LayoutGrid className="w-5 h-5 text-gray-400" /> Recent Projects
                </h2>
             </div>
             
             {/* SELECTION TOOLS */}
             <div className="flex items-center gap-3">
               {sows.length > 0 && (
                 selectionMode ? (
                   <div className="flex items-center gap-3 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm animate-in slide-in-from-right-2 fade-in">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 cursor-pointer" onClick={toggleSelectAll}>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.length === sows.length ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                            {selectedIds.length === sows.length && <CheckSquare className="w-3 h-3 text-white" />}
                         </div>
                         <span className="text-xs font-bold text-gray-600">All</span>
                      </div>
                      <div className="h-4 w-px bg-gray-200"></div>
                      <button onClick={() => setSelectionMode(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2">Cancel</button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setSelectionMode(true)}
                     className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-200 transition-all shadow-sm"
                   >
                     <CheckSquare className="w-3.5 h-3.5" /> Select
                   </button>
                 )
               )}
             </div>
        </div>

        {/* PROJECTS GRID */}
        <div className={sows.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "block"}>
          {sows.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No projects yet</h3>
              <p className="text-gray-500 mt-2">Create your first contract to get started.</p>
            </div>
          ) : (
            sows.map((sow) => {
               const isMonthly = sow.payment_type === 'monthly';
               const isPaid = sow.status === 'Paid';

               return (
               <div 
                 key={sow.id} 
                 className={`group bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md relative flex flex-col justify-between min-h-[220px] ${
                   selectedIds.includes(sow.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/5' : 'border-gray-200/60 hover:border-indigo-500/50'
                 }`}
               >
                 {/* Top Row: Date & Menu */}
                 <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">
                      {new Date(sow.created_at).toLocaleDateString()}
                    </span>
                    
                    <div className="relative z-20">
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
                            className="p-1.5 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          >
                             <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === sow.id && (
                             <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <button onClick={() => router.push(`/edit/${sow.id}`)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2">
                                   <Edit2 className="w-3.5 h-3.5" /> Edit Project
                                </button>
                                <button onClick={() => handleDuplicate(sow)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2">
                                   <Copy className="w-3.5 h-3.5" /> Duplicate
                                </button>
                                
                                {/* 👇 MANUAL PAID BUTTON */}
                                {!isPaid && (
                                    <button onClick={() => handleMarkPaid(sow.id)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                                    </button>
                                )}

                                <div className="h-px bg-gray-100 my-1"></div>
                                <button onClick={() => handleDelete(sow.id)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                   <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Middle: Title & Client */}
                 <div className="mb-6">
                    <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {sow.title || 'Untitled Project'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                       {sow.client_name || 'No Client'}
                    </p>
                 </div>

                 {/* Bottom: Price, Status, Button */}
                 <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                           Value
                           {isMonthly && (
                             <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 ${
                               isPaid ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                             }`}>
                               <Clock className="w-2.5 h-2.5" /> {isPaid ? 'Renews' : 'Monthly'}
                             </span>
                           )}
                       </span>
                       <span className="text-lg font-bold text-slate-900 flex items-center gap-1">
                           {formatMoney(sow.price || 0)}
                           {isMonthly && <span className="text-xs text-gray-400 font-medium">/mo</span>}
                       </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                       {/* 🔄 SMART STATUS PILL */}
                       {isMonthly && isPaid ? (
                           <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                               <Repeat className="w-3 h-3" /> Active Sub
                           </span>
                       ) : (
                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              sow.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              sow.status === 'Signed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-gray-50 text-gray-500 border-gray-100'
                           }`}>
                              {sow.status}
                           </span>
                       )}
                       
                       <Link 
                         href={`/sow/${sow.id}`} 
                         className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                       >
                         Open <ArrowUpRight className="w-3 h-3" />
                       </Link>
                    </div>
                 </div>

               </div>
            )})
          )}
        </div>
        
        {/* Floating Bulk Action Bar */}
        {selectionMode && selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 w-auto border border-white/10">
            <span className="font-bold text-sm whitespace-nowrap">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-gray-700"></div>
            <button onClick={handleBulkDuplicate} disabled={processing} className="text-gray-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 hover:scale-105">
               {processing ? '...' : <><Copy className="w-4 h-4" /> Duplicate</>}
            </button>
            <button onClick={handleBulkDelete} disabled={processing} className="text-red-300 hover:text-red-100 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 hover:scale-105">
               <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}

      </div>
      
      {/* 💥 PRICING MODAL COMPONENT */}
      <PricingModal 
         isOpen={showPricingModal} 
         onClose={() => setShowPricingModal(false)} 
         userId={userId} 
      />

    </div>
  );
}