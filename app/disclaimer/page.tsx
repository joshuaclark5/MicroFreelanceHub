import React from 'react';
import Link from 'next/link';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-6">Legal Disclaimer</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <p className="font-bold text-yellow-800">Crucial Notice: We are not lawyers.</p>
        </div>
        
        <div className="prose text-gray-700 space-y-6">
          <p>The information provided on MicroFreelanceHub (the "Site") is for general informational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.</p>
          
          <h3 className="text-xl font-bold text-black">Not Legal Advice</h3>
          <p>The Site cannot and does not contain legal advice. The legal information is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals.</p>
          
          <h3 className="text-xl font-bold text-black">Use at Your Own Risk</h3>
          <p>Your use of the Site and your reliance on any information on the Site is solely at your own risk.</p>
        </div>

        <div className="mt-10 pt-10 border-t">
            <Link href="/" className="text-indigo-600 font-bold hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}