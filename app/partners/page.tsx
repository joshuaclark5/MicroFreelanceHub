import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Copy, Mail, Share2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Program',
  description:
    'Partner with MicroFreelanceHub by sharing business-document tools for freelancers who want clearer scopes, signatures, pricing, timelines, and payment steps.',
  openGraph: {
    title: 'MicroFreelanceHub Partner Program',
    description:
      'Share business-document tools built for freelancers who want clearer project terms, signatures, pricing, timelines, and payment steps.',
    url: 'https://www.microfreelancehub.com/partners',
    siteName: 'MicroFreelance',
    type: 'website',
  },
};

const exampleLinks = [
  'https://www.microfreelancehub.com/?ref=yourname',
  'https://www.microfreelancehub.com/pricing?ref=yourname',
  'https://www.microfreelancehub.com/templates?ref=yourname',
];

const creatorAngles = [
  'Freelance design, development, marketing, writing, video, and local-service audiences',
  'Content about client onboarding, project scope, deposits, approvals, retainers, or invoicing',
  'Communities where solo operators want a faster way to prepare client-ready project terms',
];

const partnerBenefits = [
  '30% recurring commission on referred paid subscriptions for approved partners',
  'Creator-specific referral links so signups and paid plans can be reviewed',
  'A product angle built around a real freelancer problem: late-payment follow-up, unclear scope, and messy approvals',
];

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div>
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">M</span>
              MicroFreelanceHub
            </Link>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">Partner Program</p>
            <h1 className="mb-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-slate-950 md:text-5xl">
              Help freelancers spend less time chasing project details.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              MicroFreelanceHub helps freelancers put scope, pricing, approvals, timelines, signatures, Stripe payment steps, and late-payment reminders into one client-ready workflow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:partners@microfreelancehub.com?subject=MicroFreelanceHub%20partner%20request"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" />
                Request a partner code
              </a>
              <Link
                href="/pricing?ref=partner-page"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                See pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Simple referral tracking</h2>
                <p className="text-sm text-slate-600">Use your code in any shared link.</p>
              </div>
            </div>
            <div className="space-y-3">
              {exampleLinks.map((link) => (
                <div key={link} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
                  <code className="min-w-0 truncate text-xs text-slate-700">{link}</code>
                  <Copy className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Partner links are tracked as lead sources so referrals can be reviewed alongside signups and paid plans.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">Partner offer</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We are starting with a manual partner pilot so every code can be reviewed before payouts are handled.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {partnerBenefits.map((benefit) => (
              <div key={benefit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
                <p className="text-sm leading-6 text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">Who it fits</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The best partners already teach or serve freelancers who work directly with clients.
          </p>
        </div>
        <div className="space-y-4 lg:col-span-2">
          {creatorAngles.map((angle) => (
            <div key={angle} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-6 text-slate-700">{angle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-normal text-slate-950">Starter post copy</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Partners can adapt this copy for short posts, newsletter mentions, or video descriptions.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm leading-7 text-slate-700">
                Freelancers: stop starting client work from scattered messages. Put scope, pricing, approvals, signatures, Stripe payment steps, and late-payment reminders into one client-ready workflow.
              </p>
              <Link
                href="/create?ref=partner-page"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-black"
              >
                Try the builder
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
