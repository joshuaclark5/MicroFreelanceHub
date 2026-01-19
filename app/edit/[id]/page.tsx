'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function EditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // 1. STATE DEFINITIONS
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // AI State
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '', title: '', price: '', deliverables: '', payment_link: ''
  });

  // 2. LOAD DATA (Supabase is initialized INSIDE here, safely)
  useEffect(() => {
    const load = async () => {
      // ✅ SAFE: Initializing here prevents the cookie crash
      const supabase = createClientComponentClient();
      
      const { data } = await supabase.from('sow_documents').select('*').eq('id', params.id).single();
      if (data) setFormData({
        client_name: data.client_name || '', title: data.title || '',
        price: data.price || '', deliverables: data.deliverables || '',
        payment_link: data.payment_link || ''
      });
      setLoading(false);
    };
    load();
  }, [params.id]);

  // 3. AI HANDLER (Using standard fetch, no Supabase needed here)
  const handleRefine = async () => {
    if (!refineText) return;
    setIsRefining(true);
    
    try {
      console.log("🚀 Sending to AI:", { deliverables: formData.deliverables, instructions: refineText });

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverables: formData.deliverables,
          price: Number(formData.price) || 0,
          instructions: refineText
        })
      });

      if (!response.ok) throw new Error('AI request failed');

      const result = await response.json();
      console.log("✅ AI Responded:", result); 
      
      // Handle Capitalization Variations
      const newDeliverables = result.deliverables || result.Deliverables || result.scope || result.Scope;
      const newTitle = result.title || result.Title;
      const newPrice = result.price || result.Price;

      if (!newDeliverables && !newPrice && !newTitle) {
        alert("The AI replied, but didn't return valid data. Check the Console (F12).");
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: newTitle || prev.title,
        deliverables: newDeliverables || prev.deliverables,
        price: newPrice ? newPrice.toString() : prev.price
      }));
      
      setRefineText(""); 

    } catch (err) {
      console.error("❌ Error:", err);
      alert("AI failed. Try again.");
    } finally {
      setIsRefining(false);
    }
  };

  // 4. SAVE HANDLER (Initialize Supabase just for this action)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // ✅ SAFE: Initializing here is fine because it's an event, not a render
    const supabase = createClientComponentClient();
    
    await supabase.from('sow_documents').update({ 
      ...formData, price: Number(formData.price) 
    }).eq('id', params.id);
    router.push('/dashboard');
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Edit Contract</h1>

        {/* AI Bar */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-8 flex gap-2">
          <input 
            className="flex-1 px-3 py-2 rounded border border-indigo-200"
            placeholder="AI Instructions (e.g. 'Add a $500 rush fee')"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
          />
          <button 
            type="button"
            onClick={handleRefine}
            disabled={isRefining || !refineText}
            className="bg-indigo-600 text-white px-4 rounded font-bold min-w-[100px] flex justify-center items-center"
          >
            {isRefining ? "Thinking..." : "Update"}
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div><label className="font-bold block mb-1">Client Name</label><input className="w-full border p-2 rounded" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} /></div>
          <div><label className="font-bold block mb-1">Project Title</label><input className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
          <div><label className="font-bold block mb-1">Price ($)</label><input type="number" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
          <div><label className="font-bold block mb-1">Payment Link</label><input className="w-full border p-2 rounded" placeholder="Venmo/Stripe Link" value={formData.payment_link} onChange={e => setFormData({...formData, payment_link: e.target.value})} /></div>
          <div><label className="font-bold block mb-1">Deliverables</label><textarea rows={10} className="w-full border p-2 rounded font-mono" value={formData.deliverables} onChange={e => setFormData({...formData, deliverables: e.target.value})} /></div>
          
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={() => router.back()} className="w-1/3 bg-gray-200 py-3 rounded font-bold">Cancel</button>
            <button className="w-2/3 bg-black text-white py-3 rounded font-bold">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}