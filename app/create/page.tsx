'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
// 👇 Import the AI Brain
import { generateQuestions, generateFinalSOW, refineSOW } from '../actions/generateSOW';
import Link from 'next/link';

export default function CreateProject() {
  const [formData, setFormData] = useState({
    clientName: '',
    projectTitle: '',
    price: '',
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
  
  const [isPro, setIsPro] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      if (data) setIsPro(data.is_pro);
    };
    checkPro();
  }, [supabase]);

  // Step 1: Analyze
  const handleAnalyze = async () => {
    if (!formData.clientName) return alert("Please enter the Client Name first.");
    if (!formData.description) return alert("Please describe the project.");
    
    setLoading(true);
    // The backend now guarantees a response (AI or Fallback)
    const qs = await generateQuestions(formData.description);
    
    if (qs && qs.length > 0) {
      setQuestions(qs);
      setStep('questions');
    } else {
      alert("System busy. Please try refreshing.");
    }
    setLoading(false);
  };

  // Step 2: Generate
  const handleFinalize = async () => {
    setLoading(true);
    const qaPairs = questions.map((q, i) => ({ q, a: answers[i] }));
    const result = await generateFinalSOW(formData.clientName, formData.description, qaPairs);
    
    if (result) {
      setFormData(prev => ({
        ...prev,
        projectTitle: result.title,
        deliverables: result.deliverables,
        price: result.price?.toString() || prev.price
      }));
      setStep('final');
    } else {
      alert("AI failed to generate contract. You can fill it in manually.");
      setStep('final'); // Move to final step anyway so user isn't stuck
    }
    setLoading(false);
  };

  // Step 3: Refine
  const handleRefine = async () => {
    if (!refineText) return;
    setIsRefining(true);
    
    const result = await refineSOW(
      formData.deliverables, 
      parseFloat(formData.price) || 0, 
      refineText
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
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('sow_documents').insert({
      user_id: user.id,
      client_name: formData.clientName,
      title: formData.projectTitle,
      price: parseFloat(formData.price) || 0,
      deliverables: formData.deliverables,
      status: 'Draft'
    });

    if (!error) router.push('/dashboard');
    setLoading(false);
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
              <button
                onClick={handleAnalyze}
                disabled={loading || !isPro}
                className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-md ${
                  isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Analyzing...' : isPro ? 'Start AI Interview 🤖' : 'Upgrade to use AI'}
              </button>
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
              
              {/* ✨ AI REFINEMENT BAR ✨ */}
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
                  {isRefining ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Update'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deliverables & Scope</label>
                  <textarea
                    required
                    rows={12}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm leading-relaxed"
                    value={formData.deliverables}
                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Client Name</label>
                    <input
                      required
                      readOnly
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-500"
                      value={formData.clientName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition-all mt-4 shadow-lg">
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