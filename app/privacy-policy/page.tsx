import React from 'react';

export const metadata = {
  title: 'Privacy Policy | MicroFreelanceHub',
  description: 'Our privacy policy and data handling practices.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Introduction</h2>
          <p>Welcome to MicroFreelanceHub. We are committed to protecting your personal information and your right to privacy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when you register on the website, such as:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Names, email addresses, and contact data.</li>
            <li>Credentials (passwords and security information) for authentication.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
          <p>We use your information to facilitate account creation, manage user accounts, and improve the functionality of our freelance tools.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Contact Us</h2>
          <p>If you have questions about this policy, please contact us via our support channels.</p>
        </section>
      </div>
    </div>
  );
}