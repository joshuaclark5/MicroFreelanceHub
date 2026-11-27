import Link from 'next/link';
import WorkspaceNav from '../../components/WorkspaceNav';

export const metadata = {
  title: 'Notification preferences | MicroFreelanceHub',
  robots: { index: false, follow: false },
};

export default function NotificationPreferences() {
  return <div className="d4-app-shell suite-shell">
    <WorkspaceNav active="settings" />
    <main className="suite-main p-5 sm:p-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-sm">
        <Link href="/workspace" className="underline">Overview</Link><span aria-hidden="true">/</span>
        <Link href="/settings" className="underline">Settings</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Notification preferences</span>
      </nav>
      <h1 className="text-2xl font-semibold">Notification preferences</h1>
      <section aria-labelledby="availability-heading" className="mt-6 max-w-xl rounded-xl border p-5 space-y-4">
        <h2 id="availability-heading" className="text-xl font-semibold">Preference controls are not available yet</h2>
        <p>You cannot currently choose notification categories or email frequency here. No preferences have been changed.</p>
        <p>Password-reset emails are requested separately from Account security. Team invitations and booking reminders are separate, explicitly requested messages; this page does not enable, cancel or unsubscribe you from them.</p>
        <p>You do not need to take any action on this page.</p>
        <div className="flex flex-wrap gap-4">
          <Link className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/settings/security">Account security</Link>
          <Link className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/settings">Back to Settings</Link>
        </div>
      </section>
    </main>
  </div>;
}
