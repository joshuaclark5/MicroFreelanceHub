"use client";
import { useState } from 'react';
import Link from 'next/link';
import { X, Mail, FileSignature } from 'lucide-react';

export default function WaitlistModal({ templateSlug }: { templateSlug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In the future, you can wire this to Supabase. For now, we just fake the success state!
    setSubmitted(true);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:-translate-y-1 bg-indigo-900 hover:bg-indigo-800"
      >
        Automate This Sequence &rarr;
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <>
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Automated Dunning is launching soon!</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  We are currently putting the finishing touches on the robot that will send these emails for you. Drop your email to get VIP access the moment it goes live.
                </p>
                
                <form onSubmit={handleSubmit} className="mb-6">
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">
                      Join
                    </button>
                  </div>
                </form>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">What you can do right now:</p>
                  <Link href={`/create?template=${templateSlug}`} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700 text-sm">Use a Service Agreement</p>
                      <p className="text-xs text-slate-500">Protect yourself upfront with a legally binding scope of work and deposit link.</p>
                    </div>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSignature className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the list!</h3>
                <p className="text-slate-600 mb-6">We'll notify you the exact second the automated engine goes live.</p>
                <Link href={`/create?template=${templateSlug}`}>
                  <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700">
                    Use a Service Agreement Instead &rarr;
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}