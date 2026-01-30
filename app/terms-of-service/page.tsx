import React from 'react';

export const metadata = {
  title: 'Terms of Service | MicroFreelanceHub',
  description: 'Terms and conditions for using MicroFreelanceHub.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 bg-white min-h-screen">
      <div className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-gray-700 leading-relaxed">
        
        {/* 1. AGREEMENT */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing and using MicroFreelanceHub (the "Platform"), you agree to be bound by these Terms of Service. 
            If you do not agree with any part of these terms, you are prohibited from using this Platform.
          </p>
        </section>

        {/* 2. NATURE OF PLATFORM */}
        <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h2 className="text-xl font-bold text-blue-900 mb-3">2. Platform Nature & Relationship</h2>
          <p className="mb-4 font-medium">
            MicroFreelanceHub acts solely as a technology provider facilitating document creation and payment processing.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
            <li><strong>We are not a party to your contracts:</strong> Any Statement of Work (SOW), agreement, or contract created on this Platform is strictly between the Freelancer (Provider) and the Client (Customer).</li>
            <li><strong>No Agency:</strong> We do not employ, hire, or represent freelancers. We do not guarantee the quality of work, timeline, or completion of any project.</li>
            <li><strong>No Guarantee of Payment:</strong> We do not guarantee that a Client will pay for services rendered. The Freelancer assumes all risk regarding non-payment.</li>
          </ul>
        </section>

        {/* 3. FEES */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Fees & Payments</h2>
          <p className="mb-4">
            By using the payment features on MicroFreelanceHub, you acknowledge and agree to the following:
          </p>
          <div className="p-4 bg-gray-50 border-l-4 border-indigo-500">
            <h3 className="font-bold text-gray-900">Transaction Fees</h3>
            <p className="mt-1">
              A processing fee of <span className="font-bold text-black">3.9% + $0.30</span> is applied to all transactions processed through the Platform. This fee is deducted automatically at the time of payment.
            </p>
          </div>
          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li><strong>Non-Refundable Fees:</strong> The 3.9% platform fee is non-refundable, even if the project is cancelled or the principal amount is refunded to the Client.</li>
            <li><strong>Stripe Connect:</strong> All payments are processed via Stripe. By using this service, you also agree to <a href="https://stripe.com/legal" className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">Stripe's Terms of Service</a>.</li>
            <li><strong>Taxes:</strong> Users are solely responsible for determining, collecting, reporting, and paying all applicable taxes related to their income.</li>
          </ul>
        </section>

        {/* 4. DISPUTES & REFUNDS */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Disputes, Refunds & Non-Payment</h2>
          <p className="mb-4">
            MicroFreelanceHub is <strong>not responsible</strong> for resolving disputes between Freelancers and Clients.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Refunds:</strong> We do not issue refunds for services provided by Freelancers. Any request for a refund must be directed to the Freelancer.</li>
            <li><strong>Chargebacks:</strong> If a Client initiates a chargeback with their bank, the Freelancer is responsible for providing evidence to contest it. MicroFreelanceHub is not liable for lost funds due to chargebacks.</li>
            <li><strong>Non-Performance:</strong> If a Freelancer fails to deliver work, or if a Client fails to pay, MicroFreelanceHub assumes no liability. Legal recourse must be pursued directly between the parties involved.</li>
          </ul>
        </section>

        {/* 5. LIMITATION OF LIABILITY */}
        <section className="bg-red-50 p-6 rounded-xl border border-red-100">
          <h2 className="text-xl font-bold text-red-900 mb-3 uppercase tracking-wide">5. Limitation of Liability</h2>
          <p className="text-red-800 text-sm leading-relaxed font-medium">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MICROFREELANCEHUB SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
          </p>
        </section>

        {/* 6. INDEMNIFICATION */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless MicroFreelanceHub, its officers, directors, employees, and agents, from and against any claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the Platform or your violation of these Terms.
          </p>
        </section>

        {/* 7. TERMINATION */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Contact us: support@microfreelancehub.com
          </p>
        </section>

      </div>
    </div>
  );
}