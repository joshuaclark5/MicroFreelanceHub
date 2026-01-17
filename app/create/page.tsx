'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: '',
    project_scope: '',
    timeline: '',
    total_amount: '',
    currency: 'USD',
    milestones: [{ due_date: '', amount: '', status: 'due' }],
    email: ''
  });

  const [step, setStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...form.milestones];
    (updated[index] as any)[field] = value;
    setForm((prev) => ({ ...prev, milestones: updated }));
  };

  const addMilestone = () => {
    setForm((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { due_date: '', amount: '', status: 'due' }]
    }));
  };

  const removeMilestone = (index: number) => {
    const updated = [...form.milestones];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, milestones: updated }));
  };

  const submit = async () => {
    if (!form.email) {
      alert('Please enter your email before continuing.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form), 
      });

      const data = await res.json();

      if (!res.ok || !data.slug) {
        throw new Error(data.error || 'Unexpected error');
      }

      router.push('/sow/' + data.slug);
    } catch (err: any) {
      console.error('❌ Submission error:', err);
      alert('Failed to create SOW: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- STEPS UI ---
  const steps = [
    // Step 1: Client
    <div key="client" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Who is this for?</label>
        <input 
          name="client_name" 
          onChange={update} 
          value={form.client_name}
          placeholder="e.g. Acme Corp" 
          className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
        />
      </div>
    </div>,

    // Step 2: Scope
    <div key="scope" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What are you building?</label>
        <textarea 
          name="project_scope" 
          onChange={update} 
          value={form.project_scope}
          placeholder="Describe the deliverables..." 
          rows={6}
          className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
        />
      </div>
    </div>,

    // Step 3: Timeline
    <div key="timeline" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">How long will it take?</label>
        <input 
          name="timeline" 
          onChange={update} 
          value={form.timeline}
          placeholder="e.g. 2 weeks" 
          className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
        />
      </div>
    </div>,

    // Step 4: Payment
    <div key="payment" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Project Value</label>
        <div className="flex gap-2">
           <input 
            name="total_amount" 
            type="number"
            onChange={update} 
            value={form.total_amount}
            placeholder="0.00" 
            className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          />
          <input 
            name="currency" 
            value={form.currency} 
            onChange={update} 
            className="w-24 rounded-md border border-gray-300 p-3 text-center bg-gray-50 font-medium" 
          />
        </div>
      </div>
    </div>,

    // Step 5: Milestones
    <div key="milestones" className="space-y-4">
       <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">Payment Schedule</label>
        <button onClick={addMilestone} className="text-sm text-blue-600 font-medium hover:underline">
          + Add another payment
        </button>
      </div>
      
      {form.milestones.map((m, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            placeholder="Due Date"
            className="flex-1 rounded-md border border-gray-300 p-2 text-sm"
            value={m.due_date}
            onChange={(e) => updateMilestone(i, 'due_date', e.target.value)}
          />
          <input
            placeholder="Amount"
            className="flex-1 rounded-md border border-gray-300 p-2 text-sm"
            value={m.amount}
            onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
          />
          <button onClick={() => removeMilestone(i)} className="p-2 text-gray-400 hover:text-red-500">
            ✕
          </button>
        </div>
      ))}
    </div>,

    // Step 6: Review (THE NEW PRO VERSION)
    <div key="review" className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">Confirm Details</h3>
        
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Client Name</dt>
            <dd className="mt-1 text-sm text-gray-900 font-semibold">{form.client_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Value</dt>
            <dd className="mt-1 text-sm text-green-600 font-bold">
              ${Number(form.total_amount).toLocaleString()} {form.currency}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Project Scope</dt>
            <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-100">
              {form.project_scope}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Timeline</dt>
            <dd className="mt-1 text-sm text-gray-900">{form.timeline}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {form.milestones?.length} Milestone(s)
            </dd>
          </div>
        </dl>
      </div>

      <button 
        onClick={() => setShowModal(true)} 
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-all"
      >
        Looks Good - Generate SOW
      </button>
    </div>
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Create New SOW</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            Cancel
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          {steps[step]}

          {/* Navigation Buttons (Only show on non-review steps) */}
          {step < steps.length - 1 && (
            <div className="mt-8 flex justify-between gap-4">
               <button 
                onClick={() => setStep(step - 1)} 
                disabled={step === 0}
                className={`flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${step === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Back
              </button>
              <button 
                onClick={() => setStep(step + 1)} 
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Next
              </button>
            </div>
          )}
           {/* Back Button on Review Step */}
           {step === steps.length - 1 && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setStep(step - 1)} 
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Go Back and Edit
              </button>
            </div>
           )}
        </div>

      </div>

      {/* Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold mb-2">Final Step</h2>
            <p className="text-gray-500 mb-4 text-sm">Where should we send the confirmation?</p>
            <input
              name="email"
              value={form.email}
              onChange={update}
              placeholder="Enter your email"
              className="w-full border rounded-md p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              disabled={submitting}
              onClick={submit}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition-colors"
            >
              {submitting ? 'Generating Document...' : 'Create SOW'}
            </button>
             <button
              onClick={() => setShowModal(false)}
              className="w-full mt-2 text-gray-400 text-sm hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}