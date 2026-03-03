"use client";
import { useState } from 'react';
// Preserving your working relative path
import { supabase } from './../supabaseClient';

export default function EmailCapture({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const { error } = await supabase
        .from('hair_leads')
        .insert([{ email: email, hair_profile: slug }]);

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      console.error("Connection Error:", err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
        <p className="text-green-800 font-bold text-lg">✓ Routine Saved!</p>
        <p className="text-green-600 text-sm mt-1">Check your inbox for your 90-day protocol.</p>
      </div>
    );
  }

  return (
    <section className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
      <h3 className="text-xl font-bold">Save this 90-Day Protocol?</h3>
      <p className="text-slate-400 text-sm mt-2 mb-6">
        We'll email you a PDF copy and a weekly tracking calendar tailored to your results.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input 
          type="email" 
          required 
          placeholder="Enter your email" 
          className="px-4 py-3 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-pink-500 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <button 
          type="submit"
          disabled={status === 'loading'}
          className="bg-pink-500 hover:bg-pink-400 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {status === 'loading' && (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>{status === 'loading' ? 'Saving Your Routine...' : 'Send Me My Routine'}</span>
        </button>
        
        {status === 'error' && (
          <p className="text-red-400 text-xs mt-2 text-center">
            Connection error. Please try again.
          </p>
        )}
      </form>
    </section>
  );
}