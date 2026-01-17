'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SOWPage({ params }: { params: { slug: string } }) {
  const [sow, setSow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  // 👇 Updated text as requested
  const [copyMsg, setCopyMsg] = useState('🔗 Copy Link for Client');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSOW = async () => {
      const { data, error } = await supabase
        .from('sow_documents')
        .select('*')
        .eq('id', params.slug)
        .single();

      if (error) console.error('Error fetching SOW:', error);
      else setSow(data);
      setLoading(false);
    };
    fetchSOW();
  }, [params.slug, supabase]);

  const handleSign = async () => {
    if (!signerName.trim()) return;
    setIsSigning(true);
    const { error } = await supabase
      .from('sow_documents')
      .update({
        status: 'Signed',
        signed_name: signerName,
        signed_date: new Date().toISOString(),
      })
      .eq('id', params.slug);

    if (error) alert('Error signing: ' + error.message);
    else window.location.reload();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyMsg('Copied! ✅');
    // Revert message after 2 seconds
    setTimeout(() => setCopyMsg('🔗 Copy Link for Client'), 2000);
  };

  const handleDownload = () => {
    window.print(); // 🖨️ Opens the native "Save as PDF" dialog
  };

  if (loading) return <div className="p-8 text-center">Loading contract...</div>;
  if (!sow) return <div className="p-8 text-center text-red-500">Contract not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      
      {/* 🧼 CLEAN HEADER (Hidden when printing PDF) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex justify-between items-center print:hidden">
        <h1 className="font-bold text-gray-900 truncate pr-4 text-sm sm:text-base">MicroFreelanceHub</h1>
        
        <div className="flex gap-2">
          {/* PDF BUTTON */}
          <button 
            onClick={handleDownload}
            className="bg-white border border-gray-300 text-gray-700 text-xs px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Download PDF
          </button>

          {/* SHARE BUTTON */}
          <button 
            onClick={handleShare}
            className="bg-black text-white text-xs px-3 py-2 rounded-lg font-medium shadow-sm active:scale-95 transition-all"
          >
            {copyMsg}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
        {/* Contract Card */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 print:shadow-none print:border-none">
          
          {/* Contract Header */}
          <div className="bg-slate-900 px-6 py-8 text-white print:bg-white print:text-black print:border-b print:border-black print:px-0">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold print:text-gray-500">Scope of Work</p>
                <h1 className="text-2xl font-bold mt-1">{sow.title}</h1>
              </div>
              
              {/* Status Badge (Visible on screen, clean text on PDF) */}
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide print:border print:border-black print:text-black print:bg-transparent ${
                sow.status === 'Signed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
              }`}>
                {sow.status}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6 print:px-0">
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100 print:border-black">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase print:text-black">Client</label>
                <p className="text-lg font-medium text-gray-900">{sow.client_name}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase print:text-black">Price</label>
                <p className="text-lg font-medium text-gray-900">${sow.price?.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 print:text-black">Deliverables</label>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap print:bg-transparent print:border-none print:p-0 print:text-black">
                {sow.deliverables}
              </div>
            </div>

            {/* Signature Section */}
            <div className="pt-4 border-t border-gray-100 print:border-black print:mt-8">
              {sow.status === 'Signed' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 print:bg-transparent print:border-none print:p-0">
                  <div className="flex items-center gap-2 text-green-800 font-bold mb-1 print:text-black">
                    <span className="text-xl print:hidden">✓</span> Contract Signed
                  </div>
                  <p className="text-green-700 text-sm print:text-black">By: <strong>{sow.signed_name}</strong></p>
                  <p className="text-green-700 text-xs opacity-75 print:text-black">Date: {new Date(sow.signed_date).toLocaleDateString()}</p>
                  
                  {/* Download Button (Only shows after signing, hidden on PDF) */}
                  <button 
                    onClick={handleDownload}
                    className="mt-4 w-full bg-white border border-green-200 text-green-700 text-sm font-bold py-2 rounded shadow-sm hover:bg-green-50 print:hidden"
                  >
                    Download Signed PDF ⬇️
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 print:hidden">
                  <p className="text-sm text-gray-500 mb-3">Type your name to sign:</p>
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                  <button 
                    onClick={handleSign}
                    disabled={!signerName.trim() || isSigning}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSigning ? 'Signing...' : 'Sign Agreement'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}