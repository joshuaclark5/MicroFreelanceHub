import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageSquareText, Search, ShieldCheck } from 'lucide-react';
import ClientMessageGenerator from './ClientMessageGenerator';

export const metadata: Metadata = {
  title: 'Free Freelance Client Reply Generator',
  description:
    'Write calm client replies for late payments, scope changes, revision requests, handoff questions, and delayed approvals.',
  alternates: {
    canonical: '/tools/client-message-generator',
  },
  openGraph: {
    title: 'Free Freelance Client Reply Generator',
    description:
      'Turn awkward client situations into clear, professional replies for common freelance project moments.',
    url: 'https://www.microfreelancehub.com/tools/client-message-generator',
    type: 'website',
  },
};

export default function ClientMessageGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-lg font-bold text-white shadow-md">
                M
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">MicroFreelance</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/articles" className="text-sm font-bold text-slate-600 hover:text-slate-900">
                Articles
              </Link>
              <Link
                href="/create?source=client-message-tool"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700"
              >
                Create project link
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-bold text-blue-700 shadow-sm">
              <MessageSquareText className="h-4 w-4" />
              Free freelancer communication tool
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
              Write the client reply you have been avoiding.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
              Turn late payments, scope changes, revision requests, vague feedback, and handoff questions into a calm
              professional message in seconds.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                'No account needed for the first draft',
                'Built for awkward client moments',
                'Business communication, not legal advice',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="rounded-2xl bg-slate-900 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Example output</p>
              <p className="mt-4 text-lg leading-relaxed">
                Hi [Client Name], thanks for sending this over. This request adds work beyond the current project
                scope, so I can price it as an added item and share the updated timing before I begin.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-blue-50 p-5">
                <Search className="h-5 w-5 text-blue-600" />
                <h2 className="mt-3 font-extrabold text-slate-900">SEO wedge</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Each client situation can become a search page where the tool is the answer.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <h2 className="mt-3 font-extrabold text-slate-900">Lower-risk copy</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  The tool helps with client communication and project admin, not legal outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <ClientMessageGenerator />
        </div>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Next best step</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Pair the reply with clear project details.
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                After you send the message, use MicroFreelanceHub to outline scope, pricing, approvals, timelines,
                signatures, and payment steps in one client-ready link.
              </p>
            </div>
            <Link
              href="/create?source=client-message-tool"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-extrabold text-white transition hover:bg-black"
            >
              Create project link
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
