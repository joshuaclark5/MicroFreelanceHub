'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signContract } from '../../actions/signSOW';
import { ArrowLeft, CheckCircle, Lock, X, Share2, Download, Edit3, MoreHorizontal, PenTool } from 'lucide-react';
import PayContractButton from '../../components/PayContractButton';

// 1. Clean Cursive Font
const cursive = { fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive", fontStyle: 'italic' };

const cleanTitle = (title: string) => title ? title.replace(/\(Copy\)/gi, '').trim() : '';

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

  // Signing
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shareText, setShareText] = useState('Share Link');

  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    const load = async () => {
      const { data: docData, error } = await supabase.from('sow_documents').select('*').eq('id', params.id).single();
      
      if (error || !docData) { setLoading(false); return; }

      if (paymentStatus === 'success' && docData.status !== 'Paid') {
         await fetch('/api/sow/mark-paid', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ sowId: params.id }),
         });
         setDoc({ ...docData, status: 'Paid' }); 
      } else {
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
    setTimeout(() => { setShareText('Share Link'); setShowMenu(false); }, 1500);
  };

  const isOwner = currentUser?.id === doc?.user_id;
  const isFullySigned = doc?.signed_by && doc?.provider_sign;
  const isPaid = doc?.status === 'Paid' || paymentStatus === 'success';

  // 🔒 ROLE LOGIC: Automate the role selection
  // If you own the doc, you are the Provider. Everyone else is the Client.
  const userRole = isOwner ? 'provider' : 'client';

  const handleSign = async () => {
    if (!signerName) return alert("Please type your name.");
    setIsSigning(true);

    const result = await signContract(params.id, signerName, userRole);

    if (result.success) {
      const newDoc = { ...doc };
      if (userRole === 'client') {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:p-0 print:m-0">
      
      {/* 🖨️ HEADER (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden relative">
        <Link href="/dashboard" className="text-gray-500 hover:text-black font-semibold text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Sign Button - Only show if needed */}
        {!isFullySigned && !isPaid && (
           <button 
             onClick={() => setShowSignModal(true)}
             className="absolute left-1/2 transform -translate-x-1/2 px-8 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 shadow-lg transition-all flex items-center gap-2"
           >
             <PenTool className="w-4 h-4" /> Sign Contract
           </button>
        )}

        <div className="relative">
           <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <MoreHorizontal className="w-6 h-6 text-gray-700" />
           </button>
           {showMenu && (
             <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                {isOwner && !isFullySigned && (
                  <Link href={`/edit/${doc.id}`} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Edit3 className="w-4 h-4" /> Edit Contract</Link>
                )}
                <button onClick={() => window.print()} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Download className="w-4 h-4" /> Download PDF</button>
                <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100"><Share2 className="w-4 h-4" /> {shareText}</button>
             </div>
           )}
           {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>}
        </div>
      </div>

      {isPaid && (
        <div className="max-w-3xl mx-auto bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-4 print:hidden">
          <CheckCircle className="w-6 h-6" />
          <div><p className="font-bold">Contract Paid & Active</p></div>
        </div>
      )}

      {/* 📄 CONTRACT PAPER */}
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-xl min-h-[1000px] print:min-h-0 print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none relative font-sans print:font-serif">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 print:hidden"></div>

        <div className="border-b-2 border-black pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6 print:flex-row print:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2 leading-tight">{cleanTitle(doc.title)}</h1>
            <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold print:text-black">Statement of Work</p>
          </div>
          <div className="text-left sm:text-right print:text-right min-w-[200px]">
            <div className="bg-gray-100 px-4 py-2 rounded mb-2 inline-block print:bg-white print:border print:border-black">
              <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wide print:text-black">Total Value</span>
              <span className="text-xl font-bold">{formatMoney(doc.price)}{doc.payment_type === 'monthly' && <span className="text-sm font-medium"> / mo</span>}</span>
            </div>
            <p className="text-sm text-gray-700 print:text-black"><strong>Client:</strong> {doc.client_name}</p>
            <p className="text-sm text-gray-700 print:text-black"><strong>Date:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-line mb-12 print:text-black print:text-sm print:leading-normal">
          <h3 className="text-sm font-bold uppercase border-b border-gray-200 pb-2 mb-4 text-gray-400 print:text-black print:border-black">Deliverables & Scope</h3>
          {doc.deliverables}
        </div>

        {/* ✍️ SIGNATURE BLOCK - With Print Fix */}
        {/* 'break-inside-avoid' forces this entire block to stay on one page */}
        <div className="mt-12 pt-8 border-t-2 border-gray-100 print:border-black break-inside-avoid page-break-inside-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 print:grid-cols-2">
                <div className="relative">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-8 print:text-black">Client Signature</p>
                    <div className="border-b-2 border-black h-12 relative">
                        {doc.signed_by && <span style={cursive} className="absolute bottom-2 left-0 text-3xl text-blue-700 transform -rotate-2 print:text-black">{doc.signed_by}</span>}
                    </div>
                    <p className="mt-2 font-bold text-gray-900 print:text-black">{doc.client_name}</p>
                </div>
                <div className="relative">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-8 print:text-black">Provider Signature</p>
                    <div className="border-b-2 border-black h-12 relative">
                        {doc.provider_sign && <span style={cursive} className="absolute bottom-2 left-0 text-3xl text-indigo-700 transform -rotate-1 print:text-black">{doc.provider_sign}</span>}
                    </div>
                    <p className="mt-2 font-bold text-gray-900 print:text-black">Service Provider</p>
                </div>
            </div>
        </div>

        {/* PAYMENT & FOOTER */}
        <div className="mt-16 print:hidden">
            {isPaid ? (
                <button disabled className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-default"><CheckCircle className="w-5 h-5" /> Paid in Full</button>
            ) : isFullySigned ? (
                <PayContractButton sowId={doc.id} price={doc.price} paymentType={doc.payment_type} />
            ) : (
                <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200"><Lock className="w-4 h-4" /> Payment Locked (Awaiting Signatures)</button>
            )}
            <p className="text-center text-xs text-gray-400 mt-4 flex justify-center items-center gap-1"><Lock className="w-3 h-3" /> Secure Payment via Stripe</p>
        </div>
        
        <div className="mt-8 text-center print:hidden opacity-50 hover:opacity-100 transition-opacity">
          <Link href="/" className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-black">Generated via MicroFreelanceHub</Link>
        </div>
        <div className="hidden print:block fixed bottom-4 left-0 w-full text-center text-[8px] text-gray-400 uppercase tracking-widest">
            Secure Contract ID: {doc.id.slice(0, 8)} • MicroFreelanceHub
        </div>
      </div>

      {/* 📝 SIMPLIFIED SIGNING MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sign Contract</h2>
                <button onClick={() => setShowSignModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Signing As</p>
                <p className="font-bold text-gray-900 flex items-center gap-2">
                    {userRole === 'provider' ? <PenTool className="w-4 h-4 text-indigo-600"/> : <CheckCircle className="w-4 h-4 text-blue-600"/>}
                    {userRole === 'provider' ? 'Service Provider (You)' : `Client (${doc.client_name})`}
                </p>
            </div>
            
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type Full Legal Name</label>
            <input autoFocus type="text" placeholder="e.g. Jane Doe" className="w-full border-2 border-gray-200 p-3 rounded-lg mb-6 text-lg focus:border-black focus:outline-none" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            
            <div className="text-xs text-gray-500 mb-6 leading-relaxed">
                By clicking <strong>Agree & Sign</strong>, I agree to be legally bound by this contract and the <Link href="/terms" className="underline">Terms of Service</Link>.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSignModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-bold hover:bg-gray-200">Cancel</button>
              <button onClick={handleSign} disabled={isSigning || !signerName} className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50">{isSigning ? 'Signing...' : 'Agree & Sign'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}