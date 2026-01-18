'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 👇 UPDATED BUTTON: Now accepts userId to track the payment securely
function UpgradeButton({ userId }: { userId: string }) {
  const handleUpgrade = () => {
    // We attach the userId so Stripe knows exactly who is paying, even if emails don't match
    window.location.href = `https://buy.stripe.com/00wbIVa99ais1Ue5RY48002?client_reference_id=${userId}`;
  };

  return (
    <button 
      onClick={handleUpgrade} 
      className="bg-black text-white hover:bg-gray-800 border border-gray-700 px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
    >
      <span>💎 Upgrade to Pro ($19/mo)</span>
    </button>
  );
}

export default function Dashboard() {
  const [sows, setSows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(''); // Store the ID
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login'); 
          return;
        }
        setUserEmail(user.email || '');
        setUserId(user.id); // Save ID for the button

        // 🔍 RECOVERY LOGIC
        const pendingSOW = localStorage.getItem('pendingSOW');
        if (pendingSOW) {
          try {
            const parsedData = JSON.parse(pendingSOW);
            const { error: insertError } = await supabase.from('sow_documents').insert({
              user_id: user.id,
              client_name: parsedData.client_name,
              title: parsedData.title,
              price: parsedData.price,
              deliverables: parsedData.deliverables,
              status: 'Draft'
            });
            
            if (!insertError) {
              console.log("✅ Recovered unsaved work!");
              localStorage.removeItem('pendingSOW'); 
            }
          } catch (e) {
            console.error("Failed to recover data", e);
          }
        }

        // 1. Fetch Projects
        const { data: sowData } = await supabase
          .from('sow_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sowData) setSows(sowData);

        // 2. Fetch Pro Status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .single();
        
        if (profile) setIsPro(profile.is_pro || false);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await supabase.from('sow_documents').delete().eq('id', id);
    if (!error) setSows(sows.filter((s) => s.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
             <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl">M</div>
             <div>
                <h1 className="text-lg font-bold text-gray-900 leading-none">MicroFreelance</h1>
                <p className="text-xs text-gray-500">{userEmail}</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-wide px-3"
            >
              Sign Out
            </button>

            {!isPro ? (
              // Pass the userId to the smart button
              <UpgradeButton userId={userId} />
            ) : (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm">
                💎 PRO MEMBER
              </span>
            )}

            <Link href="/create">
              <button className="bg-black text-white text-sm px-5 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-sm hover:scale-105 transform">
                + New Project
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto p-4 space-y-8 mt-4">
        
        {isPro && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-1">AI Power Unlocked 🚀</h3>
              <p className="text-indigo-100 text-sm">You can now use the AI Drafter & Refiner.</p>
            </div>
            <div className="text-4xl relative z-10">✨</div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Projects</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{sows.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pipeline Value</p>
            <p className="text-4xl font-bold text-emerald-600 mt-2">
              ${sows.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* PROJECTS LIST */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 px-1">Your Projects</h2>
          <div className="space-y-4">
            {sows.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No projects yet.</p>
                <p className="text-sm text-gray-400 mt-2">Tap "+ New Project" to create your first contract.</p>
              </div>
            ) : (
              sows.map((sow) => (
                  <div key={sow.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{sow.client_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        sow.status === 'Signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {sow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 font-medium">{sow.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-6">${sow.price?.toLocaleString()}</p>
                    
                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                      <Link href={`/sow/${sow.id}`} className="flex-1 text-center text-blue-600 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                        View / Share
                      </Link>
                      <Link href={`/edit/${sow.id}`} className="text-gray-700 text-sm font-bold bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(sow.id)} className="text-red-600 text-sm font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}