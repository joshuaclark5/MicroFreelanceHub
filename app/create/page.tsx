'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function CreateSOW() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    title: '',
    price: '',
    deliverables: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in');
      return;
    }

    // 2. Insert into the CORRECT table (sow_documents)
    const { error } = await supabase
      .from('sow_documents')
      .insert({
        user_id: user.id, // IMPORTANT: Link SOW to the user
        client_name: formData.client_name,
        title: formData.title,
        price: Number(formData.price),
        deliverables: formData.deliverables,
        status: 'Draft'
      });

    if (error) {
      alert('Error creating SOW: ' + error.message);
      setLoading(false);
    } else {
      // Success! Go to dashboard
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name</label>
            <input
              required
              placeholder="e.g. Acme Corp"
              className="w-full border p-3 rounded-lg"
              value={formData.client_name}
              onChange={(e) => setFormData({...formData, client_name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project Title</label>
            <input
              required
              placeholder="e.g. Website Redesign"
              className="w-full border p-3 rounded-lg"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input
              required
              type="number"
              placeholder="1000"
              className="w-full border p-3 rounded-lg"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deliverables</label>
            <textarea
              required
              placeholder="List what you will do..."
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}