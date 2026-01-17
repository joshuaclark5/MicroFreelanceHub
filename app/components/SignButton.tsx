'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 👇 We add a new prop here called 'initialStatus'
export default function SignButton({ sowId, initialStatus }: { sowId: string, initialStatus: string }) {
  // 👇 We initialize state based on the Database, not just 'false'
  const [signed, setSigned] = useState(initialStatus === 'Signed');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClientComponentClient();

  const handleSign = async () => {
    setLoading(true);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });

    try {
      const { error } = await supabase
        .from('sow_documents')
        .update({ 
            status: 'Signed'
        })
        .eq('id', sowId);

      if (error) throw error;

      setSigned(true);
    } catch (err) {
      console.error('Error signing:', err);
      alert('Failed to sign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return (
      <div className="text-center animate-fade-in border-2 border-green-500 rounded-lg p-4 bg-green-50">
        <p className="text-2xl font-handwriting text-green-700 mb-2" style={{ fontFamily: 'cursive' }}>
          Digitally Signed
        </p>
        <p className="text-xs text-green-600">
          Verified Status
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleSign}
      disabled={loading}
      className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg shadow-lg transition-all transform hover:-translate-y-1 ${
        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
      }`}
    >
      {loading ? 'Verifying...' : 'Tap to Sign Contract'}
    </button>
  );
}