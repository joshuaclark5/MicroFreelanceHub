'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateQuestions, generateFinalSOW, refineSOW } from '../actions/generateSOW';
import Link from 'next/link';
import { ArrowLeft, Sparkles, PenTool, ArrowRight, Trash2, Repeat, CreditCard, Wand2 } from 'lucide-react';

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

const MANUAL_TEMPLATE = `1. AGREEMENT OVERVIEW
This contract is entered into between the Client and the Provider.

2. SCOPE OF SERVICES
[Describe what you will do here...]

• Deliverable 1
• Deliverable 2

3. TIMELINE
Work will commence upon receipt of deposit.

${LEGAL_TERMS}`;

function CreateProjectContent() {
  const [formData, setFormData] = useState({
    clientName: '',
    projectTitle: '',
    price: '',
    taxRate: '', 
    deliverables: '', 
    description: ''
  });

  const [step, setStep] = useState<'select_mode' | 'ai_input' | 'questions' | 'final'>('select_mode');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [paymentType, setPaymentType] = useState<'one_time' | 'monthly'>('one_time');

  // AI Refiner State
  const [showAiRefiner, setShowAiRefiner] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false); // Kept for logic, but UI replaced
  const [isPro, setIsPro] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      if (data) setIsPro(data.is_pro);
    };
    checkPro();
  }, [supabase]);

  const generateProfessionalContent = (title: string, rawDeliverables: any) => {
    const list = Array.isArray(rawDeliverables) 
        ? rawDeliverables 
        : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Scope of work details..."]);

    const bullets = list.map((item: string) => `• ${item}`).join('\n');

    let content = `1. PROJECT BACKGROUND
This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services, and the Contractor agrees to perform such services in accordance with the terms and conditions set forth below.

2. SCOPE OF SERVICES
The Contractor shall provide the following specific deliverables:

${bullets}

3. PERFORMANCE STANDARDS
The Contractor agrees to perform the ${title} services in a professional manner, using the degree of skill and care that is required by current industry standards.

${LEGAL_TERMS}`;

    return content;
  };

  useEffect(() => {
    async function loadTemplate() {
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

        if (sowDoc) {
             foundData = { title: sowDoc.title, price: sowDoc.price, deliverables: sowDoc.deliverables };
        } else {
            let { data: seoDoc } = await supabase.from('seo_pages').select('*').eq('slug', searchSlug).single();
            if (seoDoc) {
                foundData = { title: seoDoc.job_title || seoDoc.keyword, price: 0, deliverables: seoDoc.deliverables };
            }
        }

        if (foundData) {
             const fullContent = generateProfessionalContent(foundData.title, foundData.deliverables);
             setFormData(prev => ({
               ...prev,
               projectTitle: foundData.title,
               deliverables: fullContent,
               price: foundData.price?.toString() || '',
               description: `Contract for ${foundData.title}`,
             }));
             setIsTemplateLoaded(true);
             setStep('final'); 
        }

        if (localSlug) localStorage.removeItem('pending_template');
        setLoading(false);
      }
    }
    loadTemplate();
  }, [supabase, searchParams]);

  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const STRIPE_LINK = 'https://buy.stripe.com/00wbIVa99ais1Ue5RY48002';
    window.location.href = user ? `${STRIPE_LINK}?client_reference_id=${user.id}` : STRIPE_LINK;
  };

  const handleStartManual = () => {
      setFormData(prev => ({ ...prev, deliverables: MANUAL_TEMPLATE }));
      setStep('final');
  };

  const handleClearContent = () => {
    if (confirm("Are you sure you want to clear the editor? This cannot be undone.")) {
        setFormData(prev => ({ ...prev, deliverables: '' }));
    }
  };

  const handleAnalyze = async () => {
    if (!formData.clientName) return alert("Please enter the Client Name.");
    if (!formData.description) return alert("Please describe the project.");
    if (!isPro) {
        if(confirm("The AI Interviewer is a Pro feature. Would you like to upgrade?")) handleUpgrade();
        return;
    }
    setLoading(true);
    setLoadingMessage('AI is analyzing your request...');
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
      const fullContent = generateProfessionalContent(result.title, result.deliverables);
      setFormData(prev => ({
        ...prev,
        projectTitle: result.title,
        deliverables: fullContent,
        price: result.price?.toString() || prev.price
      }));
      setStep('final');
    } else {
      alert("AI failed. Please try again.");
    }
    setLoading(false);
  };

  const handleRefine = async () => {
    if (!refineText) return;
    setIsRefining(true);
    const safeInstruction = `${refineText} (IMPORTANT: Keep the legal sections intact. Only update the Scope/Background.)`;
    const result = await refineSOW(formData.deliverables, parseFloat(formData.price) || 0, safeInstruction);
    if (result) {
      setFormData(prev => ({ ...prev, deliverables: result.deliverables, price: result.price?.toString() || prev.price }));
      setRefineText(""); 
    }
    setIsRefining(false);
    setShowAiRefiner(false); // Close the AI box after use
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implicit agreement now, no checkbox needed
    setLoading(true);
    setLoadingMessage('Saving...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      localStorage.setItem('pendingSOW', JSON.stringify({
        client_name: formData.clientName,
        title: formData.projectTitle,
        price: parseFloat(formData.price),
        deliverables: formData.deliverables,
        status: 'Draft',
        payment_type: paymentType
      }));
      alert("Please create a free account to save your Agreement!");
      window.location.href = '/login?next=/dashboard'; 
      return;
    }

    if (!isPro) {
        const { count } = await supabase.from('sow_documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        if (count !== null && count >= 3) {
            setLoading(false);
            if(confirm("Limit reached. Upgrade to Pro?")) handleUpgrade();
            return;
        }
    }

    let finalDeliv = formData.deliverables;
    const basePrice = parseFloat(formData.price) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = basePrice * (taxRate / 100);
    const total = basePrice + taxAmount;
    
    if (!finalDeliv.includes("FINANCIAL SUMMARY")) {
        finalDeliv += `\n\n--------------------------------------------------\nFINANCIAL SUMMARY\n`;
        finalDeliv += `Base Price: $${basePrice.toFixed(2)}\n`;
        if (taxRate > 0) {
            finalDeliv += `Tax (${taxRate}%): $${taxAmount.toFixed(2)}\n`;
        }
        finalDeliv += `TOTAL: $${total.toFixed(2)} ${paymentType === 'monthly' ? '/ month' : ''}`;
    }

    const { error } = await supabase.from('sow_documents').insert({
      user_id: user.id,
      client_name: formData.clientName,
      title: formData.projectTitle,
      price: total,
      deliverables: finalDeliv,
      status: 'Draft',
      payment_type: paymentType
    });

    if (!error) router.push('/dashboard');
    else alert("Error saving: " + error.message);
    setLoading(false);
  };

  const calculateTotal = () => {
    const p = parseFloat(formData.price) || 0;
    const t = parseFloat(formData.taxRate) || 0;
    return (p + (p * (t / 100))).toFixed(2);
  };

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {step === 'select_mode' && 'New Agreement'}
            {step === 'ai_input' && 'AI Assistant'}
            {step === 'questions' && 'AI Interview'}
            {step === 'final' && 'Contract Editor'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-black text-white w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg shadow-sm">M</div>
            <span className="text-sm font-bold text-gray-900">MicroFreelance</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {renderHeader()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* STEP 0: MODE SELECTION */}
          {step === 'select_mode' && (
             <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Create a new agreement</h2>
                <p className="text-gray-500 text-center mb-12 text-lg">Choose the method that works best for your workflow.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <button 
                        onClick={() => setStep('ai_input')}
                        className="group relative p-8 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left flex flex-col h-full"
                    >
                        <div className="mb-6 bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Use AI Assistant</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Describe your project in plain English. Our AI will interview you and draft a professional SOW automatically.
                        </p>
                        <div className="mt-auto pt-8 flex items-center text-indigo-600 font-bold">
                            Start Interview <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button 
                        onClick={handleStartManual}
                        className="group relative p-8 rounded-2xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50/50 transition-all text-left flex flex-col h-full"
                    >
                        <div className="mb-6 bg-gray-100 w-14 h-14 rounded-2xl flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform shadow-sm">
                            <PenTool className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Start from Scratch</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Jump straight into the editor with a blank standard template. Best if you already have the details ready.
                        </p>
                        <div className="mt-auto pt-8 flex items-center text-gray-900 font-bold">
                            Open Editor <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
             </div>
          )}

          {/* STEP 1 (AI PATH): INPUT DETAILS */}
          {step === 'ai_input' && (
            <div className="p-8 md:p-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4">
              <button onClick={() => setStep('select_mode')} className="text-sm text-gray-400 hover:text-black mb-6 flex items-center gap-2 font-medium">
                 <ArrowLeft className="w-4 h-4" /> Back to options
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-8">Tell us about the project</h2>

              {loading && <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-center font-bold animate-pulse mb-6">{loadingMessage || 'Loading...'}</div>}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Project Description</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    rows={6}
                    placeholder="e.g. They need a custom CRM for their real estate business. It should include contact management, property listings, and a client portal..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg ${
                    isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  {loading ? 'Thinking...' : isPro ? <><Sparkles className="w-5 h-5"/> Start AI Interview</> : 'Unlock AI Assistant ($19/mo)'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 (AI PATH): QUESTIONS */}
          {step === 'questions' && (
            <div className="p-8 md:p-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Interview</h2>
               <p className="text-gray-500 mb-8">Just a few more details to make your contract perfect.</p>

               <div className="bg-indigo-50 p-5 rounded-xl text-indigo-900 text-sm mb-8 border border-indigo-100 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 flex-shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <strong>AI Assistant:</strong> "I've analyzed your request. Please answer these 3 questions to help me write the scope:"
                </div>
              </div>

              <div className="space-y-8">
                {questions.map((q, index) => (
                  <div key={index}>
                    <label className="block text-base font-bold text-gray-800 mb-3">{q}</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all"
                      placeholder="Your answer..."
                      value={answers[index]}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[index] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all mt-10 shadow-lg hover:shadow-xl text-lg"
              >
                {loading ? 'Writing Contract...' : 'Generate Official Agreement'}
              </button>
            </div>
          )}

          {/* STEP 3 (FINAL): EDITOR */}
          {step === 'final' && (
            <div className="flex flex-col lg:flex-row h-full animate-in fade-in zoom-in duration-300">
              
              {/* MAIN EDITOR COLUMN */}
              <div className="flex-1 p-8 md:p-10 border-r border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
                  
                  {/* Title Input */}
                  <div>
                    <input
                      type="text"
                      required
                      className="w-full px-0 py-2 text-3xl font-bold text-gray-900 border-none focus:ring-0 placeholder-gray-300"
                      value={formData.projectTitle}
                      onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                      placeholder="Untitled Agreement"
                    />
                  </div>

                  {/* Editor Toolbar */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-4">
                      {isTemplateLoaded && (
                          <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                              Template Loaded
                          </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* ✨ AI ASSISTANT BUTTON */}
                        <button 
                            type="button"
                            onClick={() => isPro ? setShowAiRefiner(!showAiRefiner) : handleUpgrade()}
                            className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${isPro ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Wand2 className="w-4 h-4" /> {isPro ? (showAiRefiner ? 'Close AI' : 'Use AI Assistant') : 'Unlock AI'}
                        </button>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <button 
                            type="button" 
                            onClick={handleClearContent}
                            className="text-sm font-bold text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Clear
                        </button>
                    </div>
                  </div>

                  {/* AI Refiner Input */}
                  {showAiRefiner && (
                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2 flex gap-3 items-center">
                       <input 
                         type="text"
                         value={refineText}
                         onChange={(e) => setRefineText(e.target.value)}
                         placeholder="e.g. 'Add a $500 rush fee to the pricing section'"
                         className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                         onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                       />
                       <button 
                         type="button"
                         onClick={handleRefine}
                         disabled={isRefining || !refineText}
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
                       >
                         {isRefining ? '...' : <><Sparkles className="w-4 h-4" /> Update</>}
                       </button>
                     </div>
                   )}

                  {/* Textarea Editor - IMPROVED FOR MOBILE */}
                  <textarea
                      required
                      className="w-full flex-1 resize-none font-mono text-sm leading-relaxed focus:outline-none text-gray-800 p-6 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all min-h-[400px] md:min-h-0"
                      value={formData.deliverables}
                      onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                      placeholder="Start typing your agreement here..."
                  />
                </form>
              </div>

              {/* SIDEBAR COLUMN (Details & Payment) */}
              <div className="w-full lg:w-[400px] bg-gray-50/50 p-8 md:p-10 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Contract Details</h3>
                  
                  <div className="space-y-6 flex-1">
                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Client Name</label>
                        <input
                          required
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          value={formData.clientName}
                          onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                          placeholder="e.g. John Smith"
                        />
                    </div>

                    {/* Payment Schedule Toggle */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Payment Schedule</label>
                        <div className="flex bg-gray-200/50 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setPaymentType('one_time')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentType === 'one_time' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <CreditCard className="w-4 h-4" /> One-time
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('monthly')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentType === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <Repeat className="w-4 h-4" /> Monthly
                            </button>
                        </div>
                    </div>

                    {/* Price & Tax */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500 font-bold">$</span>
                                <input
                                    required
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="w-28">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tax (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full pl-4 pr-8 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-center"
                                    value={formData.taxRate}
                                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                />
                                <span className="absolute right-4 top-3.5 text-gray-500 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Total & Save */}
                  <div className="mt-8">
                      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-6">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-sm font-medium">Subtotal</span>
                            <span className="text-slate-300 font-bold">${parseFloat(formData.price || '0').toFixed(2)}</span>
                        </div>
                        {parseFloat(formData.taxRate) > 0 && (
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
                                <span className="text-slate-400 text-sm font-medium">Tax ({formData.taxRate}%)</span>
                                <span className="text-slate-300 font-bold">+${(parseFloat(formData.price || '0') * (parseFloat(formData.taxRate) / 100)).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Contract Value</span>
                            <div className="text-right leading-none">
                                <span className="text-3xl font-bold">${calculateTotal()}</span>
                                {paymentType === 'monthly' && <span className="text-sm font-bold text-indigo-400 ml-1">/mo</span>}
                            </div>
                        </div>
                      </div>

                      {/* Implicit Consent */}
                      <button 
                          onClick={handleSubmit}
                          disabled={loading} 
                          className={`w-full font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-lg bg-black text-white hover:bg-gray-900 transform hover:-translate-y-0.5`}
                      >
                        {loading ? 'Saving...' : 'Save to Dashboard'}
                      </button>
                      
                      <p className="text-center text-xs text-gray-400 mt-4 leading-snug">
                          By clicking Save, you agree to the <Link href="/terms-of-service" className="underline hover:text-gray-600">Terms</Link> and acknowledge that you are responsible for the legal validity of this contract.
                      </p>
                  </div>
              </div>
            </div>
          )}

        </div>
      </div>
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