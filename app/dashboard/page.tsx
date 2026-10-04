'use client';

import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreVertical, Edit2, Copy, Trash2, CheckSquare, LogOut, Plus,
  Gem, ArrowUpRight, FileText, ExternalLink,
  LayoutGrid, Clock, TrendingUp, CheckCircle,
  PenTool, Repeat, Wallet, ArrowRight, History, Search, Filter,
  FileWarning, Link2, Mail, Loader2, Settings, ChevronDown
} from 'lucide-react';
import WorkspaceNav from '../components/WorkspaceNav';
import ConnectStripeButton from '../components/ConnectStripeButton';
import PricingModal from '../components/PricingModal';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseHistoryModal from '../components/ExpenseHistoryModal';
import WelcomeWizard from '../components/WelcomeWizard';
import { agreementBalance } from '../lib/agreementPayment';

const displayBalance = (doc: any) => { try { return agreementBalance(doc); } catch { return null; } };

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
};

// Elegant Sparkline
const Sparkline = ({ color = "text-emerald-500" }) => (
  <svg className={`w-full h-16 ${color} opacity-10 absolute bottom-0 left-0 right-0 pointer-events-none`} viewBox="0 0 100 40" preserveAspectRatio="none">
    <path d="M0 40 Q 25 35, 50 20 T 100 5 L 100 40 L 0 40 Z" fill="currentColor" />
  </svg>
);

// Responsive Upgrade Button
function UpgradeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Upgrade to Pro"
      title="Upgrade to Pro"
      className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 rounded-full font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-slate-900/20 group w-9 h-9 sm:w-auto sm:px-4 sm:py-1.5 sm:gap-2"
    >
      <Gem className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline text-xs">Upgrade to Pro</span>
    </button>
  );
}

