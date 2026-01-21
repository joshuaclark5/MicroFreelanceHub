'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
// 👇 Import the AI Brain
import { generateQuestions, generateFinalSOW, refineSOW } from '../actions/generateSOW';
import Link from 'next/link';

// 🛡️ THE LEGAL SHIELD (Appended to every contract)
const LEGAL_BOILERPLATE = `

--------------------------------------------------
TERMS & CONDITIONS

1. SCOPE PROTECTION
The work listed above constitutes the entire agreement. Any additional features, revisions, or assets not explicitly listed in this "Deliverables & Scope" section are considered out of scope. Any additional work will require a separate agreement and may incur additional fees at the Freelancer's standard rate.

2. PAYMENT TERMS
Unless otherwise agreed, a 50% deposit is required to begin work, with the remaining balance due upon final delivery. 

3. OWNERSHIP & RIGHTS
Upon full payment, the Client is granted exclusive rights to the final deliverables. The Freelancer retains the right to use the work for portfolio and self-promotional purposes.

4. CANCELLATION
If the Client cancels the project after work has begun, the Freelancer retains the deposit to cover time and labor.
--------------------------------------------------`;

export default function CreateProject() {
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

  // 2. SMART TEMPLATE INJECTOR
  useEffect(() => {
    async function loadTemplate() {
      const slug = localStorage.getItem('pending_template');
      
      if (slug) {
        setLoading(true);

        // A. Try to find it in SEO Pages table
        let { data: seoData } = await supabase
          .from('seo_pages')
          .select('*')
          .eq('slug', slug)
          .single();

        if (seoData) {
          const bulletList = seoData.deliverables.map((d: string) => `• ${d}`).join('\n');
          const fullContractText = bulletList + LEGAL_BOILERPLATE;
          
          setFormData(prev => ({
            ...prev,
            projectTitle: `${seoData.job_title} Agreement`,
            deliverables: fullContractText,
            description: `Contract for ${seoData.keyword}`,
          }));
          
          setIsTemplateLoaded(true);
          setStep('final');
        } else {
          // B. Check original Templates table
          let { data: docData } = await supabase
            .from('sow_documents')
            .select('*')
            .eq('slug', slug)
            .single();
            
          if (docData) {
            const content = docData.deliverables.includes("TERMS & CONDITIONS") 
                ? docData.deliverables 
                : docData.deliverables + LEGAL_BOILERPLATE;

            setFormData(prev => ({
              ...prev,
              projectTitle: docData.title,
              deliverables: content,
              price: docData.price?.toString() || '',
            }));
            setIsTemplateLoaded(true);
            setStep('final');
          }
        }
        localStorage.removeItem('pending_template');
        setLoading(false);
      }
    }
    loadTemplate();
  }, [supabase]);

  // 💰 HELPER: Smart Upgrade Link
  // This fetches the User ID and attaches it to the Stripe URL
  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // REPLACE THIS URL with your live product link if different
    const STRIPE_LINK = 'https://buy.stripe.com/00wbIVa99ais1Ue5RY48002';
    
    if (user) {
        // ✅ The Fix: Attach ID so email doesn't matter
        window.location.href = `${STRIPE_LINK}?client_reference_id=${user.id}`;
    } else {
        // Fallback for guests (they really should login first)
        window.location.href = STRIPE_LINK;
    }
  };

  // Step 1: Analyze
  const handleAnalyze = async () => {
    if (!formData.clientName) return alert("Please enter the Client Name first.");
    if (!formData.description) return alert("Please describe the project.");
    
    if (!isPro) {
        if(confirm("The AI Interviewer is a Pro feature. Would you like to upgrade?")) {
            handleUpgrade(); // 👈 Use smart link
        }
        return;
    }
    
    setLoading(true);
    const qs = await generateQuestions(formData.description);
    
    if (qs && qs.length > 0) {
      setQuestions(qs);
      setStep('questions');
    } else {
      alert("System busy. Please try refreshing.");
    }
    setLoading(false);
  };

  // Step 2: Generate (AI Path)
  const handleFinalize = async () => {
    setLoading(true);
    const qaPairs = questions.map((q, i) => ({ q, a: answers[i] }));
    const result = await generateFinalSOW(formData.clientName, formData.description, qaPairs);
    
    if (result) {
      const fullContent = result.deliverables.includes("TERMS & CONDITIONS") 
        ? result.deliverables 
        : result.deliverables + LEGAL_BOILERPLATE;

      setFormData(prev => ({
        ...prev,
        projectTitle: result.title,
        deliverables: fullContent,
        price: result.price?.toString() || prev.price
      }));
      setStep('final');
    } else {
      alert("AI failed to generate contract. You can fill it in manually.");
      setStep('final'); 
    }
    setLoading(false);
  };

  // Step 3: Refine
  const handleRefine = async () => {
    if (!refineText) return;
    setIsRefining(true);
    
    const safeInstruction = `${refineText} (IMPORTANT: Do NOT modify or remove the 'TERMS & CONDITIONS' section at the bottom unless I specifically asked you to change the legal terms. Only update the project scope above it.)`;
    
    const result = await refineSOW(
      formData.deliverables, 
      parseFloat(formData.price) || 0, 
      safeInstruction
    );

    if (result) {
      setFormData(prev => ({
        ...prev,
        projectTitle: result.title || prev.projectTitle,
        deliverables: result.deliverables,
        price: result.price?.toString() || prev.price
      }));
      setRefineText(""); 
    } else {
      alert("AI didn't reply. You can edit the text manually below.");
    }
    setIsRefining(false);
  };

  // Step 4: Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasAgreedToTerms) {
        alert("You must agree to the liability terms before creating a contract.");
        return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Guest Handling
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

    // Limit Check
    if (!isPro) {
        const { count } = await supabase
            .from('sow_documents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
        if (count !== null && count >= 3) {
            setLoading(false);
            if(confirm("You have reached the limit of 3 Free Projects. Upgrade to Pro?")) {
                handleUpgrade(); // 👈 Use smart link
            }
            return;
        }
    }

    // Prepare Content
    let finalDeliverables = formData.deliverables;
    if (!finalDeliverables.includes("TERMS & CONDITIONS")) {
        finalDeliverables += LEGAL_BOILERPLATE;
    }

    // Calculate Tax
    const basePrice = parseFloat(formData.price) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    
    if (taxRate > 0) {
        const taxAmount = basePrice * (taxRate / 100);
        const total = basePrice + taxAmount;
        
        finalDeliverables = finalDeliverables.split("FINANCIAL SUMMARY")[0].trim();
        finalDeliverables += `\n\n--------------------------------------------------\n`;
        finalDeliverables += `FINANCIAL SUMMARY\n`;
        finalDeliverables += `Subtotal: $${basePrice.toFixed(2)}\n`;
        finalDeliverables += `Tax/Fees (${taxRate}%): $${taxAmount.toFixed(2)}\n`;
        finalDeliverables += `TOTAL DUE: $${total.toFixed(2)}\n`;
        finalDeliverables += `--------------------------------------------------`;
    }

    const { error } = await supabase.from('sow_documents').insert({
      user_id: user.id,
      client_name: formData.clientName,
      title: formData.projectTitle,
      price: basePrice, 
      deliverables: finalDeliverables,
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
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-black p-6 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {step === 'start' && 'New Project'}
            {step === 'questions' && 'Project Scope Interview'}
            {step === 'final' && 'Review Contract'}
          </h1>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Cancel</Link>
        </div>

        <div className="p-8 space-y-6">

          {/* START STEP */}
          {step === 'start' && (
            <div className="space-y-4">
              {loading && <div className="text-indigo-600 font-bold text-center mb-4">Finding your template...</div>}
              
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
                <label className="block text-sm font-bold text-gray-700 mb-1">What do they want?</label>
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
                  className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 relative overflow-hidden ${
                    isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  {loading ? (
                    <span>Analyzing...</span>
                  ) : isPro ? (
                    <span>✨ Start AI Interview (Pro)</span>
                  ) : (
                    <span>🔒 Unlock AI Assistant ($19/mo)</span>
                  )}
                </button>

                <button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, deliverables: LEGAL_BOILERPLATE }));
                        setStep('final');
                    }}
                    className="w-full py-3 rounded-lg font-bold text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-400 hover:text-gray-800 transition-all text-sm"
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
                <strong>AI Assistant:</strong> "I have analyzed the request for <strong>{formData.clientName}</strong>. Please answer these 3 questions:"
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
              
              {isPro ? (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">
                        AI Editor (Make changes)
                      </label>
                      <input 
                        type="text"
                        value={refineText}
                        onChange={(e) => setRefineText(e.target.value)}
                        placeholder="e.g. 'Remove the SEO part' or 'Add a rush fee of $500'"
                        className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleRefine}
                      disabled={isRefining || !refineText}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 h-10 mt-5 min-w-[100px] flex justify-center items-center"
                    >
                      {isRefining ? '...' : 'Update'}
                    </button>
                  </div>
              ) : (
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6 text-center">
                      <p className="text-sm text-gray-500 mb-2">Want AI to rewrite this for you?</p>
                      <button 
                        onClick={handleUpgrade}
                        className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full"
                      >
                        ⚡ Upgrade to Pro
                      </button>
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isTemplateLoaded && (
                    <div className="bg-green-50 text-green-800 text-xs font-bold px-3 py-2 rounded border border-green-200 mb-4 inline-block">
                        ✨ Template & Legal Shield Loaded
                    </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 font-semibold"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deliverables & Legal Terms</label>
                  <textarea
                    required
                    rows={16}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm leading-relaxed"
                    value={formData.deliverables}
                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    *Scroll down to see the standard legal terms included in this contract.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="flex gap-2">
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
                    <div className="w-1/3">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tax (%)</label>
                        <input
                        type="number"
                        placeholder="0"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        />
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900 text-white p-4 rounded-lg flex justify-between items-center shadow-lg">
                    <span className="font-medium text-indigo-200">Estimated Total (Inc. Tax)</span>
                    <span className="text-2xl font-bold">${calculateTotal()}</span>
                </div>

                {/* 🛡️ LIABILITY CHECKBOX */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            checked={hasAgreedToTerms}
                            onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                        />
                        <div className="text-sm text-gray-700">
                            <strong>Required:</strong> I acknowledge that MicroFreelanceHub provides templates for informational purposes only and does not provide legal advice. I agree to the <Link href="/terms-of-service" className="text-indigo-600 underline" target="_blank">Terms of Service</Link> and <Link href="/disclaimer" className="text-indigo-600 underline" target="_blank">Disclaimer</Link>, and I use this contract at my own risk.
                        </div>
                    </label>
                </div>

                <button 
                    disabled={loading || !hasAgreedToTerms} 
                    className={`w-full font-bold py-4 rounded-lg transition-all mt-4 shadow-lg ${
                        hasAgreedToTerms 
                        ? 'bg-black text-white hover:bg-gray-800' 
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