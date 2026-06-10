import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import {
  Shield, FileText, Receipt, Mail, Lock, Ghost, Ban,
  Clock, AlertTriangle, Zap, TrendingUp, Award, Scale,
  Briefcase, Wrench, UserCheck, ClipboardCheck
} from 'lucide-react';
import RelatedRoles from '../../components/seo/RelatedRoles';

export const revalidate = 86400;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findDoc(slug: string) {
  const { data: sowDoc } = await supabase.from('sow_documents').select('*').eq('slug', slug).single();
  if (sowDoc) return { doc: sowDoc, source: 'sow' };

  let { data: exactDoc } = await supabase.from('seo_pages').select('*').eq('slug', slug).single();
  if (exactDoc) return { doc: exactDoc, source: 'seo' };

  let baseSlug = slug.replace(/-invoice-template$/, '').replace(/-contract-template$/, '');
  if (baseSlug !== slug) {
      const { data: baseDoc } = await supabase.from('seo_pages').select('*').eq('slug', baseSlug).single();
      if (baseDoc) return { doc: baseDoc, source: 'seo' };
  }

  const oldHireSlug = `hire-${baseSlug}`;
  const { data: hireDoc } = await supabase.from('seo_pages').select('*').eq('slug', oldHireSlug).single();
  if (hireDoc) return { doc: hireDoc, source: 'seo' };

  const manualOverrides: Record<string, string> = {
    'graphic-design-contract': 'freelance-logo-designer',
    'video-editor-contract': 'freelance-videographer',
    'event-photographer-contract': 'hire-event-photographer',
    'web-development-contract': 'hire-wordpress-developer',
    'social-media-manager-contract': 'hire-twitter-manager',
    'seo-specialist-contract': 'hire-local-seo-expert',
    'copywriting-contract': 'case-study-copywriter',
    'freelance-grant-writer-contract-template': 'hire-freelance-grant-writer',
    'graphic-designer-contract-template': 'hire-freelance-graphic-designer',
    'commercial-photographer-contract-template': 'commercial-photography-rates',
    'game-developer-contract-template': 'game-developer-rates',
  };

  if (manualOverrides[slug]) {
    const overrideSlug = manualOverrides[slug];
    const { data: seoDocOverride } = await supabase.from('seo_pages').select('*').eq('slug', overrideSlug).single();
    if (seoDocOverride) return { doc: seoDocOverride, source: 'seo' };
  }

  return null;
}

function toTitleCase(str: string | null) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function pluralize(word: string | null) {
  if (!word) return '';
  const trimmed = word.trim();
  if (trimmed.endsWith('y') && !/[aeiou]y$/i.test(trimmed)) {
    return trimmed.slice(0, -1) + 'ies';
  }
  if (trimmed.endsWith('s') || trimmed.endsWith('x') || trimmed.endsWith('z') || trimmed.endsWith('ch') || trimmed.endsWith('sh')) {
    return trimmed + 'es';
  }
  return trimmed + 's';
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Template Not Found' };
  
  const { doc } = result;
  const title = toTitleCase(doc.job_title || doc.keyword);
  const isEmail = params.slug.startsWith('late-payment-email');
  const documentType = doc.document_type || 'Contract';
  const label = isEmail ? 'Late Payment Emails' : documentType;
  const pageTitle = doc.seo_title || `Free ${title} ${label} (2026)`;
  
  const metaDescription = doc.seo_desc || doc.ai_summary || `Download a free, professional ${title} ${label.toLowerCase()} template. Protect your business from scope creep and get paid faster.`;

  return {
    title: pageTitle,
    description: metaDescription,
    keywords: [`${title} ${label}`, `Free ${title} template`, 'MicroFreelanceHub'],
    alternates: { canonical: `https://www.microfreelancehub.com/templates/${params.slug}` },
    openGraph: { title: pageTitle, description: metaDescription, type: 'website' }
  };
}

