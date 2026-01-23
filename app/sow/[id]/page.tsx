'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signContract } from '../../actions/signSOW';
import { ArrowLeft, CheckCircle, Lock, X, Share2, Download, Edit3, MoreHorizontal } from 'lucide-react';
import PayContractButton from '../../components/PayContractButton';

// 1. Clean Cursive Font
const cursive = { fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive", fontStyle: 'italic' };

// 2. Helper to remove "(Copy)" from the title visually
const cleanTitle = (title: string) => {
  return title ? title.replace(/\(Copy\)/gi, '').trim() : '';
};

// 3. Helper for Money
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ViewContract({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Signing & Menu State
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signRole, setSignRole] = useState<'client' | 'provider'>('client');
  const [isSigning, setIsSigning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shareText, setShareText] = useState('Share Link');

  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if payment was just completed
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    const load = async () => {
      // 1. Load the Document
      const { data: docData, error } = await supabase.from('sow_documents').select('*').eq('id', params.id).single();
      
      if (error || !docData) {
         setLoading(false);
         return;
      }

      // ⚡️ AUTO-UPDATE: If payment succeeded, call the SECURE API to update status
      if (paymentStatus === 'success' && docData.status !== 'Paid') {
         
         // Call our new Admin API route
         await fetch('/api/sow/mark-paid', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ sowId: params.id }),
         });

         // Update local state immediately so the UI turns green
         setDoc({ ...docData, status: 'Paid' }); 
      } else {
         // Just set the doc as is
         setDoc(docData);
      }

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setLoading(false);
    };
    load();
  }, [params.id, supabase, paymentStatus]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareText('Copied!');
    setTimeout(() => {
        setShareText('Share Link');
        setShowMenu(false);
    }, 1500);
  };

  const openSignModal = () => {
    setSignerName('');
    setShowSignModal(true);
  };

  const handleSign = async () => {
    if (!signerName) return alert("Please type your name.");
    setIsSigning(true);

    const result = await signContract(params.id, signerName, signRole);

    if (result.success) {
      const newDoc = { ...doc };
      if (signRole === 'client') {
        newDoc.status = 'Signed';
        newDoc.signed_by = signerName;
      } else {
        newDoc.provider_sign = signerName;
      }
      setDoc(newDoc);
      setShowSignModal(false);
    } else {
      alert("Signing failed. Please try again.");
    }
    setIsSigning(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Contract...</div>;
  if (!doc) return <div className="min-h-screen flex items-center justify-center text-red-500">Contract not found.</div>;

  const isOwner = currentUser?.id === doc.user_id;
  const isFullySigned = doc.signed_by && doc.provider_sign;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:p-0 print:m-0">
      
      {/* 🖨️ HEADER CONTROLS (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden relative">
        {/* LEFT: BACK */}
        <Link href="/dashboard" className="text-gray-500 hover:text-black font-semibold text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* CENTER: SIGN BUTTON (Absolute Center) */}
        {!isFullySigned && (
           <button 
             onClick={openSignModal}
             className="absolute left-1/2 transform -translate-x-1/2 px-8 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 shadow-lg transition-all"
           >
             Sign Contract
           </button>
        )}

        {/* RIGHT: MENU (...) */}
        <div className="relative">
           <button 
             onClick={() => setShowMenu(!showMenu)} 
             className="p-2 hover:bg-gray-200 rounded-full transition-colors"
           >
              <MoreHorizontal className="w-6 h-6 text-gray-700" />
           </button>

           {/* DROPDOWN MENU */}
           {showMenu && (
             <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                {isOwner && !isFullySigned && (
                  <Link href={`/edit/${doc.id}`} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                     <Edit3 className="w-4 h-4" /> Edit Contract
                  </Link>
                )}
                <button onClick={() => window.print()} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                   <Download className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100">
                   <Share2 className="w-4 h-4" /> {shareText}
                </button>
             </div>
           )}
           {/* Click overlay to close menu */}
           {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>}
        </div>
      </div>

      {/* 🟢 SUCCESS BANNER (Shows if payment=success) */}
      {paymentStatus === 'success' && (
        <div className="max-w-3xl mx-auto bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-4 print:hidden">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Payment Successful!</p>
            <p className="text-sm">The funds have been secured. Contract status updated to Paid.</p>
          </div>
        </div>
      )}

      {/* 📄 THE CONTRACT PAPER */}
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-xl min-h-[1000px] print:min-h-0 print:shadow-none print:p-8 print:max-w-none relative">
        
        {/* Top Color Bar (Screen Only) */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 print:hidden"></div>

        {/* Header */}
        <div className="border-b-2 border-black pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6 print:flex-row">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2 leading-tight">
                {cleanTitle(doc.title)}
            </h1>
            <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold print:text-black">Statement of Work</p>
          </div>
          
          <div className="text-left sm:text-right print:text-right min-w-[200px]">
            <div className="bg-gray-100 px-4 py-2 rounded mb-2 inline-block print:bg-white print:border print:border-black">
              <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wide print:text-black">Total Price</span>
              <span className="text-xl font-bold">{formatMoney(doc.price)}</span>
            </div>
            <p className="text-sm text-gray-700 print:text-black"><strong>Client:</strong> {doc.client_name}</p>
            <p className="text-sm text-gray-700 print:text-black"><strong>Date:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Deliverables Body */}
        <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-line mb-20 print:text-black font-serif print:text-sm">
          <h3 className="text-sm font-bold uppercase border-b border-gray-200 pb-2 mb-4 text-gray-400 print:text-black print:border-black">Deliverables & Scope</h3>
          {doc.deliverables}
        </div>

        {/* ✍️ SIGNATURE BLOCKS */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 gap-12 print:grid-cols-2 print:break-inside-avoid">
          
          {/* 1. CLIENT SIGNATURE */}
          <div className="relative">
            <div className="border-t-2 border-black pt-4">
              {doc.signed_by && (
                 <div className="absolute -top-12 left-2">
                    <span style={cursive} className="text-blue-700 text-4xl inline-block transform -rotate-2 print:text-black">
                      {doc.signed_by}
                    </span>
                 </div>
              )}
              
              <p className="font-bold text-gray-900 uppercase tracking-wide print:text-black">{doc.client_name}</p>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 print:text-black">Client Signature</p>

              {doc.signed_by && (
                <p className="text-[10px] text-gray-400 print:text-gray-600">
                  Digitally Signed: {new Date().toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* 2. PROVIDER SIGNATURE */}
          <div className="relative">
            <div className="border-t-2 border-black pt-4">
              {doc.provider_sign && (
                 <div className="absolute -top-12 left-2">
                    <span style={cursive} className="text-indigo-700 text-4xl inline-block transform -rotate-1 print:text-black">
                      {doc.provider_sign}
                    </span>
                 </div>
              )}
              
              <p className="font-bold text-gray-900 uppercase tracking-wide print:text-black">Service Provider</p>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 print:text-black">Provider Signature</p>

               {doc.provider_sign && (
                <p className="text-[10px] text-gray-400 print:text-gray-600">
                  Digitally Signed: {new Date().toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 💳 PAYMENT SECTION (Hidden on Print) */}
        <div className="mt-16 border-t border-gray-100 pt-8 print:hidden">
            {/* If Paid (via Stripe or manual update), show Blue Button */}
            {paymentStatus === 'success' || doc.status === 'Paid' ? (
                <button disabled className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 opacity-100 cursor-default shadow-sm">
                   <CheckCircle className="w-5 h-5" /> Paid in Full
                </button>
            ) : (
                <PayContractButton sowId={doc.id} price={doc.price} />
            )}
            
            <p className="text-center text-xs text-gray-400 mt-4 flex justify-center items-center gap-1">
               <Lock className="w-3 h-3" /> Secure Payment via Stripe
            </p>
        </div>
        
        {/* FOOTER (Hidden on Print) */}
        <div className="mt-8 text-center print:hidden opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest">Securely generated by</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform">
              ⚡ MicroFreelanceHub
          </Link>
        </div>

        {/* PRINT ONLY FOOTER */}
        <div className="hidden print:block fixed bottom-4 left-0 w-full text-center text-[8px] text-gray-400 uppercase tracking-widest">
            Generated via MicroFreelanceHub • Secure Contract ID: {doc.id.slice(0, 8)}
        </div>

      </div>

      {/* 📝 SIGNING MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sign Contract</h2>
                <button onClick={() => setShowSignModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Select your role and type your name to legally bind this agreement.</p>
            
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">I am signing as:</label>
            <div className="relative mb-4">
              <select 
                value={signRole}
                onChange={(e) => setSignRole(e.target.value as 'client' | 'provider')}
                className="w-full border-2 border-gray-200 p-3 rounded-lg appearance-none bg-gray-50 font-semibold focus:border-black focus:outline-none"
              >
                <option value="client">The Client ({doc.client_name})</option>
                <option value="provider">The Service Provider</option>
              </select>
            </div>
            
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Legal Name</label>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. Jane Doe"
              className="w-full border-2 border-gray-200 p-3 rounded-lg mb-6 text-lg focus:border-black focus:outline-none"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
            
            <div className="flex gap-3">
              <button onClick={() => setShowSignModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-bold hover:bg-gray-200">Cancel</button>
              <button 
                onClick={handleSign}
                disabled={isSigning || !signerName}
                className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {isSigning ? 'Signing...' : 'Agree & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}