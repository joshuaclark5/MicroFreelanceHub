import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { 
  Briefcase, FileSignature, Receipt, ChevronRight, Wrench, Home, Sparkles,
  CheckCircle2, CalendarCheck, CircleDollarSign
} from 'lucide-react';

// 🚀 CRITICAL FIX #6: 24-hour caching for scale
export const revalidate = 86400;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toTitleCase(str: string) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// 🚀 CRITICAL FIX #3: Canonical URLs
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const professionSlug = params.slug.toLowerCase();
  const { data } = await supabase.from('seo_pages').select('job_title').ilike('slug', `${professionSlug}-%`).limit(1);
  const professionName = data?.[0]?.job_title || toTitleCase(params.slug);

  return {
    title: `${professionName} Business Templates & Documents`,
    description: `Browse free, professional templates, contracts, and invoices built for ${professionName}s. Organize scope, approvals, payment terms, and client communication.`,
    alternates: {
      canonical: `https://www.microfreelancehub.com/profession/${params.slug}`,
    }
  };
}

// 🚀 CRITICAL FIX #2: Reusable Document Map
const documentGroups = {
  defining: {
    title: "Phase 1: Defining the Work",
    color: "cyan",
    icon: FileSignature,
    docs: ['Scope of Work', 'Estimate', 'Quote', 'Proposal', 'Independent Contractor Agreement', 'Service Agreement', 'Non-Disclosure Agreement', 'NDA']
  },
  execution: {
    title: "Phase 2: Project Execution",
    color: "amber",
    icon: Wrench,
    docs: ['Work Order', 'Change Order', 'Project Sign-Off Form', 'Subcontractor Agreement', 'Maintenance Agreement']
  },
  payment: {
    title: "Phase 3: Payments & Follow-Up",
    color: "emerald",
    icon: Receipt,
    docs: ['Invoice', 'Retainer Agreement', 'Late Payment Demand Letter', 'Cease and Desist Letter']
  }
};

