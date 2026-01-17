'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function SOWPage({ params }: { params: { slug: string } }) {
  const [sow, setSow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSOW = async () => {
      // 👇 FIXED: Changed 'sows' to 'sow_documents'
      const { data, error } = await supabase
        .from('sow_documents')
        .select('*')
        .eq('id', params.slug)
        .single();

      if (error) {
        console.error('Error fetching SOW:', error);
      } else {
        setSow(data);
      }
      setLoading(false);
    };

    fetchSOW();
  }, [params.slug, supabase]);

  const handleSign = async () => {
    if (!signerName.trim()) return;
    setIsSigning(true);

    // 👇 FIXED: Changed 'sows' to 'sow_documents'
    const { error } = await supabase
      .from('sow_documents')
      .update({
        status: 'Signed',
        signed_name: signerName,
        signed_date: new Date().toISOString(),
      })
      .eq('id', params.slug);

    if (error) {
      alert('Error signing: ' + error.message);
      setIsSigning(false);
    } else {
      window.location.reload();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading contract...</div>;
  if (!sow) return <div className="p-8 text-center text-red-500">Contract not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Mobile-Friendly Container */}
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-slate-900 px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Scope of Work</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">{sow.title}</h1>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              sow.status === 'Signed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
            }`}>
              {sow.status}
            </div>
          </div>
        </div>

        {/* Contract Details */}
        <div className="p-6 sm:p-10 space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8 border-b border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Client Name</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{sow.client_name}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Project Price</label>
              <p className="text-lg font-medium text-gray-900 mt-1">${sow.price}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deliverables & Scope</label>
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {sow.deliverables}
            </div>
          </div>

          {/* Signature Area */}
          <div className="pt-6 border-t border-gray-100">
            {sow.status === 'Signed' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 text-green-800 font-bold text-lg mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Contract Signed
                </div>
                <p className="text-green-700">Signed by: <strong>{sow.signed_name}</strong></p>
                <p className="text-green-700 text-sm">Date: {new Date(sow.signed_date).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Accept & Sign</h3>
                <p className="text-sm text-gray-500 mb-4">
                  By typing your name below, you agree to the deliverables and price listed above.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Jane Doe"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    onClick={handleSign}
                    disabled={!signerName.trim() || isSigning}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                  >
                    {isSigning ? 'Signing...' : 'Sign Contract'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">Powered by MicroFreelanceHub</p>
      </div>
    </div>
  );
}