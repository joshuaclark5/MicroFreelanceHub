import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageSquareText } from 'lucide-react';
import ClientMessageGenerator from '../client-message-generator/ClientMessageGenerator';

const pages = {
  'late-payment-reply-generator': {
    title: 'Late Payment Reply Generator for Freelancers',
    description: 'Write a calm follow-up message when a freelance client payment is late.',
    heading: 'Write a late payment follow-up without sounding desperate.',
    scenario: 'late-payment',
  },
  'scope-creep-reply-generator': {
    title: 'Scope Creep Reply Generator for Freelancers',
    description: 'Write a professional reply when a client asks for extra work outside the current project scope.',
    heading: 'Turn a scope creep request into a clear next-step message.',
    scenario: 'scope-creep',
  },
  'final-file-handoff-reply-generator': {
    title: 'Final File Handoff Reply Generator',
    description: 'Draft a professional message before sending final project files to a client.',
    heading: 'Reply clearly when a client asks for final files.',
    scenario: 'final-files',
  },
  'revision-request-reply-generator': {
    title: 'Extra Revision Reply Generator',
    description: 'Write a clear reply when a client requests additional revision rounds.',
    heading: 'Respond to extra revision requests with a calm next step.',
    scenario: 'revision-request',
  },
} as const;

type ToolSlug = keyof typeof pages;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = pages[params.slug as ToolSlug] || pages['late-payment-reply-generator'];

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/tools/${params.slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://www.microfreelancehub.com/tools/${params.slug}`,
      type: 'website',
    },
  };
}

export default function ToolScenarioPage({ params }: { params: { slug: string } }) {
  const page = pages[params.slug as ToolSlug] || pages['late-payment-reply-generator'];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-lg font-bold text-white shadow-md">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">MicroFreelance</span>
          </Link>
          <Link href="/tools/client-message-generator" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            All reply tools
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-bold text-blue-700 shadow-sm">
            <MessageSquareText className="h-4 w-4" />
            Free client reply generator
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">{page.heading}</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Add a few details, pick a tone, and get a professional client message you can edit before sending.
            This tool drafts business communication only and does not provide legal advice.
          </p>
        </div>

        <ClientMessageGenerator initialScenario={page.scenario} />

        <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-900">Need more than a reply?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            MicroFreelanceHub also helps outline project scope, pricing, approvals, timelines, signatures, and payment
            steps in a client-ready workspace.
          </p>
          <Link
            href="/create?source=tool-scenario"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-extrabold text-white transition hover:bg-black"
          >
            Create a project link
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
