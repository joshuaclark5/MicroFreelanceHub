'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
// 👇 Import the AI Brain
import { generateQuestions, generateFinalSOW, refineSOW } from '../actions/generateSOW';
import Link from 'next/link';

// 🛡️ THE LEGAL SHIELD (Terms at the bottom)
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

function CreateProjectContent() {
  const [formData, setFormData] = useState({
    clientName: '',
    projectTitle: '',
    price: '',
    taxRate: '', 
    deliverables: '', 
    description: ''
  });

  const [step, setStep] = useState<'start' | 'questions' | 'final'>('start');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  
  // Refine State
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  
  // Liability Protection State
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  
  const [isPro, setIsPro] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Check Pro Status
  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      if (data) setIsPro(data.is_pro);
    };
    checkPro();
  }, [supabase]);

  // 2. HELPER: The "Beefing Up" Function (Makes contracts look Pro)
  const generateProfessionalContent = (title: string, rawDeliverables: any) => {
    // Ensure deliverables is a clean array
    const list = Array.isArray(rawDeliverables) 
        ? rawDeliverables 
        : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Scope of work details..."]);

    const bullets = list.map((item: string) => `• ${item}`).join('\n');

    return `1. PROJECT BACKGROUND
This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services, and the Contractor agrees to perform such services in accordance with the terms and conditions set forth below.

2. SCOPE OF SERVICES
The Contractor shall provide the following specific deliverables:

${bullets}

3. PERFORMANCE STANDARDS
The Contractor agrees to perform the ${title} services in a professional manner, using the degree of skill and care that is required by current industry standards. The Contractor shall provide all tools and equipment necessary to complete the tasks unless otherwise agreed.

${LEGAL_TERMS}`;
  };

  // 3. SMART TEMPLATE INJECTOR (Updated)
  useEffect(() => {
    async function loadTemplate() {
      const urlSlug = searchParams.get('template');
      const localSlug = localStorage.getItem('pending_template');
      const slug = urlSlug || localSlug;
      
      if (slug) {
        setLoading(true);
        setLoadingMessage('Generating Contract...');

        // Dictionary to catch "Hire" vs "Template" naming mismatches
        const manualOverrides: Record<string, string> = {
            'hire-graphic-designer': 'freelance-logo-designer',
            'hire-video-editor': 'freelance-videographer',
            'hire-photographer': 'hire-event-photographer',
            'hire-web-developer': 'hire-wordpress-developer',
        };

        const searchSlug = manualOverrides[slug] || slug;

        // A. Try System Templates (sow_documents)
        let { data: sowDoc } = await supabase
          .from('sow_documents')
          .select('*')
          .eq('slug', searchSlug)
          .single();

        let foundData = null;

        if (sowDoc) {
             foundData = {
                 title: sowDoc.title,
                 price: sowDoc.price,
                 deliverables: sowDoc.deliverables
             };
        } else {
            // B. Try SEO Pages
            let { data: seoDoc } = await supabase
               .from('seo_pages')
               .select('*')
               .eq('slug', searchSlug)
               .single();
            
            if (seoDoc) {
                foundData = {
                    title: seoDoc.job_title || seoDoc.keyword,
                    price: 0, // SEO pages rarely have prices
                    deliverables: seoDoc.deliverables
                };
            }
        }

        // C. If found, INJECT and BEEF UP the content
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

  // [Remaining helper functions: handleUpgrade, handleAnalyze, etc. keep same logic]
  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const STRIPE_LINK = 'https://buy.stripe.com/00wbIVa99ais1Ue5RY48002'; // Replace with yours
    if (user) {
        window.location.href = `${STRIPE_LINK}?client_reference_id=${user.id}`;
    } else {
        window.location.href = STRIPE_LINK;
    }
  };

  const handleAnalyze = async () => {
    if (!formData.clientName) return alert("Please enter the Client Name first.");
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
      // Use the same professional formatter here too
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAgreedToTerms) return alert("You must agree to the terms.");

    setLoading(true);
    setLoadingMessage('Saving...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      localStorage.setItem('pendingSOW', JSON.stringify({
        client_name: formData.clientName,
        title: formData.projectTitle,
        price: parseFloat(formData.price),
        deliverables: formData.deliverables,
        status: 'Draft'
      }));
      alert("Please create a free account to save your Project!");
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

    // Tax Logic
    let finalDeliv = formData.deliverables;
    const basePrice = parseFloat(formData.price) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    if (taxRate > 0) {
        const taxAmount = basePrice * (taxRate / 100);
        const total = basePrice + taxAmount;
        finalDeliv += `\n\nFINANCIAL SUMMARY\nSubtotal: $${basePrice.toFixed(2)}\nTax/Fees (${taxRate}%): $${taxAmount.toFixed(2)}\nTOTAL: $${total.toFixed(2)}`;
    }

    const { error } = await supabase.from('sow_documents').insert({
      user_id: user.id,
      client_name: formData.clientName,
      title: formData.projectTitle,
      price: basePrice, 
      deliverables: finalDeliv,
      status: 'Draft'
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-black p-6 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {step === 'start' && 'New Project'}
            {step === 'questions' && 'AI Project Interview'}
            {step === 'final' && 'Contract Editor'}
          </h1>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Cancel</Link>
        </div>

        <div className="p-8 space-y-6">

          {/* START STEP */}
          {step === 'start' && (
            <div className="space-y-4">
              {loading && <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-center font-bold animate-pulse">{loadingMessage || 'Loading...'}</div>}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Project Description</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500"
                  rows={4}
                  placeholder="e.g. They need a custom CRM for their real estate business..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                    isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  {loading ? 'Thinking...' : isPro ? '✨ Start AI Interview (Pro)' : '🔒 Unlock AI Assistant ($19/mo)'}
                </button>

                <button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, deliverables: generateProfessionalContent("General Project", ["Deliverable 1", "Deliverable 2"]) }));
                        setStep('final');
                    }}
                    className="w-full py-3 rounded-lg font-bold text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-400 transition-all text-sm"
                >
                    ✍️ Skip & Write Manually (Free)
                </button>
              </div>
            </div>
          )}

          {/* QUESTIONS STEP */}
          {step === 'questions' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-indigo-50 p-4 rounded text-indigo-900 text-sm mb-4 border border-indigo-100">
                <strong>AI Assistant:</strong> "I have analyzed the request. Please answer these 3 questions to help me write the scope:"
              </div>
              {questions.map((q, index) => (
                <div key={index}>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">{q}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-3 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
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
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition-all mt-6 shadow-lg"
              >
                {loading ? 'Writing Contract...' : 'Generate Official SOW 🚀'}
              </button>
            </div>
          )}

          {/* FINAL REVIEW STEP */}
          {step === 'final' && (
            <div className="animate-in fade-in zoom-in duration-300">
              
              {/* AI REFINER BAR */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 flex gap-2 items-center">
                 <div className="flex-1">
                   <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">AI Editor (Make changes)</label>
                   <input 
                     type="text"
                     value={refineText}
                     onChange={(e) => setRefineText(e.target.value)}
                     placeholder={isPro ? "e.g. 'Add a $500 rush fee'" : "Unlock Pro to use AI Editor"}
                     disabled={!isPro}
                     className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                     onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                   />
                 </div>
                 <button 
                   type="button"
                   onClick={isPro ? handleRefine : handleUpgrade}
                   disabled={isPro && (isRefining || !refineText)}
                   className={`${isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-gray-800'} text-white px-4 py-2 rounded-lg font-bold text-sm h-10 mt-5 min-w-[100px] flex justify-center items-center`}
                 >
                   {isPro ? (isRefining ? '...' : 'Update') : 'Upgrade'}
                 </button>
               </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isTemplateLoaded && (
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-2 rounded-full border border-green-200 mb-4 inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                        Template Loaded Successfully
                    </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 font-semibold text-lg"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contract Agreement</label>
                  
                  {/* 👇 MOCK BROWSER WINDOW (The Look You Want) */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-100 border-b border-gray-200 p-3 flex gap-2 items-center">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="ml-auto text-xs text-gray-400 font-mono">EDITOR MODE</span>
                    </div>
                    <textarea
                        required
                        rows={20}
                        className="w-full px-4 py-3 font-mono text-sm leading-relaxed focus:outline-none resize-y"
                        value={formData.deliverables}
                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                    />
                  </div>
                  {/* 👆 END MOCK BROWSER */}

                </div>

                {/* BOTTOM INPUTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Client Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex gap-2 flex-nowrap">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                        <input
                        required
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>
                    <div className="w-24 flex-shrink-0">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tax %</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-gray-50 text-center"
                            value={formData.taxRate}
                            onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        />
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900 text-white p-4 rounded-lg flex justify-between items-center shadow-lg">
                    <span className="font-medium text-indigo-200">Total Project Value</span>
                    <span className="text-2xl font-bold">${calculateTotal()}</span>
                </div>

                {/* LIABILITY CHECKBOX */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            checked={hasAgreedToTerms}
                            onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                        />
                        <div className="text-xs text-gray-700 leading-snug">
                            <strong>I am not a lawyer.</strong> I understand MicroFreelanceHub provides templates for informational purposes only. I agree to the <Link href="/terms-of-service" className="underline">Terms</Link> and <Link href="/disclaimer" className="underline">Disclaimer</Link>.
                        </div>
                    </label>
                </div>

                <button 
                    disabled={loading || !hasAgreedToTerms} 
                    className={`w-full font-bold py-4 rounded-lg transition-all mt-4 shadow-lg text-lg ${
                        hasAgreedToTerms 
                        ? 'bg-black text-white hover:bg-gray-800 transform hover:-translate-y-1' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {loading ? 'Saving...' : 'Save to Dashboard ✅'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function CreateProject() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading editor...</div>}>
      <CreateProjectContent />
    </Suspense>
  );
}