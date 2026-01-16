
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: '',
    project_scope: '',
    timeline: '',
    total_amount: '',
    currency: 'USD',
    milestones: [{ due_date: '', amount: 0, status: 'due' }],
    email: ''
  });
  const [step, setStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const submit = async () => {
    const res = await fetch('/api/sow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    router.push('/sow/' + data.slug);
  };

  const steps = [
    <div key="client">
      <h2>Client Info</h2>
      <input name="client_name" onChange={update} placeholder="Client Name" className="border p-2 w-full" />
    </div>,
    <div key="scope">
      <h2>Project Scope</h2>
      <textarea name="project_scope" onChange={update} placeholder="Scope" className="border p-2 w-full" />
    </div>,
    <div key="timeline">
      <h2>Timeline</h2>
      <input name="timeline" onChange={update} placeholder="Timeline" className="border p-2 w-full" />
    </div>,
    <div key="payment">
      <h2>Payment</h2>
      <input name="total_amount" onChange={update} placeholder="Total Amount" className="border p-2 w-full" />
      <input name="currency" onChange={update} value="USD" className="border p-2 w-full mt-2" />
    </div>,
    <div key="review">
      <h2>Review</h2>
      <pre className="bg-gray-100 p-4">{JSON.stringify(form, null, 2)}</pre>
      <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 mt-4">Generate</button>
    </div>
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Create SOW</h1>
      {steps[step]}
      <div className="mt-4 space-x-2">
        {step > 0 && <button onClick={prev} className="px-4 py-2 border">Back</button>}
        {step < steps.length - 1 && <button onClick={next} className="px-4 py-2 bg-green-500 text-white">Next</button>}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="mb-2">Enter your email to generate your link</h2>
            <input name="email" onChange={update} placeholder="Email" className="border p-2 w-full mb-4" />
            <button onClick={submit} className="bg-blue-600 text-white px-4 py-2">Generate My Link</button>
          </div>
        </div>
      )}
    </div>
  );
}
