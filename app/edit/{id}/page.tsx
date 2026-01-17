'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function EditPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    client_name: '',
    title: '',
    price: '',
    deliverables: ''
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from('sow_documents')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) {
        setFormData({
          client_name: data.client_name || '',
          title: data.title || '',
          price: data.price || '',
          deliverables: data.deliverables || ''
        });
      }
      setLoading(false);
    };
    loadData();
  }, [params.id, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('sow_documents')
      .update({
        ...formData,
        price: Number(formData.price) // Ensure price is a number
      })
      .eq('id', params.id);

    if (error) {
      alert('Error updating: ' + error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">Edit Contract</h1>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name</label>
            <input
              className="w-full border p-3 rounded-lg"
              value={formData.client_name}
              onChange={(e) => setFormData({...formData, client_name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project Title</label>
            <input
              className="w-full border p-3 rounded-lg"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input
              type="number"
              className="w-full border p-3 rounded-lg"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deliverables</label>
            <textarea
              className="w-full border p-3 rounded-lg h-32"
              value={formData.deliverables}
              onChange={(e) => setFormData({...formData, deliverables: e.target.value})}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-black text-white py-3 rounded-lg font-bold"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}