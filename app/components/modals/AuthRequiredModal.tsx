'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, X } from 'lucide-react';

interface AuthRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredModal({ open, onOpenChange }: AuthRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop (Dark overlay) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden scale-100 transition-all m-4">
        
        {/* Close Button */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10 text-center relative">
            {/* Decorative background icons */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <Sparkles className="w-32 h-32 text-blue-50 absolute -top-10 -left-10 opacity-50" />
                <Sparkles className="w-24 h-24 text-indigo-50 absolute -bottom-12 -right-8 opacity-50" />
            </div>

            <div className="relative z-10">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-blue-50">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Save Your Agreement
                </h2>
                
                <p className="text-slate-500 leading-relaxed">
                  You need a free account to save your progress, get digital signatures, and accept payments.
                </p>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white hover:border-slate-300 transition-all order-2 sm:order-1"
          >
            Not Now
          </button>
          
          <Link href="/login" className="w-full sm:flex-1 order-1 sm:order-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-xl font-bold flex items-center justify-center gap-2 py-3 transition-all transform hover:-translate-y-0.5">
                 Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}