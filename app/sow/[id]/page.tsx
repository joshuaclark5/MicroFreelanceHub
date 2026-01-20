'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { signContract } from '../../actions/signSOW';

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
    maximumFractionDigits: 0, // No decimals for cleaner look
  }).format(amount);
};

export default function ViewContract({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Signing State
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signRole, setSignRole] = useState<'client' | 'provider'>('client');
  const [isSigning, setIsSigning] = useState(false);
  const [shareBtnText, setShareBtnText] = useState('Share with Client 🔗');

  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      const { data: docData, error } = await supabase.from('sow_documents').select('*').eq('id', params.id).single();
      if (error) console.error("Error fetching doc:", error);
      setDoc(docData);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareBtnText('Link Copied! ✅');
    setTimeout(() => setShareBtnText('Share with Client 🔗'), 2000);
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
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0 print:m-0">
      
      {/* 🖨️ CONTROLS (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <Link href="/dashboard" className="text-gray-500 hover:text-black font-semibold text-sm flex items-center gap-1">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-center gap-2">
           {isOwner && !isFullySigned && (
             <Link href={`/edit/${doc.id}`}>
               <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                 Edit
               </button>
             </Link>
           )}

           <button 
             onClick={() => window.print()} 
             className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
           >
             Download PDF
           </button>

           <button 
             onClick={handleShare}
             className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-100 rounded transition-colors"
           >
             {shareBtnText}
           </button>

           {!isFullySigned && (
             <button 
               onClick={openSignModal}
               className="px-6 py-2 bg-black text-white rounded text-sm font-bold hover:bg-gray-800 shadow-md transition-all animate-pulse"
             >
               Sign Contract ✍️
             </button>
           )}
           
           {doc.status === 'Signed' && doc.payment_link && (
             <a 
               href={doc.payment_link} 
               target="_blank" 
               rel="noopener noreferrer"
               className="px-6 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 shadow-md transition-all flex items-center gap-2"
             >
               Pay Deposit 💸
             </a>
           )}
        </div>
      </div>

      {/* 📄 THE CONTRACT PAPER */}
      {/* 'print:shadow-none' removes shadow on PDF. 'print:max-w-none' uses full width of paper */}
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-xl min-h-[1000px] print:min-h-0 print:shadow-none print:p-8 print:max-w-none relative">
        
        {/* Header */}
        <div className="border-b-2 border-black pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6 print:flex-row">
          <div className="flex-1">
            {/* ✨ TITLE CLEANER APPLIED HERE */}
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
        
        {/* VIRAL LOOP FOOTER (Hidden on Print, Replace with clean branding) */}
        <div className="mt-24 pt-8 border-t border-gray-100 text-center print:hidden opacity-50 hover:opacity-100 transition-opacity">
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
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Sign Contract</h2>
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