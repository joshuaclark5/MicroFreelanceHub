'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function Dashboard() {
  const [sows, setSows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('sow_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error:', error);
      else setSows(data || []);
      
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOW? This cannot be undone.')) return;

    const { error } = await supabase
      .from('sow_documents')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      setSows(sows.filter((sow) => sow.id !== id));
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 📱 Mobile Header (Stacked) */}
      <div className="bg-white border-b border-gray-200 p-5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your projects</p>
          </div>
          <Link href="/create">
            <button className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all shadow-md">
              + New SOW
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-5 space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase">Active</p>
            <p className="text-2xl font-bold text-gray-900">{sows.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase">Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${sows.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Projects</h2>
          
          <div className="space-y-4">
            {sows.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No projects yet.</p>
              </div>
            ) : (
              sows.map((sow) => (
                // 🃏 Project Card (Replaces Table)
                <div key={sow.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{sow.client_name || 'Untitled Client'}</h3>
                      <p className="text-sm text-gray-500">{sow.title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      sow.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sow.status}
                    </span>
                  </div>

                  <div className="text-lg font-medium text-gray-900 mb-4">
                    ${sow.price?.toLocaleString()}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 border-t pt-4 mt-2">
                    {/* VIEW BUTTON */}
                    <Link href={`/sow/${sow.id}`} className="text-center py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                      View
                    </Link>

                    {/* EDIT BUTTON */}
                    <Link href={`/edit/${sow.id}`} className="text-center py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100">
                      Edit
                    </Link>

                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => handleDelete(sow.id)}
                      className="text-center py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
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