export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return notFound();

  const { doc } = result;

  if (doc.document_type === 'Comparison') {
      redirect(`/alternatives/${params.slug}`);
  }
  
  const title = doc.job_title || toTitleCase(doc.keyword);
  const isEmail = params.slug.startsWith('late-payment-email');
  const docType = doc.document_type || (isEmail ? 'Email' : 'Contract');
  
  let professionSlug = params.slug;
  const suffixes = [
    '-invoice-template', '-invoice', '-contract-template', '-contract', '-estimate-template', '-estimate', 
    '-quote-template', '-quote', '-retainer-agreement', '-retainer', '-change-order-template', '-change-order',
    '-scope-of-work-template', '-scope-of-work', '-work-order-template', '-work-order', '-subcontractor-agreement', 
    '-subcontractor', '-non-disclosure-agreement', '-nda', '-late-payment-demand-letter', '-cease-and-desist-letter',
    '-service-agreement-template', '-service-agreement', '-maintenance-agreement-template', '-maintenance-agreement',
    '-independent-contractor-agreement', '-project-sign-off-form', '-deposit-agreement', '-template'
  ];
  for (const suffix of suffixes) {
    if (professionSlug.endsWith(suffix)) {
      professionSlug = professionSlug.slice(0, -suffix.length);
      break; 
    }
  }
  professionSlug = professionSlug.replace(/^late-payment-email-/, '').replace(/^hire-/, '');

  const isInvoice = !isEmail && docType === 'Invoice';
  const isEstimate = !isEmail && docType === 'Estimate';
  const isQuote = !isEmail && docType === 'Quote';
  const isRetainer = !isEmail && docType === 'Retainer';
  const isChangeOrder = !isEmail && docType === 'Change Order';
  const isScopeOfWork = !isEmail && docType === 'Scope of Work';
  const isWorkOrder = !isEmail && docType === 'Work Order';
  const isSubcontractor = !isEmail && docType === 'Subcontractor Agreement';
  const isNDA = !isEmail && (docType === 'Non-Disclosure Agreement' || docType === 'NDA');
  const isDemandLetter = !isEmail && docType === 'Late Payment Demand Letter';
  const isCeaseAndDesist = !isEmail && docType === 'Cease and Desist Letter';
  const isServiceAgreement = !isEmail && docType === 'Service Agreement';
  const isMaintenance = !isEmail && docType === 'Maintenance Agreement';
  const isContractor = !isEmail && docType === 'Independent Contractor Agreement';
  const isSignOff = !isEmail && docType === 'Project Sign-Off Form';
  const isDepositAgreement = !isEmail && docType === 'Deposit Agreement';
  const isProposal = isEstimate || isQuote;

  const badgeText = isEmail ? 'Email Templates' : `${docType} Template`;
  
  const themeColors = isEmail ? 'bg-indigo-600' 
    : isInvoice ? 'bg-emerald-600' : isProposal ? 'bg-amber-600' : isRetainer ? 'bg-violet-600'
    : isChangeOrder ? 'bg-rose-600' : isScopeOfWork ? 'bg-cyan-600' : isWorkOrder ? 'bg-orange-600'
    : isSubcontractor ? 'bg-teal-600' : isNDA ? 'bg-zinc-800' : isDemandLetter ? 'bg-red-600'
    : isCeaseAndDesist ? 'bg-stone-800' : isServiceAgreement ? 'bg-fuchsia-600' : isMaintenance ? 'bg-lime-600'
    : isContractor ? 'bg-sky-600' : isSignOff ? 'bg-pink-600' : isDepositAgreement ? 'bg-emerald-700' : 'bg-blue-600';

  const textColors = isEmail ? 'text-indigo-400' 
    : isInvoice ? 'text-emerald-400' : isProposal ? 'text-amber-400' : isRetainer ? 'text-violet-400'
    : isChangeOrder ? 'text-rose-400' : isScopeOfWork ? 'text-cyan-600' : isWorkOrder ? 'text-orange-600'
    : isSubcontractor ? 'text-teal-600' : isNDA ? 'text-zinc-600' : isDemandLetter ? 'text-red-500'
    : isCeaseAndDesist ? 'text-stone-400' : isServiceAgreement ? 'text-fuchsia-500' : isMaintenance ? 'text-lime-600'
    : isContractor ? 'text-sky-500' : isSignOff ? 'text-pink-500' : isDepositAgreement ? 'text-emerald-500' : 'text-blue-400';

  const safeParse = (data: any, fallback: any) => {
    if (!data) return fallback;
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return fallback; }
    }
    return data;
  };

  const parsedDeliverables = safeParse(doc.deliverables, ["Deliverable Phase 1", "Deliverable Phase 2", "Deliverable Phase 3"]);
  const listItems: string[] = Array.isArray(parsedDeliverables) ? parsedDeliverables : ["Deliverable Phase 1", "Deliverable Phase 2", "Deliverable Phase 3"];

  const parsedFaqs = safeParse(doc.faqs, [{ q: `What is a ${title} ${docType}?`, a: `A professional document to protect your business.` }]);
  const faqs: any[] = Array.isArray(parsedFaqs) ? parsedFaqs : [{ q: `What is a ${title} ${docType}?`, a: `A professional document to protect your business.` }];

  const parsedRisks = safeParse(doc.unique_risks, null);
  const displayRisks: any[] = Array.isArray(parsedRisks) ? parsedRisks : [
    { title: "Client Ghosting", description: "Without upfront financial commitment, clients can disappear mid-project.", icon: Ghost, color: "text-red-500", bg: "bg-red-50" },
    { title: "Infinite Revisions", description: "Without a documented scope of work, you risk doing unpaid tweaks forever.", icon: Ban, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Chasing Checks", description: "Waiting 30 days for a paper check severely impacts freelance cash flow.", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" }
  ];

  const bestPractices = safeParse(doc.best_practices, null);
  const scopeCreep = safeParse(doc.scope_creep_examples, null);

  const dynamicRiskIcons = [Ghost, Ban, Clock];
  const dynamicRiskColors = ["text-red-500", "text-orange-500", "text-amber-500"];
  const dynamicRiskBgs = ["bg-red-50", "bg-orange-50", "bg-amber-50"];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq: any) => ({
      '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to create a ${title} ${docType}`,
    description: `A step-by-step guide to generating and sending a professional ${title} ${docType.toLowerCase()}.`,
    step: [
      { '@type': 'HowToStep', name: 'Select the Template', text: `Click the CTA button to open the generator.` },
      { '@type': 'HowToStep', name: 'Customize Deliverables', text: 'Add your specific project milestones and pricing.' },
      { '@type': 'HowToStep', name: 'Enable Payments', text: 'Connect Stripe to accept deposits or full payments instantly.' },
      { '@type': 'HowToStep', name: 'Send to Client', text: 'Generate a secure link and send it for e-signature.' }
    ]
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />

      {/* 🚀 ICEBERG LAYOUT: Hero + Preview side-by-side above the fold */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-4 relative overflow-hidden">
        
        <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
           <Link href={`/profession/${professionSlug}`} className="text-slate-400 hover:text-white text-sm font-bold transition-all flex items-center gap-2">
              ← {title} Templates
           </Link>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 mt-8">
          
          {/* LEFT SIDE: Copy & CTA */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${themeColors}`}>
                {isEmail ? <Mail className="w-3.5 h-3.5" /> : isInvoice || isDepositAgreement ? <Receipt className="w-3.5 h-3.5" /> : isDemandLetter || isCeaseAndDesist ? <Scale className="w-3.5 h-3.5" /> : isServiceAgreement ? <Briefcase className="w-3.5 h-3.5" /> : isMaintenance ? <Wrench className="w-3.5 h-3.5" /> : isContractor ? <UserCheck className="w-3.5 h-3.5" /> : isSignOff ? <ClipboardCheck className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {badgeText}
              </div>
            </div>

            {/* 🚀 FIXED: Removed hard break, added text-balance for perfect responsive wrapping */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight text-balance">
              Stop losing money on <span className={textColors}>{title}</span> projects.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              Send your first 3 {isEmail ? 'emails' : `${docType.toLowerCase()}s`} for free. {doc.pain_point_hook || `Define your scope, secure signatures, and get paid faster.`}
            </p>

            <Link href={isEmail ? "/login" : `/create?template=${params.slug}`}>
               <button className={`w-full sm:w-auto font-bold px-8 py-4 rounded-xl text-lg shadow-xl hover:-translate-y-1 transition-transform text-white flex items-center justify-center gap-2 ${themeColors} hover:opacity-90`}>
                 Create My Free Account →
               </button>
            </Link>
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-2">
              <Shield className="w-3 h-3" /> No credit card required. Setup takes 30 seconds.
            </p>
          </div>

          {/* RIGHT SIDE: The Visual Preview Document (PRO TIER UPDATE) */}
          <div className="relative group">
            <div className={`absolute inset-0 transform rotate-2 rounded-2xl opacity-20 transition-transform group-hover:rotate-3 ${themeColors}`}></div>
            
            {/* 🚀 FIXED: Height adjusted for mobile, added select-none */}
            <div className={`relative bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[400px] md:h-[600px] select-none`}>
              
              {/* Fake App Bar */}
              <div className="bg-slate-50 border-b border-slate-200 p-3 flex gap-2 items-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                <div className="mx-auto bg-white border border-slate-200 text-[10px] md:text-xs font-mono text-slate-400 px-4 py-1 rounded-md flex items-center gap-2 shadow-sm">
                   <Lock className="w-3 h-3" /> SECURE PREVIEW
                </div>
              </div>

              {/* The Document Area - SCROLL LOCKED (overflow-hidden) */}
              <div className="p-6 md:p-10 text-xs md:text-sm leading-relaxed overflow-hidden h-full max-w-none text-slate-700 whitespace-pre-wrap relative">
                 
                 {/* 🚀 FIXED: Professional Header without liability */}
                 <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-widest text-slate-900 mb-2">
                        {isInvoice ? 'Invoice' : isEstimate ? 'Estimate' : isQuote ? 'Quote' : isRetainer ? 'Retainer Agreement' : isChangeOrder ? 'Change Order' : isScopeOfWork ? 'Scope of Work' : isWorkOrder ? 'Work Order' : isSubcontractor ? 'Subcontractor Agreement' : isNDA ? 'Non-Disclosure Agreement' : isDemandLetter ? 'Demand Letter' : isCeaseAndDesist ? 'Cease & Desist' : isServiceAgreement ? 'Service Agreement' : isMaintenance ? 'Maintenance Agreement' : isContractor ? 'Contractor Agreement' : isSignOff ? 'Project Sign-Off' : isDepositAgreement ? 'Deposit Agreement' : 'Statement of Work'}
                    </h2>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Ref: {new Date().getFullYear()}-001 • Standard Business Template</p>
                 </div>

                {isEmail ? (
                  <div dangerouslySetInnerHTML={{ __html: doc.content || '<p>Loading email draft...</p>' }} />
                ) : (
                  <div>
                    {doc.content ? (
                      <div dangerouslySetInnerHTML={{ __html: doc.content }} className="opacity-90" />
                    ) : (
                      <div className="space-y-4">
                        <p className="font-bold text-slate-900">1. Covered Provisions</p>
                        <p>This document officially outlines the following parameters:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          {listItems.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 🚀 FIXED: Shorter blur gradient to reveal more initial text */}
              <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-6 md:pb-8 z-10 backdrop-blur-[1px]">
                <div className="bg-white/95 p-5 md:p-6 rounded-2xl border border-slate-100 shadow-xl flex flex-col items-center transform transition-transform hover:-translate-y-1 text-center w-[90%] md:w-[85%] mx-auto">
                   <Lock className={`w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 ${textColors}`} />
                   <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Premium Template</h3>
                   <p className="text-[10px] md:text-xs text-slate-500 mb-3 md:mb-4 px-2">Unlock the full document, edit details, and send for e-signature.</p>
                   <Link href={`/create?template=${params.slug}`} className="w-full">
                     <button className={`w-full py-2.5 md:py-3 rounded-xl font-bold text-white text-xs md:text-sm shadow-md transition-colors ${themeColors}`}>
                       Customize & Send Document
                     </button>
                   </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 🚀 RISK CARDS (Slightly overlapping the hero) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-16">
         <div className="grid md:grid-cols-3 gap-6">
            {displayRisks.slice(0,3).map((risk: any, i: number) => {
                const Icon = risk.icon || dynamicRiskIcons[i];
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex flex-col items-center text-center">
                     <div className={`w-12 h-12 ${risk.bg || dynamicRiskBgs[i]} rounded-full flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${risk.color || dynamicRiskColors[i]}`} />
                     </div>
                     <h3 className="font-bold text-slate-900 mb-2">{risk.title}</h3>
                     <p className="text-sm text-slate-600">{risk.description}</p>
                  </div>
                )
            })}
         </div>
      </div>

      {/* 🚀 SEO CONTENT WALL (Below the fold, centered layout) */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {doc.snippet_answer && (
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
              <Zap className={`w-6 h-6 ${textColors}`} />
              What is a {title} {docType}?
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">{doc.snippet_answer}</p>
          </div>
        )}

        <section className="mb-12 bg-slate-50 border border-slate-200 rounded-2xl p-8 relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-1 h-full ${themeColors}`}></div>
           <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
             <Award className={`w-6 h-6 ${textColors}`} /> Built from real freelance projects
           </h3>
           <p className="text-slate-600 leading-relaxed">
             This template is based on real-world scenarios across freelance projects where unclear scope, missing payment terms, and revision creep led to lost revenue. It is designed to protect your time, define expectations, and ensure you get paid.
           </p>
        </section>

        {doc.why_it_matters && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Why {pluralize(title)} need a clear {docType.toLowerCase()}
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {doc.why_it_matters}
            </p>
          </section>
        )}

        {doc.real_world_scenario && (
          <section className="mb-12 bg-slate-900 text-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Shield className="w-6 h-6 text-emerald-400" />
               Real-world scenario
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              {doc.real_world_scenario}
            </p>
          </section>
        )}
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className={textColors}>{isEmail ? '📬' : isInvoice ? '💸' : isProposal ? '📈' : '🛡️'}</span> What this {docType.toLowerCase()} covers:
          </h3>
          <ul className="space-y-4">
             {listItems.map((item: string, i: number) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-sm bg-slate-200 ${textColors}`}>✓</div>
                  <span className="font-bold text-slate-900 text-lg">{item}</span>
                </li>
             ))}
          </ul>
        </div>

        {Array.isArray(bestPractices) && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Best practices for {pluralize(title)}
            </h2>
            <div className="space-y-4">
              {bestPractices.map((item: any, i: number) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-left">
          <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Legal Disclaimer:</strong> MicroFreelanceHub is a software workflow tool, not a law firm. The templates and information provided on this website are for general informational purposes only and do not constitute legal advice.
          </p>
        </div>

      </div>

      {/* 🚀 FAQS */}
      <div className="max-w-4xl mx-auto px-4 py-16 border-t border-slate-100">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq: any, index: number) => (
            <div key={index} className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg md:text-xl mb-3">{faq.q}</h3>
              <p className="text-slate-600 leading-relaxed text-lg">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
          <RelatedRoles currentSlug={params.slug} jobTitle={doc.job_title} />
      </div>

    </div>
  );
}
