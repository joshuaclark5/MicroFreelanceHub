'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import { refineSOW } from '../../actions/generateSOW'; // Adjusted import path for app/edit/[id]
import Link from 'next/link';
import { ArrowLeft, Sparkles, Trash2, Repeat, CreditCard, Wand2 } from 'lucide-react';

function EditProjectContent() {
  const [formData, setFormData] = useState({
    clientName: '',
    projectTitle: '',
    price: '',
    taxRate: '', 
    deliverables: '', 
  });

  const [loading, setLoading] = useState(true); // Start loading true to fetch data
  const [saving, setSaving] = useState(false);
  const [paymentType, setPaymentType] = useState<'one_time' | 'monthly'>('one_time');

  // AI Refiner State
  const [showAiRefiner, setShowAiRefiner] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const [isPro, setIsPro] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        // Check Pro
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        
        const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
        if (profile) setIsPro(profile.is_pro);

        // Fetch Project
        const { data: project, error } = await supabase
            .from('sow_documents')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            alert('Project not found');
            router.push('/dashboard');
            return;
        }

        // Parse Price & Tax (Rough estimation as we only saved Total)
        // For editing, we just load the total price into the price box for simplicity
        // or you could save tax_rate in DB separately in the future.
        // Here we assume price is the base price and user re-enters tax if needed, 
        // OR we just display the stored price.
        
        setFormData({
            clientName: project.client_name || '',
            projectTitle: project.title || '',
            price: project.price?.toString() || '',
            taxRate: '', // We don't store tax rate separately yet, so reset to 0 or leave blank
            deliverables: project.deliverables || '',
        });
        setPaymentType(project.payment_type || 'one_time');
        setLoading(false);
    };
    fetchData();
  }, [supabase, router, projectId]);

  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const STRIPE_LINK = 'https://buy.stripe.com/00wbIVa99ais1Ue5RY48002';
    window.location.href = user ? `${STRIPE_LINK}?client_reference_id=${user.id}` : STRIPE_LINK;
  };

  const handleClearContent = () => {
    if (confirm("Clear the editor?")) {
        setFormData(prev => ({ ...prev, deliverables: '' }));
    }
  };

  const handleRefine = async () => {
    if (!refineText) return;
    setIsRefining(true);
    const safeInstruction = `${refineText} (IMPORTANT: Keep legal sections intact.)`;
    const result = await refineSOW(formData.deliverables, parseFloat(formData.price) || 0, safeInstruction);
    if (result) {
      setFormData(prev => ({ ...prev, deliverables: result.deliverables, price: result.price?.toString() || prev.price }));
      setRefineText(""); 
    }
    setIsRefining(false);
    setShowAiRefiner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Tax Logic
    let finalDeliv = formData.deliverables;
    const basePrice = parseFloat(formData.price) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = basePrice * (taxRate / 100);
    const total = basePrice + taxAmount;
    
    if (taxRate > 0 && !finalDeliv.includes("FINANCIAL SUMMARY")) {
        finalDeliv += `\n\n--------------------------------------------------\nFINANCIAL SUMMARY\nBase Price: $${basePrice.toFixed(2)}\nTax (${taxRate}%): $${taxAmount.toFixed(2)}\nTOTAL: $${total.toFixed(2)}`;
    }

    const { error } = await supabase
        .from('sow_documents')
        .update({
            client_name: formData.clientName,
            title: formData.projectTitle,
            price: total,
            deliverables: finalDeliv,
            payment_type: paymentType
        })
        .eq('id', projectId);

    if (!error) router.push('/dashboard');
    else alert("Error updating: " + error.message);
    setSaving(false);
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
          <h1 className="text-lg font-bold text-gray-900">Edit Contract</h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-black text-white w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg shadow-sm">M</div>
            <span className="text-sm font-bold text-gray-900">MicroFreelance</span>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading project...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {renderHeader()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row h-full">
              
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
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">EDIT MODE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => isPro ? setShowAiRefiner(!showAiRefiner) : handleUpgrade()}
                            className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${isPro ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Wand2 className="w-4 h-4" /> {isPro ? (showAiRefiner ? 'Close AI' : 'AI Edit') : 'Unlock AI'}
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
                         placeholder="e.g. 'Update the price to $500'"
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

                  {/* Textarea Editor */}
                  <textarea
                      required
                      className="w-full flex-1 resize-none font-mono text-sm leading-relaxed focus:outline-none text-gray-800 py-4"
                      value={formData.deliverables}
                      onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                      placeholder="Start typing your agreement here..."
                  />
                </form>
              </div>

              {/* SIDEBAR COLUMN */}
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
                      
                      <button 
                          onClick={handleSubmit}
                          disabled={saving} 
                          className={`w-full font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-lg bg-black text-white hover:bg-gray-900 transform hover:-translate-y-0.5`}
                      >
                        {saving ? 'Updating...' : 'Update Contract'}
                      </button>
                  </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function EditProject() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading editor...</div>}>
      <EditProjectContent />
    </Suspense>
  );
}