'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit2, Copy, Trash2, X, CheckSquare } from 'lucide-react';

// 👇 UPDATED BUTTON: Now accepts userId to track the payment securely
function UpgradeButton({ userId }: { userId: string }) {
  const handleUpgrade = () => {
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
  const [userId, setUserId] = useState('');
  
  // 🆕 STATE FOR UI MODES
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // Tracks which dropdown is open
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Close dropdown if clicking outside
  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login'); 
          return;
        }
        setUserEmail(user.email || '');
        setUserId(user.id); 

        // Check for pending template clone
        const pendingTemplateSlug = localStorage.getItem('pending_template');
        if (pendingTemplateSlug) {
          const { data: template } = await supabase
            .from('sow_documents')
            // @ts-ignore
            .eq('slug', pendingTemplateSlug)
            .single();

          if (template) {
            const { data: newProject, error } = await supabase
              .from('sow_documents')
              .insert({
                user_id: user.id,
                title: template.title,
                client_name: '[Your Client Name]',
                price: template.price,
                deliverables: template.deliverables,
                status: 'Draft',
                slug: null 
              })
              .select()
              .single();

            if (!error && newProject) {
              localStorage.removeItem('pending_template');
              router.push(`/sow/${newProject.id}`); 
              return; 
            }
          }
        }

        // Fetch Projects
        const { data: sowData } = await supabase
          .from('sow_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sowData) setSows(sowData);

        // Fetch Pro Status
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

  // 🗑️ SINGLE ACTIONS (From Dropdown)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await supabase.from('sow_documents').delete().eq('id', id);
    if (!error) {
      setSows(sows.filter((s) => s.id !== id));
    }
  };

  const handleDuplicate = async (sow: any) => {
    setProcessing(true);
    const { data: newDoc, error } = await supabase
        .from('sow_documents')
        .insert({
          user_id: userId,
          title: `${sow.title} (Copy)`,
          client_name: sow.client_name,
          price: sow.price,
          deliverables: sow.deliverables,
          status: 'Draft',
          slug: null 
        })
        .select()
        .single();

    if (!error && newDoc) {
      setSows([newDoc, ...sows]);
    }
    setProcessing(false);
  };

  // 🗑️ BULK DELETE
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} projects?`)) return;
    
    setProcessing(true);
    const { error } = await supabase
      .from('sow_documents')
      .delete()
      .in('id', selectedIds);

    if (!error) {
      setSows(sows.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]); 
      setSelectionMode(false);
    }
    setProcessing(false);
  };

  // 👯 BULK DUPLICATE
  const handleBulkDuplicate = async () => {
    setProcessing(true);
    const { data: originals } = await supabase
      .from('sow_documents')
      .select('*')
      .in('id', selectedIds);

    if (originals && originals.length > 0) {
      const copies = originals.map(doc => ({
        user_id: userId,
        title: `${doc.title} (Copy)`,
        client_name: doc.client_name,
        price: doc.price,
        deliverables: doc.deliverables,
        status: 'Draft',
        slug: null 
      }));

      const { data: newDocs, error } = await supabase
        .from('sow_documents')
        .insert(copies)
        .select();

      if (!error && newDocs) {
        setSows([...newDocs, ...sows]);
        setSelectedIds([]);
        setSelectionMode(false);
      }
    }
    setProcessing(false);
  };

  // ☑️ TOGGLE SELECTION
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // ☑️ SELECT ALL
  const toggleSelectAll = () => {
    if (selectedIds.length === sows.length) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(sows.map((s) => s.id)); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative">
      
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

        {/* PROJECTS LIST HEADER */}
        <div className="flex items-center justify-between mb-4 px-1 min-h-[32px]">
          <h2 className="text-xl font-bold text-gray-900">Your Projects</h2>
          
          {/* SELECTION TOGGLE */}
          {sows.length > 0 && (
            selectionMode ? (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-2">
                 <button onClick={() => setSelectionMode(false)} className="text-sm font-bold text-gray-500 hover:text-gray-800">
                    Cancel
                 </button>
                 <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      onChange={toggleSelectAll}
                      checked={sows.length > 0 && selectedIds.length === sows.length}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 font-medium">Select All</span>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => setSelectionMode(true)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <CheckSquare className="w-4 h-4" /> Select Multiple
              </button>
            )
          )}
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {sows.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">No projects yet.</p>
              <p className="text-sm text-gray-400 mt-2">Tap "+ New Project" to create your first contract.</p>
            </div>
          ) : (
            sows.map((sow) => (
                <div 
                  key={sow.id} 
                  className={`bg-white p-6 rounded-2xl border shadow-sm transition-all group relative ${
                    selectedIds.includes(sow.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* TOP RIGHT ACTION AREA */}
                  <div className="absolute top-6 right-6 z-10">
                    {selectionMode ? (
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(sow.id)}
                        onChange={() => toggleSelect(sow.id)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setOpenMenuId(openMenuId === sow.id ? null : sow.id);
                          }}
                          className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* 🔽 DROPDOWN MENU */}
                        {openMenuId === sow.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                             <button 
                                onClick={() => router.push(`/edit/${sow.id}`)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                             >
                                <Edit2 className="w-4 h-4" /> Edit Project
                             </button>
                             <button 
                                onClick={() => handleDuplicate(sow)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                             >
                                <Copy className="w-4 h-4" /> Duplicate
                             </button>
                             <div className="h-px bg-gray-100 my-1"></div>
                             <button 
                                onClick={() => handleDelete(sow.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                             >
                                <Trash2 className="w-4 h-4" /> Delete
                             </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* MAIN CARD CONTENT */}
                  <div className="flex justify-between items-start mb-2 pr-10">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{sow.client_name || 'Untitled Client'}</h3>
                      <p className="text-sm text-gray-500 font-medium mt-1">{sow.title || 'Untitled Project'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6 mt-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      sow.status === 'Signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sow.status}
                    </span>
                    <p className="text-lg font-bold text-gray-900">${sow.price?.toLocaleString()}</p>
                  </div>
                  
                  {/* MAIN ACTION BUTTON */}
                  <div className="pt-4 border-t border-gray-50">
                    <Link href={`/sow/${sow.id}`} className="block text-center text-blue-600 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-xl transition-colors">
                      View / Share Contract
                    </Link>
                  </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* 🚀 FLOATING BULK ACTION BAR */}
      {selectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
          <span className="font-bold text-sm pl-2">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-gray-700"></div>
          
          <button 
            onClick={handleBulkDuplicate}
            disabled={processing}
            className="text-indigo-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>{processing ? '...' : 'Duplicate'}</span>
          </button>

          <button 
            onClick={handleBulkDelete}
            disabled={processing}
            className="text-red-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}