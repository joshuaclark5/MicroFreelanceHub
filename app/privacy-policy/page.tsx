import Navbar from '../components/Navbar';
import React from 'react';

export const metadata = {
  title: 'Privacy Policy | MicroFreelanceHub',
  description: 'Our privacy policy and data handling practices.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="public-design public-legal max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: November 24, 2026</p>

      <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Introduction</h2>
          <p>MicroFreelanceHub provides client and project management, business-document tools, invoices, time records and appointment scheduling for independent businesses. This policy explains information processed when you visit our website, use our Android companion app, create an account, use a workspace, or interact with a document or booking link shared by a workspace owner.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when you register on the website, such as:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Names, email addresses, and contact data.</li>
            <li>Authentication and session information handled through Supabase. If you use Google sign-in, we receive the account information described below, not your Google password.</li>
            <li>Workspace content you provide, such as client contact details, notes, project and task records, agreement text, signatures, invoice details, recorded time, availability and intake answers.</li>
            <li>Subscription and payment references, status and transaction details needed to operate billing. Payment-card entry and processing are handled by Stripe; do not put card numbers in workspace notes or forms.</li>
            <li>Technical information associated with requests, such as connection information, browser information and error logs, used to operate the service, troubleshoot problems and limit abuse.</li>
            <li>The first public page you visit and a campaign label or referring website domain, when available. We store these in your browser and associate them with your account when you sign up, to understand which sources lead to signups and subscriptions. This attribution does not store referring-page paths, search terms, or private agreement URLs. When the source is unavailable, we record it as unknown.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
          <p>We use this information to authenticate you, save and display your work, provide features you request, manage subscriptions, process payment-related events, deliver requested messages, respond to support requests, prevent abuse and understand how visitors find the service. Public or shared links make the information included in that link available to its intended recipients; only share content you have permission to share.</p>
        </section>

        <section id="google-data">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Google sign-in and optional calendar access</h2>
          <p><strong>Sign-in:</strong> when you choose Continue with Google, Google provides your account identifier, email address and basic profile information, such as your name and profile image, to authenticate and identify your MicroFreelanceHub account. Signing in does not by itself connect your Gmail inbox, Drive files or Google Calendar.</p>
          <p><strong>Calendar:</strong> the separate calendar connection, when configured and explicitly connected by you, requests permission to read busy-time intervals from your primary Google Calendar. We use those intervals to check scheduling conflicts. This integration does not request event titles, descriptions, guest lists or permission to create or change Google events. Connection credentials are encrypted before storage on our server, and busy intervals are stored for availability checks. Signing in with Google and connecting a calendar are separate choices.</p>
          <p>Google account and calendar data are used for these user-facing features, not advertising, data brokerage or training generalized artificial-intelligence models. We do not sell Google user data. MicroFreelanceHub&apos;s use and transfer of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          <p>You can disconnect an enabled calendar connection in Connections &amp; delivery and revoke Google access at <a href="https://myaccount.google.com/connections" className="underline">your Google Account connections</a>. Revocation stops future authorized access; it does not itself delete your MicroFreelanceHub account or workspace records. Contact us to request deletion of retained information.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Service providers and sharing</h2>
          <p>We use service providers to run the features you use: Supabase for authentication and stored records, Vercel for hosting, Stripe for subscriptions and payment processing, and Resend for email delivery. Google provides Google sign-in and optional calendar access. These providers process the information needed for their services under their own applicable terms and privacy notices.</p>
          <p>If you request AI-assisted document editing, the text and instructions submitted for that feature are sent to Google&apos;s Gemini service to generate a response. This is separate from Google sign-in and calendar access. Do not submit sensitive information that is unnecessary for the requested output.</p>
          <p>Workspace owners and authorized team members can access records allowed by their workspace permissions. Document recipients, booking participants and message recipients receive the content shared with them. We may also disclose information when required by applicable law or reasonably necessary to investigate abuse and protect the service. We do not make a workspace public merely because you sign in with Google.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Cookies and browser storage</h2>
          <p>Authentication cookies maintain your session. Browser storage also supports preferences, drafts and the signup-attribution information described above. The Android companion stores sign-in sessions using encrypted device storage so you can return to your account. Signing out removes its stored session. Time-entry drafts and uncertain-save retry details remain in app memory and are not retained after the app closes. The companion uses Supabase for sign-in, project viewing and saving time entries; Google sign-in opens a browser authentication flow. Clearing browser data can sign you out or remove locally saved work; it does not remove records already saved to your account. Embedded third-party content, such as videos, can involve requests to that provider.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Retention, access and deletion</h2>
          <p>We retain account and workspace information to provide the service while it is needed for your account, and may retain limited records for billing, dispute resolution, security, backups and applicable legal obligations. Retention depends on the record and the service provider; this policy does not promise immediate removal from every backup or a third-party recipient&apos;s files.</p>
          <p>You can edit supported records in your workspace and use available export controls to download records. For access, correction, export or deletion requests beyond those controls, email <a href="mailto:admin@microfreelancehub.com" className="underline">admin@microfreelancehub.com</a>. We may need to verify that you are entitled to the information before acting. Self-service account deletion is temporarily unavailable while we improve billing safeguards. Request deletion through support; you may need to verify account ownership. A deletion request does not cancel a subscription or reverse a payment. Manage your subscription separately in Settings and contact support about active billing.</p>
          <p>If a business entered your details in its workspace, contact that business about its use of your information. You may also contact us to help identify the appropriate request path. Your rights depend on your location and applicable law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Security and international processing</h2>
          <p>We use authentication, access controls and transport encryption to help safeguard information. No service can promise absolute security. Our service providers may process information outside your country. Keep your account secure, share links carefully and contact support if you believe someone has accessed your account without permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Free challenge signups</h2>
          <p>If you sign up for the Client-Ready Challenge, we store your name, email, signup time, consent version and email-delivery status in Supabase, and use Resend to send the access instructions you request. This does not create a paid subscription or enroll you in marketing emails. We retain this record to manage access and avoid duplicate welcome emails until you request deletion. A keyed hash of the connection address is used for short-lived signup rate limits; old attempt records are removed during subsequent signup processing. Challenge worksheet text is not submitted with your signup. If you choose browser saving, your brief is stored on that device until you turn saving off or clear browser data. Downloaded backups are files you control. The paid change planner uses your inputs in the page session; it does not send them to us.</p>
          <p>For signup questions or a deletion request, email <a href="mailto:joshuastevenclark@gmail.com">joshuastevenclark@gmail.com</a>.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Contact and policy changes</h2>
          <p>For privacy questions, email <a href="mailto:admin@microfreelancehub.com" className="underline">admin@microfreelancehub.com</a>. We update the date on this page when the policy changes. Review this page for the current explanation of our practices.</p>
        </section>
      </div>
    </div>
    </>
  );
}
