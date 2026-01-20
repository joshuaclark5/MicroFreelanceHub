import React from 'react';

export const metadata = {
  title: 'Terms of Service | MicroFreelanceHub',
  description: 'Terms and conditions for using MicroFreelanceHub.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Agreement to Terms</h2>
          <p>By accessing the website at https://www.microfreelancehub.com, you agree to be bound by these terms of service and all applicable laws and regulations.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on MicroFreelanceHub for personal, non-commercial transitory viewing only.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Disclaimer</h2>
          <p>The materials on MicroFreelanceHub are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties.</p>
        </section>
      </div>
    </div>
  );
}