export default function Dashboard() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const initialLoadRunning = useRef(false);
  const [sows, setSows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [stripeId, setStripeId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  // Selection & Filtering
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SIGNED' | 'PAID'>('ALL');

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null); // For copy link feedback
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [invoiceSentIds, setInvoiceSentIds] = useState<string[]>([]);
  const [copiedPayLinkId, setCopiedPayLinkId] = useState<string | null>(null); // For payment link copy feedback
  const [paymentLinkLoadingId, setPaymentLinkLoadingId] = useState<string | null>(null);

  const [showPricingModal, setShowPricingModal] = useState(false);

  // Expense State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Welcome Wizard State
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  const refreshData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: sowData, error: sowError } = await supabase.from('sow_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (sowError) throw new Error('Your agreements could not be loaded. Your saved work has not been changed.');
      if (sowData) setSows(sowData);

      if (sowData && sowData.length > 0) {
          const projectIds = sowData.map(s => s.id);
          const { data: expenseData } = await supabase.from('expenses').select('amount').in('project_id', projectIds);
          if (expenseData) {
              const total = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);
              setTotalExpenses(total);
          }
      }

      return sowData || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (initialLoadRunning.current) return;
      initialLoadRunning.current = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login?mode=signin'); return; }
        setUserEmail(user.email || '');
        setUserId(user.id);

        const { data: profile } = await supabase.from('profiles').select('is_pro, stripe_account_id, has_completed_onboarding').eq('id', user.id).single();
        if (profile) {
            setIsPro(profile.is_pro || false);
            setStripeId(profile.stripe_account_id || null);
        }

        // 🧠 RECOVERY LOGIC: Check for "Lost Luggage" (Pending SOW)
        const pendingSOW = localStorage.getItem('pendingSOW');
        if (pendingSOW) {
            console.log("📦 Found pending SOW, saving...");
            const sowData = JSON.parse(pendingSOW);
            const isVersionTwo = sowData.version === 2 && typeof sowData.id === 'string' &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sowData.id) &&
                Number.isFinite(sowData.price) && sowData.price >= 0;

            // Calculate totals for recovery
            let grandTotal = 0;
            if (sowData.line_items && sowData.line_items.length > 0) {
               grandTotal = sowData.line_items.reduce((acc: any, item: any) => acc + (item.quantity * item.amount), 0);
               const taxRate = parseFloat(sowData.tax_rate) || 0;
               if (taxRate > 0) {
                   grandTotal = grandTotal + (grandTotal * (taxRate/100));
               }
            }

            const { error } = await supabase.from('sow_documents').insert({
                ...(isVersionTwo ? {
                    id: sowData.id,
                    client_data: { name: sowData.client_name, email: sowData.client_data?.email || '' },
                    due_date: sowData.due_date || null,
                    dunning_enabled: sowData.dunning_enabled === true,
                } : {}),
                user_id: user.id,
                client_name: sowData.client_name,
                title: sowData.title,
                price: isVersionTwo ? sowData.price : grandTotal > 0 ? grandTotal : 0,
                line_items: sowData.line_items,
                deliverables: sowData.deliverables,
                status: 'Draft',
                payment_type: sowData.payment_type || 'one_time',
                payment_schedule_structured: isVersionTwo ? sowData.payment_schedule_structured : {
                    depositAmount: sowData.deposit_amount || 0,
                    type: sowData.deposit_amount ? 'fixed' : 'none'
                }
            });

            let alreadyRecovered = false;
            if (isVersionTwo && error?.code === '23505') {
                const { data: existing } = await supabase.from('sow_documents').select('id').eq('id', sowData.id).eq('user_id', user.id).maybeSingle();
                alreadyRecovered = Boolean(existing);
            }
            if (!error || alreadyRecovered) {
                console.log("✅ Pending SOW saved successfully!");
                localStorage.removeItem('pendingSOW'); // Clear luggage
            } else {
                console.error("❌ Failed to save pending SOW:", error);
            }
        }

        const sowData = await refreshData();
        if (profile && !profile.has_completed_onboarding && sowData.length === 0) {
          setShowWelcomeWizard(true);
        }

      } catch (err) { setLoadError(err instanceof Error ? err.message : 'Unable to load your workspace.'); } finally { initialLoadRunning.current = false; setLoading(false); }
    };
    fetchData();
  }, [supabase, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const { error } = await supabase.from('sow_documents').delete().eq('id', id);
    if (!error) setSows(sows.filter((s) => s.id !== id));
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
          payment_type: sow.payment_type,
          line_items: sow.line_items,
          payment_schedule_structured: sow.payment_schedule_structured
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

  const handleSelectAll = () => {
      if (selectedIds.length === filteredSows.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredSows.map(s => s.id));
      }
  };

  const copyToClipboard = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const link = `${window.location.origin}/sow/${id}`;
      navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      setOpenMenuId(null);
  };

  const handleSendInvoice = async (e: React.MouseEvent, sow: any) => {
    e.stopPropagation();
    setSendingId(sow.id);

    try {
      // Get client email - try different possible field names
      const clientEmail = sow.client_data?.email || sow.client_email || sow.email;
      if (!clientEmail) {
        alert('Client email not found. Please update the project details.');
        setSendingId(null);
        return;
      }

      const paymentLink = `${window.location.origin}/sow/${sow.id}`;

      // Step 2: Call the Edge Function with the payment link
      const { data: invoiceResult, error: invoiceError } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoice_id: sow.id,
          client_email: clientEmail,
          client_name: sow.client_name || 'Client',
          amount_due: Number(sow.price) > 0 ? agreementBalance(sow).due / 100 : 0,
          project_name: sow.title || 'Project',
          payment_link: paymentLink,
        }
      });

      if (invoiceError) {
        console.error('Invoice email error:', invoiceError);
        alert('Failed to send invoice email. Please try again.');
        setSendingId(null);
        return;
      }

      // Sending a link must not change payment or signature state.
      setInvoiceSentIds([...invoiceSentIds, sow.id]);

      // Optionally show success message
      console.log('✅ Invoice sent successfully to', clientEmail);
    } catch (err) {
      console.error('Send invoice error:', err);
      alert('An error occurred while sending the invoice.');
    } finally {
      setSendingId(null);
    }
  };

  const handleCopyPayLink = async (e: React.MouseEvent, sow: any) => {
    e.stopPropagation();
    setPaymentLinkLoadingId(sow.id);

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/sow/${sow.id}`);
      setCopiedPayLinkId(sow.id);
      setTimeout(() => setCopiedPayLinkId(null), 2000);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error copying payment link:', err);
      alert('Failed to copy payment link. Please try again.');
    } finally {
      setPaymentLinkLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  // --- FILTERING LOGIC ---
  const filteredSows = sows.filter(s => {
      const matchesSearch = (s.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (s.client_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      if (statusFilter === 'ALL') return matchesSearch;
      if (statusFilter === 'SIGNED') return matchesSearch && s.status === 'Signed';
      if (statusFilter === 'PAID') return matchesSearch && s.status === 'Paid';
      if (statusFilter === 'DRAFT') return matchesSearch && (s.status === 'Draft' || !s.status);
      return matchesSearch;
  });

  const totalPaid = sows.filter(s => s.status === 'Paid').reduce((acc, curr) => acc + (curr.price || 0), 0);
  const profit = totalPaid - totalExpenses;
  const totalVolume = totalPaid > 0 ? totalPaid : 1;
  const expensePercentage = Math.min((totalExpenses / totalVolume) * 100, 100);

  const detail = filteredSows.find(s => s.id === detailId) || filteredSows[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-50">Loading Dashboard...</div>;

  return (
    <div className="d4-dashboard d4-app-shell dashboard-workspace min-h-screen bg-[#f6f8f7] pb-24">

      <WorkspaceNav />
      {/* Welcome Wizard Modal */}
      {showWelcomeWizard && <WelcomeWizard onComplete={() => setShowWelcomeWizard(false)} />}

      {/* 🟢 TOP NAV */}
      <div className="d4-workspace-header bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20">M</div>
              <div className="flex flex-col">
                 <h1 className="text-sm font-bold text-slate-900 leading-tight">MicroFreelanceHub</h1>
                 <p className="text-[10px] text-slate-400 font-medium tracking-wide">DASHBOARD</p>
              </div>
          </div>

          <div className="flex items-center gap-3">
            {!isPro && <UpgradeButton onClick={() => setShowPricingModal(true)} />}
            {isPro && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 whitespace-nowrap">PRO</span>}
            <div className="h-4 w-px bg-gray-200"></div>
            <Link href="/settings" className="dashboard-icon-button" aria-label="Settings" title="Settings">
              <Settings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="dashboard-icon-button" aria-label="Log out" title="Log out"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="d4-workspace-main px-4 sm:px-8 py-6 sm:py-8 space-y-6">

        {loadError && <div className="d4-recovery" role="alert">{loadError} <button className="d4-secondary" onClick={() => window.location.reload()}>Retry</button></div>}
        {/* STATS ROW */}
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-gray-200 pb-6">
          <div><h2 className="text-2xl font-semibold text-gray-950">Your agreements</h2><p className="mt-2 text-sm text-gray-600">Scope, client approvals and payment activity.</p></div>
          <Link href="/create" className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={18} /> New agreement</Link>
        </div>
        {sows.length > 0 && <>
        <div className="d4-metrics" aria-label="Agreement overview">
          <div><span>Drafts to finish</span><strong>{sows.filter(s => !s.status || s.status === 'Draft').length}</strong></div>
          <div><span>Signed agreements</span><strong>{sows.filter(s => s.status === 'Signed').length}</strong></div>
          <div><span>Recorded outstanding balance</span><strong>{sows.some(s => s.payment_type !== 'none' && !displayBalance(s)) ? 'Unavailable' : formatMoney(sows.reduce((sum, s) => sum + (s.payment_type === 'none' ? 0 : (displayBalance(s)?.remaining || 0) / 100), 0))}</strong></div>
        </div>
        {!stripeId && sows.some(s => s.payment_type !== 'none') && <div className="d4-stripe-notice">
          <div><h2 className="text-sm font-semibold text-slate-900">{stripeId ? 'Client payments' : 'Ready to collect a deposit?'}</h2><p className="mt-1 text-sm text-slate-600">{stripeId ? 'A Stripe account is linked. Manage eligibility and payout details in Stripe.' : 'Connect your own Stripe account when you want to accept client payments. You can draft first.'}</p></div>
          <div className="w-full sm:w-auto shrink-0">{stripeId ? <a className="d4-secondary" href="https://connect.stripe.com/express_login" target="_blank" rel="noopener noreferrer">Open Stripe <ExternalLink size={15}/></a> : <ConnectStripeButton userId={userId}/>}</div>
        </div>}

        <div className="dashboard-filters flex flex-wrap gap-3 border-b border-gray-200 pb-5" role="group" aria-label="Agreement filters">
          <button type="button" aria-label={`Draft agreements ${sows.filter(sow => String(sow.status).toLowerCase() === 'draft').length}`} aria-pressed={statusFilter === 'DRAFT'} onClick={() => setStatusFilter('DRAFT')} className="text-left text-sm text-gray-600 hover:text-blue-700">Drafts <span className="ml-2 font-semibold text-gray-950">{sows.filter(sow => String(sow.status).toLowerCase() === 'draft').length}</span></button>
          <button type="button" aria-pressed={statusFilter === 'SIGNED'} onClick={() => setStatusFilter('SIGNED')} className="d4-tab">Signed</button>
          <button type="button" aria-label={`Paid records ${sows.filter(sow => String(sow.status).toLowerCase() === 'paid').length}`} aria-pressed={statusFilter === 'PAID'} onClick={() => setStatusFilter('PAID')} className="text-left text-sm text-gray-600 hover:text-blue-700">Paid <span className="ml-2 font-semibold text-gray-950">{sows.filter(sow => String(sow.status).toLowerCase() === 'paid').length}</span></button>
          <button type="button" aria-label={`All agreements ${sows.length}`} aria-pressed={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} className="text-left text-sm text-gray-600 hover:text-blue-700">All <span className="ml-2 font-semibold text-gray-950">{sows.length}</span></button>
        </div>

        </>}
        {/* 🟢 PROJECTS SECTION */}
        {!loadError && <div className="space-y-6">

            {/* SEARCH & FILTER BAR */}
            {sows.length > 0 && (<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                 <div className="flex items-center gap-3">
                    <h2 className="sr-only">
                        <LayoutGrid className="w-5 h-5 text-gray-400" /> Agreement library
                    </h2>
                    {/* Status Tabs */}
                    <div className="hidden" aria-hidden="true">
                        {['ALL', 'DRAFT', 'PAID'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div className="flex items-center gap-2">
                   {/* Search Input */}
                   <div className="relative group">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input
                          type="text"
                          placeholder="Search projects or clients"
                          aria-label="Search agreements or clients"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="min-h-11 pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-40 sm:w-64 transition-all"
                       />
                   </div>

                   {/* Select Toggle */}
                   {sows.length > 0 && (
                     <button aria-pressed={selectionMode} onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }} className={`min-h-11 text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${selectionMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-700 border-gray-300 hover:border-slate-500'}`}>
                        <CheckSquare className="w-3.5 h-3.5" /> {selectionMode ? 'Done' : 'Select'}
                     </button>
                   )}

                   {/* 🆕 SELECT ALL BUTTON */}
                   {selectionMode && (
                        <button onClick={handleSelectAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2">
                            {selectedIds.length === filteredSows.length ? 'Deselect All' : 'Select All'}
                        </button>
                   )}
                 </div>
            </div>)}

            <div className={filteredSows.length ? "d4-workspace-grid" : "d4-empty-workspace"}><div className={filteredSows.length > 0 ? "d4-agreement-list" : "block"}>
              {filteredSows.length > 0 && <div className="d4-tablehead"><span>Project / client</span><span>Status</span><span>Total</span><span>Actions</span></div>}
              {filteredSows.length === 0 ? (
                <div className={searchQuery || statusFilter !== 'ALL' ? "d4-surface py-12" : "d4-first-project"}>
                  <section className="d4-surface">
                    <p className="d4-eyebrow">{searchQuery || statusFilter !== 'ALL' ? 'Search results' : 'Your workspace'}</p>
                    <h3 className="mt-3 text-2xl font-semibold">{searchQuery || statusFilter !== 'ALL' ? 'No matching agreements' : 'Your first agreement starts here.'}</h3>
                    <p className="mt-3 text-sm text-slate-600 leading-6">{searchQuery || statusFilter !== 'ALL' ? 'Try a different project or client name, or clear the filters.' : 'Bring one real project. Start with the work, price and timeline. Review the document before sharing anything.'}</p>
                    {searchQuery || statusFilter !== 'ALL' ? <button className="d4-secondary mt-5" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>Clear filters</button> : <div className="mt-6 flex flex-col items-start gap-3"><Link className="d4-primary" href="/create">Create my first agreement</Link><Link className="d4-secondary" href="/templates">Choose a template</Link></div>}
                  </section>
                  {!searchQuery && statusFilter === 'ALL' && <section className="p-5"><h2 className="text-xl font-semibold">Three clear steps</h2><ol className="d4-first-steps"><li>1. Define the scope</li><li>2. Review and save</li><li>3. Share when ready</li></ol><p className="mt-5 text-sm leading-6 text-slate-600">Stripe setup is optional until you want payment collection. Your payment connection and subscription settings are available in Settings.</p><Link className="inline-block mt-4 text-sm text-blue-700 underline" href="/settings">Settings &amp; payment setup</Link></section>}
                </div>
              ) : (
                filteredSows.map((sow) => {
                   const isMonthly = sow.payment_type === 'monthly';
                   const isPaid = sow.status === 'Paid';
                   const isSigned = sow.status === 'Signed'; // Check if signed but unpaid
                   const sched = sow.payment_schedule_structured || {};

                   let statusConfig = { label: sow.status || 'Draft', color: "bg-gray-100 text-gray-600", icon: Clock };

                   if (isPaid) {
                       statusConfig = { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
                   } else if (isSigned) {
                       statusConfig = { label: "Signed", color: "bg-blue-100 text-blue-700", icon: PenTool };
                   } else if (isMonthly && isPaid) {
                       statusConfig = { label: "Active", color: "bg-indigo-100 text-indigo-700", icon: Repeat };
                   }

                   return (
                   <div
                      key={sow.id}
                      className={`d4-agreement-row group bg-white relative ${selectedIds.includes(sow.id) ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200'}`}
                   >

                     <div className="d4-row-status">
                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" /> {statusConfig.label}
                        </div>
                        {selectionMode && <input type="checkbox" aria-label={`Select ${sow.title || 'agreement'}`} checked={selectedIds.includes(sow.id)} onChange={() => toggleSelect(sow.id)} className="h-5 w-5" />}

                     </div>

                     <div className="d4-row-project">
                        <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">{sow.title || 'Untitled Project'}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-50 inline-block px-2 py-1 rounded">{sow.client_name || 'No Client'}</p>
                     </div>

                     <div className="d4-row-open">
                        <span className="text-lg font-bold text-slate-900">{formatMoney(sow.price || 0)}</span>
                        <Link href={`/sow/${sow.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800" aria-label={`Open ${sow.title || 'agreement'}`}>Open <ArrowUpRight size={16} /></Link>
                     </div>
                     <div className="d4-row-more"><button type="button" className="d4-detail-toggle" aria-pressed={detail?.id === sow.id} onClick={() => setDetailId(sow.id)}>View details</button><details><summary>More actions</summary><div className="d4-row-action-panel">
                     {/* Send Invoice Button - Only show if not paid */}
                     {!isPaid && (
                       <div className="mb-3 mt-3">
                         <button
                           onClick={(e) => handleSendInvoice(e, sow)}
                           disabled={sendingId === sow.id || invoiceSentIds.includes(sow.id)}
                           className={`w-full py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                             invoiceSentIds.includes(sow.id)
                               ? 'bg-emerald-100 text-emerald-700 cursor-default'
                               : sendingId === sow.id
                               ? 'bg-indigo-100 text-indigo-600 cursor-wait'
                               : 'border border-gray-300 bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-600'
                           }`}
                         >
                           {invoiceSentIds.includes(sow.id) ? (
                             <>
                               <CheckCircle className="w-4 h-4" />
                               Link emailed
                             </>
                           ) : sendingId === sow.id ? (
                             <>
                               <Loader2 className="w-4 h-4 animate-spin" />
                               Sending...
                             </>
                           ) : (
                             <>
                               <Mail className="w-4 h-4" />
                               Email client link
                             </>
                           )}
                         </button>
                       </div>
                     )}

                       <Link href={`/edit/${sow.id}`} className="dashboard-secondary-button"><Edit2 size={15} /> {isSigned || isPaid ? 'Change order' : 'Edit draft'}</Link>
                       <button className="dashboard-secondary-button" onClick={e => handleCopyPayLink(e, sow)} disabled={paymentLinkLoadingId === sow.id}><Link2 size={15} /> {copiedPayLinkId === sow.id ? 'Copied' : 'Copy link'}</button>
                     <button disabled={processing} className="dashboard-secondary-button" onClick={(e) => { e.stopPropagation(); handleDuplicate(sow); }}><Copy size={15} /> Duplicate</button>
                       <button disabled={processing} className="dashboard-secondary-button text-red-700" onClick={(e) => { e.stopPropagation(); handleDelete(sow.id); }}><Trash2 size={15} /> Delete</button>
                     </div></details></div>
                   </div>
                )})
              )}
            </div>

            {detail && <aside className="d4-project-detail" aria-label="Selected agreement details">
              <p className="d4-eyebrow">Selected agreement</p>
              <h2 className="mt-3 text-xl font-semibold break-words">{detail.title || 'Untitled project'}</h2>
              <p className="mt-2 text-sm text-slate-600 break-words">{detail.client_name || 'Client not set'}</p>
              <dl className="my-6 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt>Status</dt><dd className="font-semibold">{detail.status || 'Draft'}</dd></div><div className="flex justify-between gap-3"><dt>Agreement total</dt><dd className="font-semibold">{formatMoney(detail.price || 0)}</dd></div><div className="flex justify-between gap-3"><dt>Recorded paid</dt><dd>{displayBalance(detail) ? formatMoney(displayBalance(detail)!.received / 100) : 'Unavailable'}</dd></div><div className="flex justify-between gap-3"><dt>Remaining</dt><dd>{detail.payment_type === 'none' ? 'No online payment' : displayBalance(detail) ? formatMoney(displayBalance(detail)!.remaining / 100) : 'Unavailable'}</dd></div></dl>
              <p className="text-sm leading-6 text-slate-600">{String(detail.status).toLowerCase() === 'draft' ? 'Review the scope and payment terms before sharing your client link.' : 'Open the agreement to review signatures, changes and the current payment details.'}</p>
              <Link className="d4-primary mt-5 w-full" href={`/sow/${detail.id}`}>Open selected agreement</Link>
              <Link className="d4-secondary mt-3 w-full" href={`/edit/${detail.id}`}>Review scope / changes</Link>
              <p className="mt-5 text-xs leading-5 text-slate-600">Agreement totals are not payment receipts. Check the agreement for confirmed payment status.</p>
            </aside>}
            </div>

            {selectionMode && selectedIds.length > 0 && (
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 max-w-[calc(100%-2rem)] bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-6 z-50 border border-white/10">
                <span className="font-bold text-sm whitespace-nowrap">{selectedIds.length} selected</span>
                <div className="h-4 w-px bg-slate-700"></div>
                <button disabled={processing} onClick={handleBulkDelete} className="min-h-11 rounded-md border border-red-300 px-3 text-red-100 hover:bg-red-950 text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            )}
        </div>}

      </div>

{sows.length > 0 && (        <details className="border-b border-gray-200 pb-5">
          <summary className="dashboard-disclosure flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"><span className="flex items-center gap-2"><Wallet size={18} /> Financial overview and Stripe connection</span><ChevronDown size={18} className="shrink-0" /></summary>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. FINANCIAL HEALTH CARD */}
            <div className="lg:col-span-2 bg-white py-4 flex flex-col justify-between relative overflow-hidden group">

                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Financial Health</p>
                        <h3 className="text-3xl font-semibold text-gray-950 mt-2">{formatMoney(profit)}</h3>
                        <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${profit === 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                           <TrendingUp className="w-4 h-4" />
                           {profit === 0 ? "Send an invoice to see this grow!" : "Net Profit"}
                        </p>
                    </div>

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

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 z-10 mt-auto">
                    <button onClick={() => setShowExpenseModal(true)} className="col-span-2 sm:flex-1 bg-slate-900 text-white hover:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Log Expense
                    </button>
                    <button onClick={() => setShowHistoryModal(true)} className="col-span-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 flex items-center justify-center gap-2">
                        <History className="w-4 h-4" /> History
                    </button>
                    <div className="col-span-1">
                        {stripeId ? (
                           <a href="https://connect.stripe.com/express_login" target="_blank" className="w-full h-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 gap-2" title="Stripe">
                               <span className="truncate">Stripe</span> <ExternalLink className="w-3 h-3 flex-shrink-0" />
                           </a>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
                               <div className="scale-90"><ConnectStripeButton userId={userId} /></div>
                           </div>
                        )}
                    </div>
                </div>

                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Wallet className="w-64 h-64 -rotate-12 translate-x-20 -translate-y-20" />
                </div>
            </div>

            {/* 2. THE CREATE CARD */}
            <div className="lg:col-span-1 relative border-l border-gray-200 p-6 text-gray-900 flex flex-col justify-between">
                <div className="relative z-10">
                    <div className="bg-white/20 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 backdrop-blur-md border border-white/20 group-hover:bg-white/30 transition-colors">
                        <PenTool className="w-6 h-6 sm:w-7 sm:h-7 text-blue-700" />
                    </div>
                    <h3 className="text-xl font-semibold">New agreement</h3>
                    <p className="text-gray-600 text-sm mt-2">Start with the scope and review your payment details.</p>
                </div>
                <Link href="/create" className="dashboard-secondary-button mt-6 self-start">Create agreement <Plus size={16} /></Link>
            </div>
        </div>
        </details>)}
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} userId={userId} />

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
