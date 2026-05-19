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

// 🚀 CRITICAL FIX #6: 24-hour cache instead of revalidate 0
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Template Not Found' };
  
  const { doc } = result;
  const title = toTitleCase(doc.job_title || doc.keyword);
  const isEmail = params.slug.startsWith('late-payment-email');
  const documentType = doc.document_type || 'Contract';
  const label = isEmail ? 'Late Payment Emails' : documentType;
  
  const metaDescription = doc.ai_summary || `Download a free, professional ${title} ${label.toLowerCase()} template. Protect your business from scope creep and get paid faster.`;

  return {
    title: `Free ${title} ${label} (2026)`,
    description: metaDescription,
    keywords: [`${title} ${label}`, `Free ${title} template`, 'MicroFreelanceHub'],
    alternates: { canonical: `https://www.microfreelancehub.com/templates/${params.slug}` },
    openGraph: { title: `Free ${title} ${label}`, description: metaDescription, type: 'website' }
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
  
  // 🚀 CRITICAL FIX #5: Extract Profession Slug for Bidirectional Link
  let professionSlug = params.slug;
  const suffixes = [
    '-invoice-template', '-invoice', '-contract-template', '-contract', '-estimate-template', '-estimate', 
    '-quote-template', '-quote', '-retainer-agreement', '-retainer', '-change-order-template', '-change-order',
    '-scope-of-work-template', '-scope-of-work', '-work-order-template', '-work-order', '-subcontractor-agreement', 
    '-subcontractor', '-non-disclosure-agreement', '-nda', '-late-payment-demand-letter', '-cease-and-desist-letter',
    '-service-agreement-template', '-service-agreement', '-maintenance-agreement-template', '-maintenance-agreement',
    '-independent-contractor-agreement', '-project-sign-off-form', '-template'
  ];
  for (const suffix of suffixes) {
    if (professionSlug.endsWith(suffix)) {
      professionSlug = professionSlug.slice(0, -suffix.length);
      break; 
    }
  }
  professionSlug = professionSlug.replace(/^late-payment-email-/, '').replace(/^hire-/, '');

  // 👉 Expanded Chameleon Logic
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
  const isProposal = isEstimate || isQuote;

  const badgeText = isEmail ? 'Email Templates' : `${docType} Template`;
  
  // 👉 Dynamic Colors
  const themeColors = isEmail ? 'bg-indigo-600' 
    : isInvoice ? 'bg-emerald-600' : isProposal ? 'bg-amber-600' : isRetainer ? 'bg-violet-600'
    : isChangeOrder ? 'bg-rose-600' : isScopeOfWork ? 'bg-cyan-600' : isWorkOrder ? 'bg-orange-600'
    : isSubcontractor ? 'bg-teal-600' : isNDA ? 'bg-zinc-800' : isDemandLetter ? 'bg-red-600'
    : isCeaseAndDesist ? 'bg-stone-800' : isServiceAgreement ? 'bg-fuchsia-600' : isMaintenance ? 'bg-lime-600'
    : isContractor ? 'bg-sky-600' : isSignOff ? 'bg-pink-600' : 'bg-blue-600';

  const textColors = isEmail ? 'text-indigo-400' 
    : isInvoice ? 'text-emerald-400' : isProposal ? 'text-amber-400' : isRetainer ? 'text-violet-400'
    : isChangeOrder ? 'text-rose-400' : isScopeOfWork ? 'text-cyan-600' : isWorkOrder ? 'text-orange-600'
    : isSubcontractor ? 'text-teal-600' : isNDA ? 'text-zinc-600' : isDemandLetter ? 'text-red-500'
    : isCeaseAndDesist ? 'text-stone-400' : isServiceAgreement ? 'text-fuchsia-500' : isMaintenance ? 'text-lime-600'
    : isContractor ? 'text-sky-500' : isSignOff ? 'text-pink-500' : 'text-blue-400';

  const ctaText = isEmail ? '🚀 Automate These Emails'
    : isInvoice ? 'Secure Your Payment →' : isRetainer ? 'Start Recurring Work Safely →'
    : isChangeOrder ? 'Approve Extra Work Safely →' : isScopeOfWork ? 'Define Your Scope Safely →'
    : isWorkOrder ? 'Create This Work Order →' : isSubcontractor ? 'Hire Subcontractor Safely →'
    : isNDA ? 'Protect Your IP Now →' : isDemandLetter ? 'Generate Demand Letter →'
    : isCeaseAndDesist ? 'Send Cease & Desist →' : isServiceAgreement ? 'Define Your Services →'
    : isMaintenance ? 'Start Ongoing Support →' : isContractor ? 'Create Contractor Agreement →'
    : isSignOff ? 'Get Final Sign-Off →' : 'Protect This Project →';

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

      <div className="bg-slate-900 text-white py-16 md:py-24 px-4 relative overflow-hidden">
        
        {/* 🚀 CRITICAL FIX #5: Bidirectional Hub Link! */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
           <Link href={`/profession/${professionSlug}`} className="text-slate-400 hover:text-white text-sm font-bold transition-all flex items-center gap-2">
              ← {title} Templates
           </Link>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${themeColors}`}>
              {isEmail ? <Mail className="w-3.5 h-3.5" /> : isInvoice ? <Receipt className="w-3.5 h-3.5" /> : isDemandLetter || isCeaseAndDesist ? <Scale className="w-3.5 h-3.5" /> : isServiceAgreement ? <Briefcase className="w-3.5 h-3.5" /> : isMaintenance ? <Wrench className="w-3.5 h-3.5" /> : isContractor ? <UserCheck className="w-3.5 h-3.5" /> : isSignOff ? <ClipboardCheck className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} 
              {badgeText}
            </div>
            <div className="text-slate-400 text-xs font-medium">Updated {new Date().getFullYear()}</div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Stop losing money on <br className="hidden md:block"/>
            <span className={textColors}>{title}</span> projects.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {doc.pain_point_hook || `Handshake deals are risky. Define your scope and protect your time with a formal, written agreement.`}
          </p>
          
          {doc.legal_tip && (
             <div className={`max-w-2xl mx-auto border p-4 rounded-xl mb-8 flex gap-4 text-left ${
                 isEmail ? 'bg-indigo-900/30 border-indigo-500/30' 
                 : isInvoice ? 'bg-emerald-900/30 border-emerald-500/30' 
                 : isProposal ? 'bg-amber-900/30 border-amber-500/30' 
                 : isRetainer ? 'bg-violet-900/30 border-violet-500/30' 
                 : isChangeOrder ? 'bg-rose-900/30 border-rose-500/30' 
                 : isScopeOfWork ? 'bg-cyan-900/30 border-cyan-500/30' 
                 : isWorkOrder ? 'bg-orange-900/30 border-orange-500/30' 
                 : isSubcontractor ? 'bg-teal-900/30 border-teal-500/30'
                 : isNDA ? 'bg-zinc-900/30 border-zinc-500/30'
                 : isDemandLetter ? 'bg-red-900/30 border-red-500/30'
                 : isCeaseAndDesist ? 'bg-stone-900/30 border-stone-500/30'
                 : isServiceAgreement ? 'bg-fuchsia-900/30 border-fuchsia-500/30'
                 : isMaintenance ? 'bg-lime-900/30 border-lime-500/30'
                 : isContractor ? 'bg-sky-900/30 border-sky-500/30'
                 : isSignOff ? 'bg-pink-900/30 border-pink-500/30'
                 : 'bg-blue-900/30 border-blue-500/30'}`}>
                <div className={`p-2 rounded-lg shrink-0 h-fit ${
                    isEmail ? 'bg-indigo-500/20' 
                    : isInvoice ? 'bg-emerald-500/20' 
                    : isProposal ? 'bg-amber-500/20' 
                    : isRetainer ? 'bg-violet-500/20' 
                    : isChangeOrder ? 'bg-rose-500/20' 
                    : isScopeOfWork ? 'bg-cyan-500/20' 
                    : isWorkOrder ? 'bg-orange-500/20' 
                    : isSubcontractor ? 'bg-teal-500/20'
                    : isNDA ? 'bg-zinc-500/20'
                    : isDemandLetter ? 'bg-red-500/20'
                    : isCeaseAndDesist ? 'bg-stone-500/20'
                    : isServiceAgreement ? 'bg-fuchsia-500/20'
                    : isMaintenance ? 'bg-lime-500/20'
                    : isContractor ? 'bg-sky-500/20'
                    : isSignOff ? 'bg-pink-500/20'
                    : 'bg-blue-500/20'}`}>
                   <Shield className={`w-5 h-5 ${textColors}`} />
                </div>
                <div>
                   <h3 className={`font-bold text-xs uppercase mb-1 ${textColors}`}>Pro Tip</h3>
                   <p className="text-sm leading-relaxed text-slate-200">{doc.legal_tip}</p>
                </div>
             </div>
          )}

          <div className="flex justify-center">
             <Link href={isEmail ? "/login" : `/create?template=${params.slug}`}>
                <button className={`font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all text-white flex items-center gap-2 ${themeColors} hover:opacity-90`}>
                  {ctaText}
                </button>
             </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-16">
         <div className="grid md:grid-cols-3 gap-6">
            {displayRisks.slice(0,3).map((risk: any, i: number) => {
                const Icon = risk.icon || dynamicRiskIcons[i];
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-12 gap-12 lg:gap-20">
        
        <div className="lg:col-span-5 flex flex-col">
          
          <section className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-6 relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${themeColors}`}></div>
             <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
               <Award className={`w-5 h-5 ${textColors}`} /> Built from real freelance projects
             </h3>
             <p className="text-slate-600 text-sm leading-relaxed">
               This template is based on real-world scenarios across freelance projects where unclear scope, missing payment terms, and revision creep led to lost revenue. It is designed to protect your time, define expectations, and ensure you get paid.
             </p>
          </section>

          {doc.snippet_answer && (
            <div className="mb-10 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${textColors}`} />
                  What is a {title} {docType}?
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">{doc.snippet_answer}</p>
              </div>
              {doc.ai_summary && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">Quick Summary</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{doc.ai_summary}</p>
                </div>
              )}
            </div>
          )}

          {doc.why_it_matters && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Why {title}s need a clear {docType.toLowerCase()}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {doc.why_it_matters}
              </p>
            </section>
          )}

          {!isEmail && !isNDA && !isDemandLetter && !isCeaseAndDesist && !isSignOff && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 text-slate-900">
                Do you need an invoice or a contract?
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Invoices help you get paid, but they do not define scope, revisions, or ownership. For most projects, professionals use both a contract and an invoice to protect their work and cash flow. MicroFreelanceHub bundles both into a single link.
              </p>
            </section>
          )}

          {doc.real_world_scenario && (
            <section className="mb-10 bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                 <Shield className="w-5 h-5 text-emerald-400" />
                 Real-world scenario
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm">
                {doc.real_world_scenario}
              </p>
            </section>
          )}
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-10">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className={textColors}>{isEmail ? '📬' : isInvoice ? '💸' : isProposal ? '📈' : '🛡️'}</span> What this {docType.toLowerCase()} covers:
            </h3>
            <ul className="space-y-4">
               {listItems.slice(0,6).map((item: string, i: number) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-sm bg-slate-200 ${textColors}`}>✓</div>
                    <span className="font-bold text-slate-900">{item}</span>
                  </li>
               ))}
            </ul>
          </div>

          {doc.pricing_guidance && (
             <section className="mb-10">
               <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <TrendingUp className={`w-5 h-5 ${textColors}`} /> Pricing & Payment Strategy
               </h3>
               <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-100">
                 {doc.pricing_guidance}
               </p>
             </section>
          )}

          {Array.isArray(bestPractices) && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                Best practices for {title}s
              </h2>
              <div className="space-y-4">
                {bestPractices.map((item: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                    <h3 className="font-bold text-slate-900 mb-2 text-sm">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div id="email-preview" className="lg:col-span-7 relative lg:sticky lg:top-24 h-fit">
          <div className="relative">
            <div className={`absolute inset-0 transform rotate-1 rounded-2xl opacity-10 ${themeColors}`}></div>
            
            <div className={`relative bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col ${isEmail ? 'h-fit' : 'h-[550px] md:h-[700px]'}`}>
              <div className="bg-slate-100 border-b border-slate-200 p-2 md:p-3 flex gap-2 items-center shrink-0">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
                <span className="ml-auto text-[10px] md:text-xs font-mono text-slate-400">READ ONLY PREVIEW</span>
              </div>

              {isEmail ? (
                <>
                  <div className="p-5 md:p-8 text-xs md:text-sm leading-relaxed max-w-none text-slate-700 whitespace-pre-wrap [&_h3]:font-bold [&_h3]:text-sm md:[&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-slate-900 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:mb-1">
                    <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-4 mb-6">
                      Draft: Past Due Notice
                    </h3>
                    <div dangerouslySetInnerHTML={{ __html: doc.content || '<p>Loading email draft...</p>' }} />
                  </div>
                  
                  <div className="bg-indigo-50 border-t border-indigo-100 p-6 text-center shrink-0">
                     <h3 className="font-bold text-slate-900 text-lg mb-2">Tired of sending these manually?</h3>
                     <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                       With MicroFreelanceHub, you never have to chase payments again. Send your invoice and our system automatically sends polite, firm follow-ups with a one-click payment link.
                     </p>
                     <Link href="/login">
                       <button className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-md w-full sm:w-auto">
                         Automate Invoices & Follow-Ups (Free)
                       </button>
                     </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-5 md:p-8 text-xs md:text-sm leading-relaxed overflow-y-auto pb-48 md:pb-64 max-w-none text-slate-700 whitespace-pre-wrap [&_h3]:font-bold [&_h3]:text-sm md:[&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-slate-900 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:mb-1">
                    {doc.content ? (
                      <div dangerouslySetInnerHTML={{ __html: doc.content }} />
                    ) : (
                      <div>
                          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-slate-900">
                                {isInvoice ? 'INVOICE' : isEstimate ? 'ESTIMATE' : isQuote ? 'QUOTE' : isRetainer ? 'RETAINER AGREEMENT' : isChangeOrder ? 'CHANGE ORDER' : isScopeOfWork ? 'SCOPE OF WORK' : isWorkOrder ? 'WORK ORDER' : isSubcontractor ? 'SUBCONTRACTOR AGREEMENT' : isNDA ? 'NON-DISCLOSURE AGREEMENT' : isDemandLetter ? 'DEMAND LETTER' : isCeaseAndDesist ? 'CEASE & DESIST' : isServiceAgreement ? 'SERVICE AGREEMENT' : isMaintenance ? 'MAINTENANCE AGREEMENT' : isContractor ? 'CONTRACTOR AGREEMENT' : isSignOff ? 'PROJECT SIGN-OFF' : 'Statement of Work'}
                            </h2>
                            <span className="text-xs md:text-sm font-mono text-slate-500">REF: {new Date().getFullYear()}-001</span>
                          </div>

                          <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Covered Provisions</h3>
                            <p className="text-slate-600 mb-3">This document officially outlines the following parameters:</p>
                            <ul className="space-y-2 pl-2">
                              {listItems.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-slate-800 font-medium">
                                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${themeColors}`}></div>
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {Array.isArray(scopeCreep) && !isInvoice && (
                            <div className={`mb-6 p-4 border rounded-lg ${
                                isWorkOrder ? 'bg-orange-50 border-orange-100' : 
                                isNDA ? 'bg-zinc-50 border-zinc-200' :
                                isSubcontractor ? 'bg-teal-50 border-teal-100' :
                                isDemandLetter ? 'bg-red-50 border-red-200' :
                                isCeaseAndDesist ? 'bg-stone-50 border-stone-200' :
                                isServiceAgreement ? 'bg-fuchsia-50 border-fuchsia-200' :
                                isMaintenance ? 'bg-lime-50 border-lime-200' :
                                isContractor ? 'bg-sky-50 border-sky-200' :
                                isSignOff ? 'bg-pink-50 border-pink-200' :
                                'bg-red-50 border-red-100'
                            }`}>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                                    isWorkOrder ? 'text-orange-800' : 
                                    isNDA ? 'text-zinc-800' :
                                    isSubcontractor ? 'text-teal-800' :
                                    isDemandLetter ? 'text-red-800' :
                                    isCeaseAndDesist ? 'text-stone-800' :
                                    isServiceAgreement ? 'text-fuchsia-800' :
                                    isMaintenance ? 'text-lime-800' :
                                    isContractor ? 'text-sky-800' :
                                    isSignOff ? 'text-pink-800' :
                                    'text-red-800'
                                }`}>
                                  {isWorkOrder ? 'Job Execution Details' : 
                                   isNDA ? 'Protected Confidential Information' : 
                                   isSubcontractor ? 'Subcontractor Restrictions' : 
                                   isDemandLetter ? 'Consequences of Non-Payment' :
                                   isCeaseAndDesist ? 'Demanded Actions' :
                                   isServiceAgreement ? 'Service Limitations' :
                                   isMaintenance ? 'Maintenance Exclusions' :
                                   isContractor ? 'Contractor Classifications' :
                                   isSignOff ? 'Acceptance Terms' :
                                   'Exclusions (Out of Scope)'}
                                </h3>
                                <ul className="space-y-2">
                                    {scopeCreep.map((item: string, i: number) => (
                                        <li key={i} className={`flex items-start gap-2 text-xs ${
                                            isWorkOrder ? 'text-orange-900' : 
                                            isNDA ? 'text-zinc-900' :
                                            isSubcontractor ? 'text-teal-900' :
                                            isDemandLetter ? 'text-red-900' :
                                            isCeaseAndDesist ? 'text-stone-900' :
                                            isServiceAgreement ? 'text-fuchsia-900' :
                                            isMaintenance ? 'text-lime-900' :
                                            isContractor ? 'text-sky-900' :
                                            isSignOff ? 'text-pink-900' :
                                            'text-red-900'
                                        }`}>
                                          <span className="font-bold">
                                            {isWorkOrder ? '•' : isNDA ? '🔒' : isSubcontractor ? '🚫' : isDemandLetter || isCeaseAndDesist ? '⚠️' : isContractor ? '👤' : isSignOff ? '✅' : '×'}
                                          </span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-48 md:h-72 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-6 md:pb-12 px-4 md:px-6 pointer-events-auto">
                     <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full text-center transform transition-transform hover:-translate-y-1 md:hover:-translate-y-2">
                        <Lock className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 ${textColors}`} />
                        <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1 md:mb-2">Ready to use this template?</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 mb-3 md:mb-4">Create a free account to customize this document, collect e-signatures, and attach a Stripe payment link.</p>
                        <Link href={`/create?template=${params.slug}`}>
                          <button className={`w-full py-2.5 md:py-3 rounded-lg font-bold text-white text-sm md:text-base shadow-md transition-colors ${themeColors}`}>
                            Unlock & Send Template
                          </button>
                        </Link>
                     </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 flex gap-3 text-left relative z-10">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed">
              <strong>Legal Disclaimer:</strong> MicroFreelanceHub is a software workflow tool, not a law firm. The templates and information provided on this website are for general informational purposes only and do not constitute legal advice.
            </p>
          </div>
        </div>

      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 border-t border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq: any, index: number) => (
            <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg mb-2">{faq.q}</h3>
              <p className="text-slate-600 leading-relaxed">{faq.a}</p>
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