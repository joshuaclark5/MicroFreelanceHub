'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateQuestions, generateFinalSOW, refineSOW } from '../actions/generateSOW';
import Link from 'next/link';
import { 
  ArrowLeft, Sparkles, PenTool, Trash2, Repeat, CreditCard, Wand2, 
  AlertCircle, Plus, X, Undo2, CalendarClock, Split, Loader2, DollarSign,
  CalendarDays, Briefcase, FileSignature, Lock 
} from 'lucide-react';
import PricingModal from '../components/PricingModal';
import { AuthRequiredModal } from '../components/modals/AuthRequiredModal';

// 🛡️ THE LEGAL SHIELD
const LEGAL_TERMS = `
--------------------------------------------------
TERMS & CONDITIONS

1. PAYMENT TERMS
Unless otherwise agreed, a 50% deposit is required to begin work, with the remaining balance due upon final delivery. 

2. OWNERSHIP & RIGHTS
Upon full payment, the Client is granted exclusive rights to the final deliverables. The Freelancer retains the right to use the work for portfolio and self-promotional purposes.

3. CANCELLATION & LIABILITY
If the Client cancels the project after work has begun, the Freelancer retains the deposit. The Freelancer's liability is limited to the total value of this contract.
--------------------------------------------------`;

// Interface for Line Items
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  amount: number;
}