export default async function ProfessionHubPage({ params }: { params: { slug: string } }) {
  const professionSlug = params.slug.toLowerCase();
  
  // 🚀 CRITICAL FIX #1: Robust Slug Matching
  const { data: templates } = await supabase
    .from('seo_pages')
    .select('slug, document_type, job_title, ai_summary')
    .ilike('slug', `${professionSlug}-%`);

  if (!templates || templates.length === 0) {
    return notFound();
  }

  // 🚀 CRITICAL FIX #7: Smart Acronym titles (e.g. SEO, UI/UX)
  const professionName = templates[0].job_title || toTitleCase(params.slug);

  // Grouping logic
  const definingGroup = templates.filter(t => documentGroups.defining.docs.includes(t.document_type));
  const executionGroup = templates.filter(t => documentGroups.execution.docs.includes(t.document_type));
  const paymentGroup = templates.filter(t => documentGroups.payment.docs.includes(t.document_type));
  const groupedSlugs = new Set([
    ...definingGroup.map(t => t.slug),
    ...executionGroup.map(t => t.slug),
    ...paymentGroup.map(t => t.slug),
  ]);
  const ungroupedGroup = templates.filter(t => !groupedSlugs.has(t.slug));
  const primaryTemplate = templates[0];
  const createHref = primaryTemplate?.slug ? `/create?template=${primaryTemplate.slug}` : '/create';
  const totalTemplates = templates.length;
  const planningCards = [
    {
      title: 'Scope and deliverables',
      copy: `List the exact ${professionName} work, included tasks, materials or files, and what counts as a change request.`,
      icon: FileSignature,
      colorClass: 'text-cyan-600',
      bgClass: 'bg-cyan-100',
    },
    {
      title: 'Approvals and timeline',
      copy: 'Set review steps, response windows, start dates, milestone dates, and final delivery expectations before work begins.',
      icon: CalendarCheck,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
    },
    {
      title: 'Pricing and payment steps',
      copy: 'Spell out deposits, balances, invoices, due dates, and when work pauses or resumes around payment timing.',
      icon: CircleDollarSign,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
    },
  ];
  const workflowSteps = [
    'Pick the document that matches the client conversation.',
    'Add the scope, price, timeline, payment terms, and approval checkpoints.',
    'Send one client-ready link for review, signature, and payment steps.',
  ];
  const faqItems = [
    {
      question: `Which ${professionName} template should I start with?`,
      answer: `If the client is still deciding, start with an estimate or proposal. If both sides are ready to move forward, start with an agreement or scope of work. If work is complete or a payment milestone is due, start with an invoice or payment-focused template.`,
    },
    {
      question: `What should a ${professionName} agreement include?`,
      answer: 'A useful agreement should cover the work requested, deliverables, timeline, revision or change process, pricing, payment schedule, client approvals, and what happens if either side needs to pause or change the project.',
    },
    {
      question: 'Can I customize these templates for each client?',
      answer: 'Yes. Use the template as a starting point, then adjust the project details, payment amounts, dates, included work, and client-specific notes before sending it.',
    },
  ];

  const renderTemplateCard = (doc: any, icon: any, colorClass: string, bgClass: string) => {
    const Icon = icon;
    const documentName = (doc.document_type || 'business document').toLowerCase();
    return (
      <Link href={`/templates/${doc.slug}`} key={doc.slug}>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-400 hover:shadow-xl transition-all group h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
              <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors leading-tight">
                {doc.document_type}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Free Template</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
            Use this {documentName} template to outline scope, approvals, pricing, timelines, and payment details for {professionName} work.
          </p>
          <div className="mt-auto flex items-center text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            View & Customize <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      
      {/* 🚀 BREADCRUMBS */}
      <div className="bg-slate-900 pt-6 px-4 md:px-8">
         <div className="max-w-7xl mx-auto flex items-center text-xs font-bold text-slate-400 space-x-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-blue-400">{professionName} Templates</span>
         </div>
      </div>

      <div className="bg-slate-900 text-white pt-12 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 backgroundImage='linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)' backgroundSize='40px 40px' opacity-20"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold uppercase tracking-widest mb-6">
            <Briefcase className="w-4 h-4" /> Operations Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Complete <span className="text-blue-400">{professionName}</span> <br className="hidden md:block" /> Business Template Library
          </h1>
          
          {/* 🚀 CRITICAL FIX #4: Dynamic Semantic Intro Copy */}
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            As a {professionName}, you deal with revisions, material costs, schedule changes, and scope creep. Use these business templates to define the work, document approvals, and keep payment expectations clear.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link href={createHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-400">
              <Sparkles className="h-4 w-4" />
              Create Agreement
            </Link>
            <Link href="#templates" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/15">
              <Briefcase className="h-4 w-4" />
              Browse Templates
            </Link>
            <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/15">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-20">
        <section className="mb-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-blue-600">Start faster</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
                Turn a {professionName} client conversation into a clear next step
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
                Use this library to move from loose project details to a document you can review, customize, and send before work begins.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">{totalTemplates}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Templates found</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">3</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Workflow phases</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-black text-slate-950">1</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Client-ready link</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950 p-6 text-white">
              <h3 className="text-lg font-extrabold">Simple workflow</h3>
              <div className="mt-5 space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
              <Link href={createHref} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-blue-50">
                <Sparkles className="h-4 w-4" />
                Create Agreement
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-blue-600">Before sending work</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              Clarify the pieces clients often miss
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {planningCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${card.bgClass}`}>
                    <Icon className={`h-6 w-6 ${card.colorClass}`} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div id="templates" className="scroll-mt-8"></div>
        
        {definingGroup.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8 pl-2 border-l-4 border-cyan-500">
              <h2 className="text-2xl font-bold text-slate-900">{documentGroups.defining.title}</h2>
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{definingGroup.length} Docs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {definingGroup.map(doc => renderTemplateCard(doc, documentGroups.defining.icon, 'text-cyan-600', 'bg-cyan-100'))}
            </div>
          </div>
        )}

        {executionGroup.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8 pl-2 border-l-4 border-amber-500">
              <h2 className="text-2xl font-bold text-slate-900">{documentGroups.execution.title}</h2>
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{executionGroup.length} Docs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {executionGroup.map(doc => renderTemplateCard(doc, documentGroups.execution.icon, 'text-amber-600', 'bg-amber-100'))}
            </div>
          </div>
        )}

        {paymentGroup.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8 pl-2 border-l-4 border-emerald-500">
              <h2 className="text-2xl font-bold text-slate-900">{documentGroups.payment.title}</h2>
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{paymentGroup.length} Docs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentGroup.map(doc => renderTemplateCard(doc, documentGroups.payment.icon, 'text-emerald-600', 'bg-emerald-100'))}
            </div>
          </div>
        )}

        {ungroupedGroup.length > 0 && (
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 pl-2 border-l-4 border-blue-500">
              <h2 className="text-2xl font-bold text-slate-900">Available templates</h2>
              <span className="w-fit px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{ungroupedGroup.length} Docs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ungroupedGroup.map(doc => renderTemplateCard(doc, Briefcase, 'text-blue-600', 'bg-blue-100'))}
            </div>
          </div>
        )}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-blue-600">Questions</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
                {professionName} template FAQs
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Use these answers to choose a template that fits the stage of the client conversation.
              </p>
            </div>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-xl bg-slate-50 p-5">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-slate-950">{item.question}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
