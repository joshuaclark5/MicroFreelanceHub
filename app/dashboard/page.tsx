'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, Edit2, Copy, Trash2, CheckSquare, LogOut, Plus, 
  Gem, ArrowUpRight, FileText, ExternalLink, 
  LayoutGrid, Clock, DollarSign, TrendingUp, CheckCircle,
  PenTool, Repeat, Wallet, PieChart, ArrowRight, History
} from 'lucide-react';
import ConnectStripeButton from '../components/ConnectStripeButton'; 
import PricingModal from '../components/PricingModal'; 
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseHistoryModal from '../components/ExpenseHistoryModal';

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

function UpgradeButton({ onClick, mobile }: { onClick: () => void, mobile?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 rounded-full font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-slate-900/20 group ${
        mobile ? 'w-9 h-9 p-0' : 'px-4 py-1.5 text-xs gap-2'
      }`}
    >
      <Gem className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
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
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  // Expense State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  const refreshData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sowData } = await supabase.from('sow_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (sowData) setSows(sowData);

      if (sowData && sowData.length > 0) {
          const projectIds = sowData.map(s => s.id);
          const { data: expenseData } = await supabase.from('expenses').select('amount').in('project_id', projectIds);
          if (expenseData) {
              const total = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);
              setTotalExpenses(total);
          }
      }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUserEmail(user.email || '');
        setUserId(user.id); 

        const { data: profile } = await supabase.from('profiles').select('is_pro, stripe_account_id').eq('id', user.id).single();
        if (profile) {
            setIsPro(profile.is_pro || false);
            setStripeId(profile.stripe_account_id || null);
        }

        await refreshData(); 

      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [supabase, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const { error } = await supabase.from('sow_documents').delete().eq('id', id);
    if (!error) setSows(sows.filter((s) => s.id !== id));
  };

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from('sow_documents').update({ status: 'Paid', last_payment_date: new Date().toISOString() }).eq('id', id);
    if (!error) setSows(sows.map(s => s.id === id ? { ...s, status: 'Paid' } : s));
  };

  const handleDuplicate = async (sow: any) => {
    setProcessing(true);
    if (!isPro && sows.length >= 3) { setProcessing(false); setShowPricingModal(true); return; }
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
      setSelectedIds([]); setSelectionMode(false);
    }
    setProcessing(false);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((sid) => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const totalPaid = sows.filter(s => s.status === 'Paid').reduce((acc, curr) => acc + (curr.price || 0), 0);
  const profit = totalPaid - totalExpenses;
  
  // Calculate Profit Margin for the visual bar
  const totalVolume = totalPaid > 0 ? totalPaid : 1; // Avoid divide by zero
  const expensePercentage = Math.min((totalExpenses / totalVolume) * 100, 100);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-50">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      
      {/* 🟢 TOP NAV */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white w-9 h-9 flex items-center justify-center rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20">M</div>
              <div className="flex flex-col">
                 <h1 className="text-sm font-bold text-slate-900 leading-tight">MicroFreelance</h1>
                 <p className="text-[10px] text-slate-400 font-medium tracking-wide">DASHBOARD</p>
              </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!isPro && <UpgradeButton onClick={() => setShowPricingModal(true)} mobile={false} />}
            {isPro && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">PRO PLAN</span>}
            <div className="h-4 w-px bg-gray-200"></div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        
        {/* 🟢 NEW "COMMAND CENTER" LAYOUT (2 Columns on large screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. THE FINANCIAL HEALTH CARD (Spans 2 Columns) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between relative overflow-hidden group">
                
                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Financial Health</p>
                        <h3 className="text-5xl font-bold text-slate-900 tracking-tighter mt-2">{formatMoney(profit)}</h3>
                        <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Net Profit</p>
                    </div>
                    
                    {/* Visual Breakdown */}
                    <div className="text-right hidden sm:block">
                        <div className="flex flex-col gap-1 items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Revenue</span>
                                <span className="text-lg font-bold text-slate-900">{formatMoney(totalPaid)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Expenses</span>
                                <span className="text-lg font-bold text-red-500">-{formatMoney(totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit Bar Visualization */}
                <div className="mt-8 mb-8 z-10">
                    <div className="h-3 w-full bg-emerald-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-red-400 transition-all duration-1000" style={{ width: `${expensePercentage}%` }}></div>
                        <div className="h-full bg-emerald-500 flex-1"></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        <span className="text-red-400">Costs ({expensePercentage.toFixed(0)}%)</span>
                        <span className="text-emerald-600">Profit Margin</span>
                    </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-3 z-10 mt-auto">
                    <button 
                        onClick={() => setShowExpenseModal(true)}
                        className="flex-1 bg-slate-900 text-white hover:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Log Expense
                    </button>
                    <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 flex items-center gap-2"
                    >
                        <History className="w-4 h-4" /> History
                    </button>
                    {stripeId ? (
                       <a href="https://connect.stripe.com/express_login" target="_blank" className="p-3 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100" title="Stripe Dashboard">
                           <ExternalLink className="w-5 h-5" />
                       </a>
                    ) : (
                       <div className="scale-90"><ConnectStripeButton userId={userId} /></div>
                    )}
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Wallet className="w-64 h-64 -rotate-12 translate-x-20 -translate-y-20" />
                </div>
            </div>

            {/* 2. THE CREATE CARD (Spans 1 Column) */}
            <Link href="/create" className="lg:col-span-1 group relative overflow-hidden bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-between h-full min-h-[280px] hover:scale-[1.02] transition-all duration-300">
                <div className="relative z-10">
                    <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 group-hover:bg-white/30 transition-colors">
                        <PenTool className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">New Project</h3>
                    <p className="text-indigo-100 text-sm mt-2 font-medium leading-relaxed">Draft a new proposal or invoice in seconds.</p>
                </div>
                
                <div className="mt-auto relative z-10 flex items-center gap-2 font-bold text-sm">
                    Start Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            </Link>
        </div>

        {/* 🟢 PROJECTS SECTION */}
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-gray-400" /> Recent Projects
                 </h2>
                 <div className="flex items-center gap-2">
                   {sows.length > 0 && (
                     <button onClick={() => setSelectionMode(!selectionMode)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${selectionMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-gray-200 hover:border-slate-300'}`}>
                        <CheckSquare className="w-3.5 h-3.5" /> {selectionMode ? 'Done' : 'Select'}
                     </button>
                   )}
                 </div>
            </div>

            <div className={sows.length > 0 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "block"}>
              {sows.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-200 shadow-sm">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><FileText className="w-10 h-10" /></div>
                  <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">Your dashboard is empty. Create your first contract to get started.</p>
                </div>
              ) : (
                sows.map((sow) => {
                   const isMonthly = sow.payment_type === 'monthly';
                   const isPaid = sow.status === 'Paid';
                   const sched = sow.payment_schedule_structured || {};
                   
                   let statusConfig = { label: sow.status, color: "bg-gray-100 text-gray-600", icon: Clock };

                   if (isPaid) {
                       statusConfig = { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
                       if (sched.type === 'split') statusConfig.label = "Part Paid";
                       else if (sched.depositAmount) statusConfig.label = "Dep. Paid";
                   } else if (sow.status === 'Signed') {
                       statusConfig = { label: "Signed", color: "bg-blue-100 text-blue-700", icon: PenTool };
                   } else if (isMonthly && isPaid) {
                       statusConfig = { label: "Active", color: "bg-indigo-100 text-indigo-700", icon: Repeat };
                   }

                   return (
                   <div key={sow.id} className={`group bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 relative flex flex-col justify-between min-h-[220px] ${selectedIds.includes(sow.id) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100'}`}>
                     
                     <div className="flex justify-between items-start mb-6">
                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" /> {statusConfig.label}
                        </div>
                        <div className="relative z-20">
                          {selectionMode ? (
                            <input type="checkbox" checked={selectedIds.includes(sow.id)} onChange={() => toggleSelect(sow.id)} className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === sow.id ? null : sow.id); }} className="p-1.5 text-gray-300 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors"><MoreVertical className="w-4 h-4" /></button>
                          )}
                          {openMenuId === sow.id && (
                             <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <button onClick={() => router.push(`/edit/${sow.id}`)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                                <button onClick={() => handleDuplicate(sow)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                                {!isPaid && (<button onClick={() => handleMarkPaid(sow.id)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> Mark Paid</button>)}
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button onClick={() => handleDelete(sow.id)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                             </div>
                          )}
                        </div>
                     </div>

                     <div className="mb-4">
                        <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">{sow.title || 'Untitled Project'}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-50 inline-block px-2 py-1 rounded">{sow.client_name || 'No Client'}</p>
                     </div>

                     <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-slate-900">{formatMoney(sow.price || 0)}</span>
                        <Link href={`/sow/${sow.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                           Open <ArrowUpRight className="w-3 h-3" />
                        </Link>
                     </div>
                   </div>
                )})
              )}
            </div>
            
            {selectionMode && selectedIds.length > 0 && (
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 border border-white/10">
                <span className="font-bold text-sm whitespace-nowrap">{selectedIds.length} selected</span>
                <div className="h-4 w-px bg-slate-700"></div>
                <button onClick={() => {}} className="text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors"><Copy className="w-4 h-4" /> Duplicate</button>
                <button onClick={handleBulkDelete} className="text-red-300 hover:text-red-100 text-xs font-bold flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            )}
        </div>

      </div>
      
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} userId={userId} />
      
      {/* Modals */}
      <AddExpenseModal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)} 
        projects={sows.map(s => ({ id: s.id, title: s.title || 'Untitled', client_name: s.client_name || 'No Client' }))}
        onSuccess={refreshData}
      />
      
      <ExpenseHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onUpdate={refreshData}
      />
    </div>
  );
}