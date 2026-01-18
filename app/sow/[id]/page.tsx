'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { signContract } from '../../actions/signSOW';

// Clean Cursive Font
const cursive = { fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive", fontStyle: 'italic' };

export default function ViewContract({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Signing State
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signRole, setSignRole] = useState<'client' | 'provider'>('client');
  const [isSigning, setIsSigning] = useState(false);

  // Share State
  const [shareBtnText, setShareBtnText] = useState('Share with Client 🔗');

  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      // 1. Fetch Contract
      const { data: docData, error } = await supabase.from('sow_documents').select('*').eq('id', params.id).single();
      if (error) console.error("Error fetching doc:", error);
      setDoc(docData);

      // 2. Fetch User (to check if owner)
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  // --- ACTIONS ---

  const handleShare = () => {
    // Copy current URL to clipboard
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
      // Optimistic Update (Update UI instantly)
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
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      
      {/* 🖨️ TOP CONTROLS (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <Link href="/dashboard" className="text-gray-500 hover:text-black font-semibold text-sm flex items-center gap-1">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-center gap-2">
           {/* Edit (Only Owner) */}
           {isOwner && !isFullySigned && (
             <Link href={`/edit/${doc.id}`}>
               <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                 Edit
               </button>
             </Link>
           )}

           {/* Download PDF */}
           <button 
             onClick={() => window.print()} 
             className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
           >
             Download PDF
           </button>

           {/* ✨ NEW: Share Button */}
           <button 
             onClick={handleShare}
             className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-100 rounded transition-colors"
           >
             {shareBtnText}
           </button>

           {/* ✍️ UNIFIED SIGN BUTTON */}
           {!isFullySigned && (
             <button 
               onClick={openSignModal}
               className="px-6 py-2 bg-black text-white rounded text-sm font-bold hover:bg-gray-800 shadow-md transition-all animate-pulse"
             >
               Sign Contract ✍️
             </button>
           )}
           
           {/* 💰 PAY BUTTON (Only if Client Signed + Link exists) */}
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
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-xl min-h-[1000px] print:shadow-none print:p-0 relative">
        
        {/* Header */}
        <div className="border-b-2 border-black pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2 leading-tight">{doc.title}</h1>
            <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Statement of Work</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="bg-gray-100 px-4 py-2 rounded mb-2 inline-block">
              <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wide">Total Price</span>
              <span className="text-xl font-bold">${doc.price?.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-700"><strong>Client:</strong> {doc.client_name}</p>
            <p className="text-sm text-gray-700"><strong>Date:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Deliverables Body */}
        <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-line mb-20">
          <h3 className="text-sm font-bold uppercase border-b border-gray-200 pb-2 mb-4 text-gray-400">Deliverables & Scope</h3>
          {doc.deliverables}
        </div>

        {/* ✍️ TWO SIGNATURE BLOCKS */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 gap-12 print:break-inside-avoid">
          
          {/* 1. CLIENT SIGNATURE */}
          <div className="relative">
            <div className="border-t-2 border-black pt-2">
              {doc.signed_by ? (
                 <div className="absolute -top-12 left-0">
                    <span style={cursive} className="text-blue-700 text-4xl inline-block transform -rotate-2">
                      {doc.signed_by}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Digitally Signed {new Date().toLocaleDateString()}</p>
                 </div>
              ) : null}
              <p className="font-bold text-gray-900 uppercase tracking-wide">{doc.client_name}</p>
              <p className="text-xs text-gray-500 uppercase font-semibold">Client Signature</p>
            </div>
          </div>

          {/* 2. PROVIDER SIGNATURE */}
          <div className="relative">
            <div className="border-t-2 border-black pt-2">
              {doc.provider_sign ? (
                 <div className="absolute -top-12 left-0">
                    <span style={cursive} className="text-indigo-700 text-4xl inline-block transform -rotate-1">
                      {doc.provider_sign}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Digitally Signed {new Date().toLocaleDateString()}</p>
                 </div>
              ) : null}
              <p className="font-bold text-gray-900 uppercase tracking-wide">Service Provider</p>
              <p className="text-xs text-gray-500 uppercase font-semibold">Provider Signature</p>
            </div>
          </div>

        </div>
        
        {/* VIRAL LOOP FOOTER */}
        <div className="mt-24 pt-8 border-t border-gray-100 text-center print:hidden opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest">Securely generated by</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform">
             ⚡ MicroFreelanceHub
          </Link>
        </div>

      </div>

      {/* 📝 UNIFIED SIGNING MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            
            <h2 className="text-2xl font-bold mb-2">Sign Contract</h2>
            <p className="text-sm text-gray-500 mb-6">Select your role and type your name to legally bind this agreement.</p>
            
            {/* ROLE DROPDOWN */}
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">I am signing as:</label>
            <div className="relative mb-4">
              <select 
                value={signRole}
                onChange={(e) => setSignRole(e.target.value as 'client' | 'provider')}
                className="w-full border-2 border-gray-200 p-3 rounded-lg appearance-none bg-gray-50 font-semibold focus:border-black focus:outline-none"
              >
                <option value="client">The Client ({doc.client_name})</option>
                <option value="provider">The Service Provider (Freelancer)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                ▼
              </div>
            </div>
            
            {/* NAME INPUT */}
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
              <button 
                onClick={() => setShowSignModal(false)}
                className="flex-1 py-3 bg-gray-100 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSign}
                disabled={isSigning || !signerName}
                className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex justify-center items-center"
              >
                {isSigning ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Signing...
                  </span>
                ) : 'Agree & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}