function CreateProjectContent() {
  const [formData, setFormData] = useState({
    clientName: '',
    projectTitle: '',
    taxRate: '', 
    deliverables: '', 
    description: ''
  });

  // 🆕 Line Items State (The Invoice Builder)
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, amount: '' });
  const [manualPriceOverride, setManualPriceOverride] = useState(''); // For when list is empty

  // Financial Settings
  const [includeFee, setIncludeFee] = useState(true);
  
  // Deposit & Terms State
  const [depositType, setDepositType] = useState<'none' | '50' | 'fixed'>('none');
  const [fixedDepositAmount, setFixedDepositAmount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'immediate' | 'completion' | 'net15' | 'net30' | 'net60'>('immediate');

  // Split Payment State
  const [isSplit, setIsSplit] = useState(false);
  const [splitCount, setSplitCount] = useState('2');
  const [splitFrequency, setSplitFrequency] = useState('30'); // Days

  // UI States
  const [undoText, setUndoText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [step, setStep] = useState<'select_mode' | 'ai_input' | 'questions' | 'final'>('select_mode');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  
  // 🆕 PAYMENT TYPE (Now includes 'none')
  const [paymentType, setPaymentType] = useState<'one_time' | 'monthly' | 'none'>('one_time');

  // AI Refiner State
  const [showAiRefiner, setShowAiRefiner] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  
  // 🔒 LIMIT LOGIC
  const [isPro, setIsPro] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userId, setUserId] = useState('');

  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- 🧮 CALCULATORS ---
  const calculateFinancials = () => {
    // 1. Line Items Subtotal
    let subtotal = 0;
    
    if (lineItems.length > 0) {
        subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.amount), 0);
    } else {
        subtotal = parseFloat(manualPriceOverride) || 0;
    }

    // 2. Tax & Fee
    const taxRate = parseFloat(formData.taxRate) || 0;
    const feeAmount = includeFee ? subtotal * 0.039 : 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount + feeAmount;

    // 3. Deposit Calculation
    let depositAmount = 0;
    if (depositType === '50') {
        depositAmount = grandTotal / 2;
    } else if (depositType === 'fixed') {
        depositAmount = parseFloat(fixedDepositAmount) || 0;
        if (depositAmount > grandTotal) depositAmount = grandTotal; 
    } else {
        depositAmount = grandTotal; 
    }

    // 4. Split Calculation
    const splits = parseInt(splitCount) || 1;
    const splitAmount = grandTotal / splits;

    return { subtotal, taxAmount, feeAmount, grandTotal, depositAmount, splitAmount };
  };

  const financials = calculateFinancials();

  // --- DYNAMIC CONTENT GENERATORS ---
  const getPaymentTermsText = () => {
    // 🆕 Agreement Only Clause
    if (paymentType === 'none') {
        return `1. PAYMENT TERMS\nThis agreement outlines the scope of work and legal terms. Payment handling is separate from this document and shall be arranged directly between Client and Contractor.`;
    }

    const { depositAmount, grandTotal, splitAmount } = financials;
    const formattedDeposit = depositAmount.toFixed(2);
    const formattedTotal = grandTotal.toFixed(2);
    const remaining = (grandTotal - depositAmount).toFixed(2);

    let termsLabel = "Due upon receipt";
    if (paymentTerms === 'completion') termsLabel = "Due upon completion of services";
    if (paymentTerms === 'net15') termsLabel = "Net 15 (due 15 days after completion)";
    if (paymentTerms === 'net30') termsLabel = "Net 30 (due 30 days after completion)";
    if (paymentTerms === 'net60') termsLabel = "Net 60 (due 60 days after completion)";

    if (paymentType === 'monthly') {
        return `1. PAYMENT TERMS\nServices will be billed monthly at a rate of $${formattedTotal}. Payment is due upon receipt of invoice on a recurring basis.`;
    }
    if (isSplit) {
        return `1. PAYMENT TERMS\nThe Total Contract Value of $${formattedTotal} shall be paid in ${splitCount} installments of $${splitAmount.toFixed(2)}. The first installment is due immediately. Subsequent payments are due every ${splitFrequency} days.`;
    }
    if (depositType !== 'none') {
        return `1. PAYMENT TERMS\nA deposit of $${formattedDeposit} is required to begin work. The remaining balance ($${remaining}) is ${termsLabel}.`;
    }
    return `1. PAYMENT TERMS\nFull payment of $${formattedTotal} is required. Terms: ${termsLabel}.`;
  };

  // Helper to clean up lists
  const formatDeliverablesList = (raw: any) => {
      if (!raw) return "• Scope details...";
      
      // 1. If it's already a clean array
      if (Array.isArray(raw)) {
          return raw.map(item => `• ${item}`).join('\n');
      }

      // 2. If it's a string, check if it's "Ugly JSON" (starts with { or [)
      if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.endsWith('}')) {
              try {
                  // Remove curly braces and quotes to make it readable
                  const clean = trimmed
                      .replace(/^\{|^\[|^\}|\]$/g, '') // Remove brackets
                      .split(',') // Split by comma
                      .map((s: string) => `• ${s.trim().replace(/^"|"$/g, '')}`) // Remove quotes
                      .join('\n');
                  return clean;
              } catch (e) {
                  return raw; // Fallback
              }
          }
          return raw; // It's just a normal string
      }
      
      return "• Scope details...";
  };

  const generateFullContract = (title: string, scopeBullets: string) => {
    const terms = getPaymentTermsText();
    return `1. PROJECT BACKGROUND
This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services.

2. SCOPE OF SERVICES
The Contractor shall provide the following specific deliverables:

${scopeBullets}

3. TIMELINE
Work will commence upon receipt of the initial payment/deposit.

--------------------------------------------------
TERMS & CONDITIONS

${terms}

2. OWNERSHIP & RIGHTS
Upon full payment, the Client is granted exclusive rights to the final deliverables. The Freelancer retains the right to use the work for portfolio and self-promotional purposes.

3. CANCELLATION & LIABILITY
If the Client cancels the project after work has begun, the Freelancer retains the deposit. The Freelancer's liability is limited to the total value of this contract.
--------------------------------------------------`;
  };

  // 1. Load User & Template
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const [profileRes, countRes] = await Promise.all([
            supabase.from('profiles').select('is_pro').eq('id', user.id).single(),
            supabase.from('sow_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);
        setIsPro(profileRes.data?.is_pro || false);
        setProjectCount(countRes.count || 0);
      }

      // Load Template
      const urlSlug = searchParams.get('template');
      const localSlug = localStorage.getItem('pending_template');
      const slug = urlSlug || localSlug;

      if (slug) {
        setLoading(true);
        setLoadingMessage('Loading Template...');
        const manualOverrides: Record<string, string> = {
            'hire-graphic-designer': 'freelance-logo-designer',
            'hire-video-editor': 'freelance-videographer',
            'hire-photographer': 'hire-event-photographer',
            'hire-web-developer': 'hire-wordpress-developer',
        };
        const searchSlug = manualOverrides[slug] || slug;
        let { data: sowDoc } = await supabase.from('sow_documents').select('*').eq('slug', searchSlug).single();
        let foundData = null;

        if (sowDoc) foundData = { title: sowDoc.title, price: sowDoc.price, deliverables: sowDoc.deliverables };
        else {
            let { data: seoDoc } = await supabase.from('seo_pages').select('*').eq('slug', searchSlug).single();
            if (seoDoc) foundData = { title: seoDoc.job_title || seoDoc.keyword, price: 0, deliverables: seoDoc.deliverables };
        }

        if (foundData) {
              // ✅ FIX: Use formatter here to prevent JSON string
              const bullets = formatDeliverablesList(foundData.deliverables);
              const fullContent = generateFullContract(foundData.title, bullets);
              setFormData(prev => ({ ...prev, projectTitle: foundData.title, deliverables: fullContent, description: `Contract for ${foundData.title}` }));
              
              if(foundData.price) setManualPriceOverride(foundData.price.toString());
              
              setIsTemplateLoaded(true);
              setStep('final'); 
        }
        if (localSlug) localStorage.removeItem('pending_template');
        setLoading(false);
      }
    };
    init();
  }, [supabase, searchParams]);

  // Update contract text dynamically
  useEffect(() => {
    if (step === 'final' && formData.deliverables) {
        const fullText = formData.deliverables;
        const termsStartMarker = "1. PAYMENT TERMS";
        const termsEndMarker = "2. OWNERSHIP & RIGHTS";
        const startIndex = fullText.indexOf(termsStartMarker);
        const endIndex = fullText.indexOf(termsEndMarker);

        if (startIndex !== -1 && endIndex !== -1) {
            const beforeTerms = fullText.substring(0, startIndex);
            const afterTerms = fullText.substring(endIndex);
            const newTerms = getPaymentTermsText();
            const currentTermsSection = fullText.substring(startIndex, endIndex);
            if (!currentTermsSection.includes(newTerms.split('\n')[1])) { 
                  setFormData(prev => ({ ...prev, deliverables: beforeTerms + newTerms + "\n\n" + afterTerms }));
            }
        }
    }
  }, [depositType, fixedDepositAmount, paymentType, paymentTerms, includeFee, formData.taxRate, lineItems, isSplit, splitCount, splitFrequency, manualPriceOverride]);

  const handleStartManual = () => {
      const content = generateFullContract("Project", "• Deliverable 1\n• Deliverable 2");
      setFormData(prev => ({ ...prev, deliverables: content }));
      setStep('final');
  };

  const handleClearContent = () => {
    if (confirmClear) {
        setFormData(prev => ({ ...prev, deliverables: '' }));
        setUndoText('');
        setConfirmClear(false);
    } else {
        setConfirmClear(true);
        setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleUndo = () => {
    if (undoText) {
      setFormData(prev => ({ ...prev, deliverables: undoText }));
      setUndoText(''); 
    }
  };

  const handleRefine = async () => {
    if (!refineText) return;
    setIsRefining(true);
    setUndoText(formData.deliverables);
    const fullText = formData.deliverables;
    const scopeStartMarker = "2. SCOPE OF SERVICES";
    const nextSectionMarker = "3. "; 
    const startIndex = fullText.indexOf(scopeStartMarker);
    const endIndex = fullText.indexOf(nextSectionMarker, startIndex + scopeStartMarker.length);

    if (startIndex === -1 || endIndex === -1) {
        const result = await refineSOW(fullText, financials.subtotal, refineText);
        if (result) setFormData(prev => ({ ...prev, deliverables: result.deliverables }));
    } else {
        const headerPart = fullText.substring(0, startIndex);
        const scopePart = fullText.substring(startIndex, endIndex);
        const footerPart = fullText.substring(endIndex);
        const safeInstruction = `${refineText} (INSTRUCTION: Rewrite this scope section professionally. Keep the header '2. SCOPE OF SERVICES'.)`;
        const result = await refineSOW(scopePart, financials.subtotal, safeInstruction);
        if (result) {
            setFormData(prev => ({ ...prev, deliverables: headerPart + result.deliverables + "\n\n" + footerPart }));
        }
    }
    setRefineText(""); 
    setIsRefining(false);
    setShowAiRefiner(false); 
  };

  const handleAnalyze = async () => {
    if (!formData.clientName) return alert("Please enter the Client Name.");
    if (!formData.description) return alert("Please describe the project.");
    if (!isPro) { setShowPricingModal(true); return; }
    setLoading(true);
    setLoadingMessage('Analyzing Project...'); 
    const qs = await generateQuestions(formData.description);
    if (qs && qs.length > 0) { setQuestions(qs); setStep('questions'); } 
    else { alert("System busy. Please try refreshing."); }
    setLoading(false);
  };

  const handleFinalize = async () => {
    setLoading(true);
    setLoadingMessage('Drafting your contract...');
    const qaPairs = questions.map((q, i) => ({ q, a: answers[i] }));
    const result = await generateFinalSOW(formData.clientName, formData.description, qaPairs);
    if (result) {
      setUndoText(formData.deliverables);
      const fullContent = generateFullContract(result.title, result.deliverables);
      setFormData(prev => ({ ...prev, projectTitle: result.title, deliverables: fullContent }));
      setManualPriceOverride(result.price?.toString() || '');
      setStep('final');
    } else { alert("AI failed. Please try again."); }
    setLoading(false);
  };

  // 🆕 Invoice Builder Handlers
  const handleAddItem = () => {
    if (!newItem.description || !newItem.amount) return;
    setLineItems([...lineItems, { 
        id: Math.random().toString(36).substr(2, 9),
        description: newItem.description, 
        quantity: newItem.quantity, 
        amount: parseFloat(newItem.amount) 
    }]);
    setNewItem({ description: '', quantity: 1, amount: '' });
  };

  const handleRemoveItem = (id: string) => {
    const updated = lineItems.filter(item => item.id !== id);
    setLineItems(updated);
    if (updated.length === 0 && manualPriceOverride === '') setManualPriceOverride(''); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare Line Items (If empty, create a dummy item for the total)
    let finalLineItems = [...lineItems];
    if (finalLineItems.length === 0 && financials.subtotal > 0 && paymentType !== 'none') {
        finalLineItems.push({
            id: 'auto-generated',
            description: 'Project Service Fee',
            quantity: 1,
            amount: financials.subtotal
        });
    }

    if (includeFee && paymentType !== 'none') {
        finalLineItems.push({
            id: 'fee-auto',
            description: `Payment Processing Fee (3.9%)`, 
            quantity: 1,
            amount: financials.feeAmount
        });
    }

    if (!user) {
      setLoading(false); 
      localStorage.setItem('pendingSOW', JSON.stringify({
        client_name: formData.clientName,
        title: formData.projectTitle,
        line_items: finalLineItems, 
        tax_rate: formData.taxRate,
        deliverables: formData.deliverables,
        status: 'Draft',
        payment_type: paymentType,
        deposit_amount: financials.depositAmount
      }));
      setShowAuthModal(true);
      return;
    }

    setLoadingMessage('Saving...');
    if (!isPro && projectCount >= 3) { setLoading(false); setShowPricingModal(true); return; }

    const { error } = await supabase.from('sow_documents').insert({
      user_id: user.id,
      client_name: formData.clientName,
      title: formData.projectTitle,
      price: paymentType === 'none' ? 0 : financials.grandTotal, // Zero price if agreement only
      line_items: finalLineItems, 
      deliverables: formData.deliverables,
      status: 'Draft',
      payment_type: paymentType,
      payment_schedule_structured: { 
          type: isSplit ? 'split' : depositType,
          depositAmount: isSplit ? financials.splitAmount : financials.depositAmount,
          remainingAmount: financials.grandTotal - (isSplit ? financials.splitAmount : financials.depositAmount),
          paymentTerms: paymentTerms,
          splitCount: isSplit ? splitCount : null,
          splitFrequency: isSplit ? splitFrequency : null
      }
    });

    if (!error) router.push('/dashboard');
    else alert("Error saving: " + error.message);
    setLoading(false);
  };

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold text-gray-900">
            {step === 'select_mode' && 'New Agreement'}
            {step === 'ai_input' && 'AI Assistant'}
            {step === 'questions' && 'AI Interview'}
            {step === 'final' && 'Contract Editor'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
            {!isPro && projectCount >= 3 && <span className="hidden md:flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 cursor-pointer" onClick={() => setShowPricingModal(true)}><AlertCircle className="w-3 h-3" /> Free Limit Reached</span>}
            <div className="bg-black text-white w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg shadow-sm">M</div>
            <span className="text-sm font-bold text-gray-900 hidden sm:block">MicroFreelance</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AuthRequiredModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      {renderHeader()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* STEP 0: MODE SELECTION */}
          {step === 'select_mode' && (
             <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Create a new agreement</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <button onClick={() => setStep('ai_input')} className="group relative p-8 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left flex flex-col h-full">
                        <div className="mb-6 bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm"><Sparkles className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Use AI Assistant</h3>
                        <p className="text-gray-500 leading-relaxed">Describe your project in plain English. Our AI will interview you and draft a professional SOW automatically.</p>
                    </button>
                    <button onClick={handleStartManual} className="group relative p-8 rounded-2xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50/50 transition-all text-left flex flex-col h-full">
                        <div className="mb-6 bg-gray-100 w-14 h-14 rounded-2xl flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform shadow-sm"><PenTool className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Start from Scratch</h3>
                        <p className="text-gray-500 leading-relaxed">Jump straight into the editor with a blank standard template.</p>
                    </button>
                </div>
             </div>
          )}

          {/* STEP 1 & 2 (AI PATH) */}
          {(step === 'ai_input' || step === 'questions') && (
            <div className="p-8 md:p-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4">
              <button onClick={() => setStep('select_mode')} className="text-sm text-gray-400 hover:text-black mb-6 flex items-center gap-2 font-medium"><ArrowLeft className="w-4 h-4" /> Back to options</button>
              {step === 'ai_input' ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Tell us about the project</h2>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Client Name</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Project Description</label><textarea className="w-full px-4 py-3 rounded-xl border border-gray-300" rows={6} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
                        <button onClick={handleAnalyze} disabled={loading} className={`w-full py-4 rounded-xl font-bold text-white transition-all text-lg flex items-center justify-center gap-2 ${isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-black'}`}>
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Project...</> : isPro ? <><Sparkles className="w-5 h-5"/> Start AI Interview</> : 'Unlock AI Assistant ($29/mo)'}
                        </button>
                    </div>
                  </>
              ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Interview</h2>
                    <div className="space-y-8">
                        {questions.map((q, index) => (
                        <div key={index}><label className="block text-base font-bold text-gray-800 mb-3">{q}</label><input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl" value={answers[index]} onChange={(e) => { const newAnswers = [...answers]; newAnswers[index] = e.target.value; setAnswers(newAnswers); }} /></div>
                        ))}
                    </div>
                    <button onClick={handleFinalize} disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all mt-10 text-lg flex items-center justify-center gap-2">
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Drafting Contract...</> : 'Generate Official Agreement'}
                    </button>
                  </>
              )}
            </div>
          )}

          {/* STEP 3 (FINAL): EDITOR */}
          {step === 'final' && (
            <div className="flex flex-col lg:flex-row h-full animate-in fade-in zoom-in duration-300">
              
              {/* MAIN EDITOR COLUMN */}
              <div className="flex-1 p-8 md:p-10 border-r border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
                  <div>
                    <input type="text" required className="w-full px-0 py-2 text-3xl font-bold text-gray-900 border-none focus:ring-0 placeholder-gray-300" value={formData.projectTitle} onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })} placeholder="Untitled Agreement" />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-4">
                      {isTemplateLoaded && <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>Template Loaded</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => isPro ? setShowAiRefiner(!showAiRefiner) : setShowPricingModal(true)} className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${isPro ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}><Wand2 className="w-4 h-4" /> {isPro ? (showAiRefiner ? 'Close AI' : 'Use AI Assistant') : 'Unlock AI'}</button>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <button type="button" onClick={handleUndo} disabled={!undoText} className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!undoText ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}><Undo2 className="w-4 h-4" /> Undo</button>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <button type="button" onClick={handleClearContent} className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${confirmClear ? 'bg-red-50 text-red-600 border border-red-200' : 'text-gray-500 hover:text-red-600 hover:bg-gray-50'}`}>{confirmClear ? <><AlertCircle className="w-4 h-4" /> Are you sure?</> : <><Trash2 className="w-4 h-4" /> Clear</>}</button>
                    </div>
                  </div>

                  {showAiRefiner && (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2 flex gap-3 items-center">
                        <input type="text" value={refineText} onChange={(e) => setRefineText(e.target.value)} placeholder="e.g. 'Add a $500 rush fee to the pricing section'" className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleRefine()} />
                        <button type="button" onClick={handleRefine} disabled={isRefining || !refineText} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
                          {isRefining ? <><Loader2 className="w-4 h-4 animate-spin" /> Refining...</> : <><Sparkles className="w-4 h-4" /> Update</>}
                        </button>
                      </div>
                    )}

                  <textarea required className="w-full flex-1 resize-none font-mono text-sm leading-relaxed focus:outline-none text-gray-800 p-6 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all min-h-[400px] md:min-h-0" value={formData.deliverables} onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })} placeholder="Start typing your agreement here..." />
                </form>
              </div>

              {/* SIDEBAR (CONTRACT DETAILS) */}
              <div className="w-full lg:w-[450px] bg-gray-50/50 p-8 md:p-10 flex flex-col h-full overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Contract Details</h3>
                  <div className="space-y-6 flex-1">
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">Client Name</label><input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} placeholder="e.g. John Smith" /></div>
                    
                    {/* 🆕 PAYMENT STRUCTURE SELECTOR */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Structure</label>
                       <div className="flex gap-2">
                          <button 
                             onClick={() => setPaymentType('one_time')}
                             className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${paymentType === 'one_time' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                          >
                             <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">One-Time</span>
                          </button>
                          <button 
                             onClick={() => setPaymentType('monthly')}
                             className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${paymentType === 'monthly' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                          >
                             <CalendarDays className="w-4 h-4" /> <span className="hidden sm:inline">Monthly</span>
                          </button>
                          
                          {/* 🆕 AGREEMENT ONLY (PRO FEATURE) - FIXED ALIGNMENT */}
                          <button 
                             onClick={() => {
                                 if (!isPro) {
                                     setShowPricingModal(true);
                                 } else {
                                     setPaymentType('none');
                                     setLineItems([]); // Clear money items
                                     setManualPriceOverride('0'); // Free
                                 }
                             }}
                             className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${paymentType === 'none' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                          >
                             {isPro ? <FileSignature className="w-4 h-4 flex-shrink-0" /> : <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                             <span className="leading-tight text-center">Agreement Only</span>
                          </button>
                       </div>
                    </div>

                    {/* 🆕 HIDE MONEY SECTIONS IF AGREEMENT ONLY */}
                    {paymentType !== 'none' && (
                        <>
                            {/* 🆕 INVOICE BUILDER (Trades Upgrade) */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Itemized Invoice</label>
                               
                               {/* Add Item Row */}
                               <div className="flex gap-2 items-end mb-4">
                                  <div className="flex-1">
                                     <input className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Item (e.g. Labor)" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                                  </div>
                                  <div className="w-16">
                                     <input type="number" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-center" placeholder="Qty" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} />
                                  </div>
                                  <div className="w-20">
                                     <input type="number" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white" placeholder="Price" value={newItem.amount} onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })} />
                                  </div>
                                  <button onClick={handleAddItem} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800"><Plus className="w-4 h-4" /></button>
                               </div>

                               {/* Items List */}
                               {lineItems.length > 0 ? (
                                   <div className="space-y-2 mb-4">
                                       {lineItems.map((item) => (
                                           <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                                                   <div className="flex-1"><span className="font-medium text-gray-900">{item.description}</span> <span className="text-gray-400 text-xs">x{item.quantity}</span></div>
                                                   <div className="flex items-center gap-3">
                                                       <span className="font-mono font-bold">${(item.amount * item.quantity).toFixed(2)}</span>
                                                       <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                   </div>
                                           </div>
                                       ))}
                                   </div>
                               ) : (
                                   <div className="mb-4">
                                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Manual Total Price</label>
                                       <div className="relative">
                                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                           <input type="number" className="w-full pl-7 p-2 border border-gray-200 rounded-lg font-bold text-gray-900" placeholder="0.00" value={manualPriceOverride} onChange={(e) => setManualPriceOverride(e.target.value)} />
                                       </div>
                                   </div>
                               )}
                            </div>

                            <div className="animate-in fade-in slide-in-from-top-3">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tax Rate (%)</label>
                                <div className="relative"><input type="number" placeholder="0" className="w-full pl-4 pr-8 py-3 rounded-xl border border-gray-200 bg-white" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} /><span className="absolute right-4 top-3.5 text-gray-500 font-bold">%</span></div>
                                
                                <div className="flex items-center gap-2 mt-4 select-none">
                                    <input type="checkbox" id="fee-toggle" checked={includeFee} onChange={(e) => setIncludeFee(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"/>
                                    <label htmlFor="fee-toggle" className="text-sm font-bold text-gray-700 cursor-pointer">3.9% Processing Fee <span className="text-xs font-normal text-gray-500">(Covers Stripe)</span></label>
                                </div>
                            </div>

                            {/* Deposit & Terms Section */}
                            {paymentType === 'one_time' && (
                                <div className="pt-6 border-t border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    {/* Split Payment Toggle */}
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-gray-700">Split into Installments?</label>
                                        <button 
                                            onClick={() => { setIsSplit(!isSplit); setDepositType('none'); }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSplit ? 'bg-black' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSplit ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {isSplit ? (
                                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Payments</label>
                                                    <input type="number" value={splitCount} onChange={(e) => setSplitCount(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black text-center" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Every (Days)</label>
                                                    <input type="number" value={splitFrequency} onChange={(e) => setSplitFrequency(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black text-center" />
                                                </div>
                                            </div>
                                            <div className="text-xs text-center text-gray-500 font-medium">
                                                {splitCount} payments of ${financials.splitAmount.toFixed(2)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Require Deposit?</label>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setDepositType('none')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${depositType === 'none' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>None</button>
                                                <button type="button" onClick={() => setDepositType('50')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${depositType === '50' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>50%</button>
                                                <button type="button" onClick={() => setDepositType('fixed')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${depositType === 'fixed' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Fixed $</button>
                                            </div>
                                            {depositType === 'fixed' && (
                                                <div className="mt-2 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span><input type="number" placeholder="500.00" className="w-full pl-7 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black" value={fixedDepositAmount} onChange={(e) => setFixedDepositAmount(e.target.value)} /></div>
                                            )}
                                        </div>
                                    )}

                                    {!isSplit && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Balance Due Date</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer text-sm font-medium"
                                                    value={paymentTerms}
                                                    onChange={(e) => setPaymentTerms(e.target.value as any)}
                                                >
                                                    <option value="immediate">Due Upon Receipt</option>
                                                    <option value="completion">Due Upon Completion</option>
                                                    <option value="net15">Net 15 (15 Days Later)</option>
                                                    <option value="net30">Net 30 (30 Days Later)</option>
                                                    <option value="net60">Net 60 (60 Days Later)</option>
                                                </select>
                                                <CalendarClock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                  </div>

                  <div className="mt-8">
                      {paymentType === 'none' ? (
                          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                              <div className="bg-slate-800 p-3 rounded-full mb-3"><FileSignature className="w-8 h-8 text-indigo-400" /></div>
                              <h3 className="text-lg font-bold text-white">Agreement Only</h3>
                              <p className="text-slate-400 text-xs mt-1 max-w-[200px]">This contract collects signatures but requires no payment through MicroFreelance.</p>
                          </div>
                      ) : (
                          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-6 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-1"><span className="text-slate-400 text-sm font-medium">Subtotal</span><span className="text-slate-300 font-bold">${financials.subtotal.toFixed(2)}</span></div>
                            
                            {parseFloat(formData.taxRate) > 0 && (<div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-800/50"><span className="text-slate-400 text-sm font-medium">Tax ({formData.taxRate}%)</span><span className="text-slate-300 font-bold">+${financials.taxAmount.toFixed(2)}</span></div>)}
                            {includeFee && (<div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800"><span className="text-slate-400 text-sm font-medium">Processing Fee (3.9%)</span><span className="text-slate-300 font-bold">+${financials.feeAmount.toFixed(2)}</span></div>)}

                            <div className="flex justify-between items-end mb-4"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Contract Value</span><div className="text-right leading-none"><span className="text-3xl font-bold">${financials.grandTotal.toFixed(2)}</span></div></div>
                            
                            {/* DEPOSIT DISPLAY */}
                            {!isSplit && depositType !== 'none' && paymentType === 'one_time' && (
                                <div className="bg-emerald-900/50 border border-emerald-800 rounded-lg p-3 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Due Now (Deposit)</span>
                                    <span className="text-xl font-bold text-white">${financials.depositAmount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* SPLIT DISPLAY */}
                            {isSplit && (
                                <div className="bg-indigo-900/50 border border-indigo-800 rounded-lg p-3 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-indigo-300 text-sm font-bold uppercase tracking-wider">Per Payment</span>
                                    <span className="text-xl font-bold text-white">${financials.splitAmount.toFixed(2)}</span>
                                </div>
                            )}

                             {/* MONTHLY RETAINER DISPLAY */}
                             {paymentType === 'monthly' && (
                                <div className="bg-blue-900/50 border border-blue-800 rounded-lg p-3 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-blue-300 text-sm font-bold uppercase tracking-wider">Billed Monthly</span>
                                    <span className="text-xl font-bold text-white">${financials.grandTotal.toFixed(2)}</span>
                                </div>
                            )}
                          </div>
                      )}
                      
                      <button onClick={handleSubmit} disabled={loading} className={`w-full font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-lg bg-black text-white hover:bg-gray-900 transform hover:-translate-y-0.5`}>{loading ? 'Saving...' : 'Save to Dashboard'}</button>
                      <p className="text-center text-xs text-gray-400 mt-4 leading-snug">By clicking Save, you agree to the <Link href="/terms-of-service" className="underline hover:text-gray-600">Terms</Link> and acknowledge that you are responsible for the legal validity of this contract.</p>
                  </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} userId={userId} />
    </div>
  );
}

export default function CreateProject() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading editor...</div>}>
      <CreateProjectContent />
    </Suspense>
  );
}