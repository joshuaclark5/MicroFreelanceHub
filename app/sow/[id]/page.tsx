'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signContract } from '../../actions/signSOW';
import { 
  ArrowLeft, CheckCircle, Lock, X, Share2, Download, Edit3, 
  MoreHorizontal, PenTool, AlertTriangle, Info, PieChart, 
  CreditCard, ChevronDown, ChevronUp, Receipt, UserCheck, Smartphone, FileSignature
} from 'lucide-react'; 
import PayContractButton from '../../components/PayContractButton';

// 1. Clean Cursive Font
const cursive = { fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive", fontStyle: 'italic' };

const cleanTitle = (title: string) => title ? title.replace(/\(Copy\)/gi, '').trim() : '';

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ViewContract({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false); 

  // Signing
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shareText, setShareText] = useState('Share');
  
  // KIOSK MODE STATE
  const [signingRole, setSigningRole] = useState<'provider' | 'client'>('client');

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
      
      // Smart Default: If owner, default sign role to Provider. Else Client.
      if (user && user.id === docData.user_id) {
          setSigningRole('provider');
      } else {
          setSigningRole('client');
      }
      
      setLoading(false);
    };
    load();
  }, [params.id, supabase, paymentStatus]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareText('Copied!');
    setTimeout(() => { setShareText('Share'); }, 1500);
  };

  const isOwner = currentUser?.id === doc?.user_id;
  const isFullySigned = doc?.signed_by && doc?.provider_sign;
  const isPaid = doc?.status === 'Paid' || paymentStatus === 'success';
  const isAgreementOnly = doc?.payment_type === 'none' || doc?.price === 0;

  // --- 💰 DYNAMIC PAYMENT CALCULATOR ---
  const getPaymentDetails = () => {
      if (!doc) return { amount: 0, label: 'Total' };
      
      // 🆕 Agreement Only Check
      if (isAgreementOnly) {
          return { amount: 0, label: 'Agreement Only' };
      }

      const sched = doc.payment_schedule_structured || {};
      if (isPaid) return { amount: 0, label: 'Paid in Full' };
      if (sched.type === 'split' && sched.depositAmount) {
          return { amount: sched.depositAmount, label: `Installment (1 of ${sched.splitCount || '?'})` };
      }
      if ((sched.type === '50' || sched.type === 'fixed') && sched.depositAmount) {
          return { amount: sched.depositAmount, label: 'Deposit Due' };
      }
      return { amount: doc.price, label: 'Total Due' };
  };

  const { amount: dueNow, label: dueLabel } = getPaymentDetails();

  const handleSign = async () => {
    if (!signerName) return alert("Please type your name.");
    setIsSigning(true);
    
    const result = await signContract(params.id, signerName, signingRole);
    
    if (result.success) {
      const newDoc = { ...doc };
      if (signingRole === 'client') { newDoc.status = 'Signed'; newDoc.signed_by = signerName; } 
      else { newDoc.provider_sign = signerName; }
      setDoc(newDoc);
      setShowSignModal(false);
      setSignerName(''); 
    } else { alert("Signing failed. Please try again."); }
    setIsSigning(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Contract...</div>;
  if (!doc) return <div className="min-h-screen flex items-center justify-center text-red-500">Contract not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:p-0 print:m-0">
      
      {/* 🖨️ HEADER */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden relative">
        <div className="w-full sm:w-auto flex justify-between sm:justify-start items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-black font-semibold text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            
            {/* VISIBLE SHARE BUTTON */}
            <button onClick={handleShare} className="sm:hidden text-sm font-bold text-gray-600 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <Share2 className="w-4 h-4" /> {shareText}
            </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Desktop Share */}
            <button onClick={handleShare} className="hidden sm:flex text-sm font-bold text-gray-600 items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                <Share2 className="w-4 h-4" /> {shareText}
            </button>

            {/* Sign / Download Actions */}
            {!isFullySigned && !isPaid ? (
                <button 
                onClick={() => setShowSignModal(true)}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 shadow-lg transition-all flex items-center justify-center gap-2"
                >
                <PenTool className="w-4 h-4" /> Sign Contract
                </button>
            ) : (
                <button onClick={() => window.print()} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download PDF
                </button>
            )}

            {/* More Menu */}
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
                </div>
                )}
                {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>}
            </div>
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
            {isAgreementOnly ? (
                // 🆕 AGREEMENT ONLY BADGE
                <div className="bg-gray-100 px-4 py-2 rounded mb-2 inline-block print:bg-white print:border print:border-black">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wide print:text-black">Document Type</span>
                    <span className="text-sm font-bold">Standard Agreement</span>
                </div>
            ) : (
                <div className="bg-gray-100 px-4 py-2 rounded mb-2 inline-block print:bg-white print:border print:border-black">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wide print:text-black">{dueLabel}</span>
                    <span className="text-xl font-bold">{formatMoney(dueNow)}</span>
                </div>
            )}
            
            {/* Show Total if Split */}
            {!isAgreementOnly && dueNow !== doc.price && !isPaid && (
                 <p className="text-xs text-gray-400 mt-1">Total Contract: {formatMoney(doc.price)}</p>
            )}
            <p className="text-sm text-gray-700 print:text-black"><strong>Client:</strong> {doc.client_name}</p>
            <p className="text-sm text-gray-700 print:text-black"><strong>Date:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-line mb-12 print:text-black print:text-sm print:leading-normal">
          <h3 className="text-sm font-bold uppercase border-b border-gray-200 pb-2 mb-4 text-gray-400 print:text-black print:border-black">Deliverables & Scope</h3>
          {doc.deliverables}
        </div>

        {/* ✍️ SIGNATURE BLOCK */}
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

        {/* 🧾 INVOICE ACCORDION (Hide if Agreement Only) */}
        {!isAgreementOnly && doc.line_items && doc.line_items.length > 0 && (
            <div className="mt-16 print:hidden">
                <button 
                    onClick={() => setShowInvoice(!showInvoice)}
                    className="w-full flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Receipt className="w-5 h-5" /></div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Invoice Details</p>
                            <p className="text-xs text-gray-500">{doc.line_items.length} items • {formatMoney(doc.price)} Total</p>
                        </div>
                    </div>
                    {showInvoice ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {showInvoice && (
                    <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 p-4 animate-in slide-in-from-top-2">
                        <div className="space-y-3">
                            {doc.line_items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-600 flex-1">{item.description} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                                    <span className="font-medium text-gray-900">{formatMoney(item.amount * item.quantity)}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-3">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-lg text-gray-900">{formatMoney(doc.price)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* PAYMENT & FOOTER */}
        <div className="mt-4 print:hidden">
            {/* 🆕 AGREEMENT ONLY VIEW */}
            {isAgreementOnly ? (
                <div className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-gray-200">
                    <FileSignature className="w-5 h-5" /> 
                    {isFullySigned ? 'Legally Binding & Active' : 'Waiting for Signatures'}
                </div>
            ) : (
                <>
                    {isPaid ? (
                        <button disabled className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-default"><CheckCircle className="w-5 h-5" /> Paid in Full</button>
                    ) : isFullySigned ? (
                        <PayContractButton sowId={doc.id} price={dueNow} paymentType={doc.payment_type} label={dueLabel === 'Total Due' ? 'Pay Full Amount' : `Pay ${dueLabel}`} />
                    ) : (
                        <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-3 border border-gray-200">
                        <Lock className="w-4 h-4" /> 
                        Payment Locked (Awaiting Signatures)
                        </button>
                    )}
                    
                    <div className="text-center mt-4 space-y-2">
                        <p className="text-xs text-gray-400 flex justify-center items-center gap-1">
                        <Lock className="w-3 h-3" /> Secure Payment via Stripe Connect
                        </p>
                        {doc.payment_type === 'monthly' && (
                            <p className="text-[10px] text-gray-400 max-w-md mx-auto">
                                <strong>Billing Info:</strong> This subscription is managed directly between you and the Service Provider. To cancel or modify billing, check your email receipt for a management link or contact {isOwner ? 'the Client' : 'the Service Provider'} directly.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
        
        <div className="mt-8 text-center print:hidden opacity-50 hover:opacity-100 transition-opacity">
          <Link href="/" className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-black">Generated via MicroFreelanceHub</Link>
        </div>
        <div className="hidden print:block fixed bottom-4 left-0 w-full text-center text-[8px] text-gray-400 uppercase tracking-widest">
            Secure Contract ID: {doc.id.slice(0, 8)} • MicroFreelanceHub
        </div>
      </div>

      {/* 📝 KIOSK MODE SIGNING MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sign Contract</h2>
                <button onClick={() => setShowSignModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            {/* ROLE TOGGLE */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                    onClick={() => setSigningRole('provider')}
                    disabled={!!doc.provider_sign} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${signingRole === 'provider' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'} ${doc.provider_sign ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {doc.provider_sign && <CheckCircle className="w-3 h-3 text-green-500" />} Provider
                </button>
                <button 
                    onClick={() => setSigningRole('client')}
                    disabled={!!doc.signed_by} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${signingRole === 'client' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'} ${doc.signed_by ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {doc.signed_by && <CheckCircle className="w-3 h-3 text-green-500" />} Client
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Signing As</p>
                <p className="font-bold text-gray-900 flex items-center gap-2">
                    {signingRole === 'provider' ? <PenTool className="w-4 h-4 text-indigo-600"/> : <UserCheck className="w-4 h-4 text-blue-600"/>}
                    {signingRole === 'provider' ? 'Service Provider (You)' : `Client (${doc.client_name})`}
                </p>
                {signingRole === 'client' && isOwner && (
                    <div className="mt-2 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> Hand device to client
                    </div>
                )}
            </div>

            {signingRole === 'client' && !isAgreementOnly && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-800">Financial Responsibility</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-snug">
                        By signing, you acknowledge a direct financial agreement with the Service Provider.
                    </p>
                </div>
            )}
            
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type Full Legal Name</label>
            <input autoFocus type="text" placeholder="e.g. Jane Doe" className="w-full border-2 border-gray-200 p-3 rounded-lg mb-6 text-lg focus:border-black focus:outline-none" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            
            <div className="text-xs text-gray-500 mb-6 leading-relaxed">
                By clicking <strong>Agree & Sign</strong>, I agree to be legally bound by this contract.
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