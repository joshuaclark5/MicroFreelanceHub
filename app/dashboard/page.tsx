'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function Dashboard() {
  const [sows, setSows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 🍔 State for Hamburger
  const supabase = createClientComponentClient();

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sow_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Error:', error);
      else setSows(data || []);
      
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const { error } = await supabase.from('sow_documents').delete().eq('id', id);
    if (!error) setSows(sows.filter((s) => s.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* 🍔 HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">MicroFreelance</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Dashboard</p>
          </div>

          {/* Desktop Nav (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/create">
              <button className="bg-black text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
                + New Project
              </button>
            </Link>
            <form action="/auth/signout" method="post">
               <button className="text-sm text-gray-600 border px-3 py-2 rounded-lg hover:bg-gray-50">
                 Log Out
               </button>
            </form>
          </div>

          {/* 🍔 Mobile Hamburger Button (Visible only on Mobile) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 text-gray-600 focus:outline-none"
          >
            {isMenuOpen ? (
              // X Icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              // Hamburger Icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* 🍔 Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl py-4 px-4 flex flex-col gap-3 animation-slide-down">
            <Link href="/create" onClick={() => setIsMenuOpen(false)}>
              <button className="w-full bg-black text-white py-3 rounded-lg font-bold text-center">
                + New Project
              </button>
            </Link>
            <form action="/auth/signout" method="post">
               <button className="w-full text-gray-600 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50">
                 Log Out
               </button>
            </form>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active</p>
            <p className="text-3xl font-bold text-gray-900">{sows.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pipeline</p>
            <p className="text-3xl font-bold text-green-600">
              ${sows.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Your Projects</h2>
          
          <div className="space-y-4">
            {sows.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No projects yet.</p>
                <p className="text-sm text-gray-400 mt-1">Tap "+ New Project" to start.</p>
              </div>
            ) : (
              sows.map((sow) => (
                <div key={sow.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg truncate pr-2">{sow.client_name}</h3>
                    <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                      sow.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sow.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3 truncate">{sow.title}</p>
                  <p className="text-xl font-bold text-gray-900 mb-4">
                    ${sow.price?.toLocaleString()}
                  </p>

                  <div className="grid grid-cols-3 gap-2 border-t pt-3">
                    <Link href={`/sow/${sow.id}`} className="text-center py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                      View
                    </Link>
                    <Link href={`/edit/${sow.id}`} className="text-center py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(sow.id)}
                      className="text-center py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg"
                    >
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