import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import {
  Shield,
  FileText,
  ArrowRight,
  Receipt,
  Mail, 
  Lock,
  Ghost,
  Ban,
  Clock,
  PenTool,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import RelatedRoles from '../../components/seo/RelatedRoles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  
  const { doc, source } = result;
  const title = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const displayTitle = toTitleCase(title);
  
  const isEmail = params.slug.startsWith('late-payment-email');
  const documentType = doc.document_type || 'Contract';
  const label = isEmail ? 'Late Payment Emails' : documentType;
  
  let metaDescription = '';
  if (isEmail) {
    metaDescription = `Download professional, escalated late payment email templates for ${displayTitle}s. Stop chasing checks manually.`;
  } else if (documentType === 'Invoice') {
    metaDescription = `Create and send a professional ${displayTitle} invoice in seconds. Stop waiting for checks with this free, mobile-friendly invoice generator.`;
  } else if (documentType === 'Estimate') {
    metaDescription = `Create and send a professional ${displayTitle} estimate. Convert approvals instantly into contracts and Stripe deposits.`;
  } else if (documentType === 'Quote') {
    metaDescription = `Send a fixed-price ${displayTitle} quote. Lock in the scope, get the signature, and collect the deposit in one link.`;
  } else {
    metaDescription = `Download a free, professional ${displayTitle} contract template. Protect your business from scope creep with this industry-standard agreement.`;
  }

  return {
    title: `Free ${displayTitle} ${label} (2026)`,
    description: metaDescription,
    keywords: [`${displayTitle} ${label}`, `Free ${displayTitle} template`, 'MicroFreelanceHub'],
    alternates: { canonical: `https://www.microfreelancehub.com/templates/${params.slug}` },
    openGraph: { title: `Free ${displayTitle} ${label}`, description: metaDescription, type: 'website' }
  };
}

export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return notFound();

  const { doc, source } = result;

  if (doc.document_type === 'Comparison') {
      redirect(`/alternatives/${params.slug}`);
  }
  
  const jobTitleRaw = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const title = toTitleCase(jobTitleRaw);
  
  const isEmail = params.slug.startsWith('late-payment-email');
  const docType = doc.document_type || 'Contract';
  
  const isInvoice = !isEmail && docType === 'Invoice';
  const isEstimate = !isEmail && docType === 'Estimate';
  const isQuote = !isEmail && docType === 'Quote';
  const isContract = !isEmail && !isInvoice && !isEstimate && !isQuote;
  const isProposal = isEstimate || isQuote;

  const badgeText = isEmail ? 'Email Templates' : `${docType} Template`;

  const painPoint = doc.pain_point_hook || (isInvoice 
    ? `Stop acting like a bank. Send a professional ${title} Invoice and facilitate instant payments via credit card or ACH.` 
    : isProposal 
    ? `Set clear expectations. Send a professional ${docType} that builds trust and helps secure an upfront deposit.`
    : `Handshake deals are risky. Define your scope and protect your time with a formal, written agreement.`);
    
  const legalTip = doc.legal_tip;

  const rawDeliverables = doc.deliverables;
  const listItems = Array.isArray(rawDeliverables) 
    ? rawDeliverables 
    : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Deliverable Phase 1", "Deliverable Phase 2", "Deliverable Phase 3"]);

  const introParagraph = isInvoice
    ? `This Invoice is for professional ${title} services rendered. By using this digital template, you can enable instant payments and automatic tax calculations.`
    : isEstimate
    ? `This document is a good-faith Estimate for professional ${title} services. It outlines approximate costs based on initial discussions and is subject to change.`
    : isQuote
    ? `This document is a fixed-price Quote for professional ${title} services. Pricing is valid for 30 days from the date of issue.`
    : `This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services.`;
  
  const standardsParagraph = isInvoice
    ? `Payment is due upon receipt. Late payments may be subject to a fee. Please make checks payable to the Contractor or use the secure payment link provided.`
    : isProposal
    ? `Upon approval of this ${docType}, the terms will transition into a binding Service Agreement. A deposit may be required before work commences via our secure portal.`
    : `The Contractor agrees to perform the ${title} services in a professional manner, using the degree of skill and care that is required by current industry standards.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `MicroFreelanceHub - Free ${title} ${badgeText}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: `A free software tool to generate, customize, and send a professional ${title} ${badgeText.toLowerCase()} instantly.`,
    featureList: isEmail ? 'Automated Dunning, Polite Reminders, Firm Escalations' : (isInvoice ? 'Instant Payments, Tax Calculation, Mobile Friendly' : 'eSignatures, Scope of Work, Liability Protection')
  };

  let parsedFaqs = null;
  if (doc.faqs) {
    try {
      let tempFaqs = typeof doc.faqs === 'string' ? JSON.parse(doc.faqs) : doc.faqs;
      if (tempFaqs && !Array.isArray(tempFaqs) && tempFaqs.faqs && Array.isArray(tempFaqs.faqs)) {
         tempFaqs = tempFaqs.faqs;
      }
      if (Array.isArray(tempFaqs) && tempFaqs.length > 0) {
         parsedFaqs = tempFaqs;
      }
    } catch (e) {
      console.error("Failed to parse FAQs from DB", e);
    }
  }

  const faqs = parsedFaqs || [
        {
          q: `What is a ${title} ${docType}?`,
          a: `A professional document used to help organize and protect your business. Our free tools help you run your freelance business like a high-end agency.`
        }
      ];

  const themeColors = isEmail ? 'bg-indigo-600' : isInvoice ? 'bg-emerald-600' : isProposal ? 'bg-amber-600' : 'bg-blue-600';
  const textColors = isEmail ? 'text-indigo-400' : isInvoice ? 'text-emerald-400' : isProposal ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HEADER */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${themeColors}`}>
              {isEmail ? <Mail className="w-3.5 h-3.5" /> : isInvoice ? <Receipt className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} 
              {badgeText}
            </div>
            <div className="text-slate-400 text-xs font-medium">Updated {new Date().getFullYear()}</div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Stop losing money on <br className="hidden md:block"/>
            <span className={textColors}>{title}</span> projects.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {painPoint}
          </p>
          
          {legalTip && (
             <div className={`max-w-2xl mx-auto border p-4 rounded-xl mb-8 flex gap-4 text-left ${
                 isEmail ? 'bg-indigo-900/30 border-indigo-500/30' : isInvoice ? 'bg-emerald-900/30 border-emerald-500/30' : isProposal ? 'bg-amber-900/30 border-amber-500/30' : 'bg-blue-900/30 border-blue-500/30'
             }`}>
                <div className={`p-2 rounded-lg shrink-0 h-fit ${
                    isEmail ? 'bg-indigo-500/20' : isInvoice ? 'bg-emerald-500/20' : isProposal ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}>
                   <Shield className={`w-5 h-5 ${textColors}`} />
                </div>
                <div>
                   <h3 className={`font-bold text-xs uppercase mb-1 ${textColors}`}>
                       {isEmail ? 'Collections Tip' : isInvoice ? 'Cash Flow Tip' : isProposal ? 'Conversion Tip' : 'Pro Contractor Tip'}
                   </h3>
                   <p className="text-sm leading-relaxed text-slate-200">{legalTip}</p>
                </div>
             </div>
          )}

          {/* Hero CTA */}
          <div className="flex justify-center">
            {isEmail ? (
              <Link href="/login">
                <button className={`font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all text-white ${themeColors} hover:opacity-90`}>
                  🚀 Automate These Emails
                </button>
              </Link>
            ) : (
              <Link href={`/create?template=${params.slug}`}>
                <button className={`font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all text-white flex items-center gap-2 ${themeColors} hover:opacity-90`}>
                  Create & Send This {docType} <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* COST OF DOING NOTHING */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-16">
         <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Ghost className="w-6 h-6 text-red-500" />
               </div>
               <h3 className="font-bold text-slate-900 mb-2">Client Ghosting</h3>
               <p className="text-sm text-slate-600">Without upfront financial commitment, clients can disappear mid-project.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                  <Ban className="w-6 h-6 text-orange-500" />
               </div>
               <h3 className="font-bold text-slate-900 mb-2">Infinite Revisions</h3>
               <p className="text-sm text-slate-600">Without a documented scope of work, you risk doing unpaid tweaks forever.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-amber-500" />
               </div>
               <h3 className="font-bold text-slate-900 mb-2">Chasing Checks</h3>
               <p className="text-sm text-slate-600">Waiting 30 days for a paper check severely impacts freelance cash flow.</p>
            </div>
         </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-12 gap-12 lg:gap-20">
        
        {/* LEFT: Educational Content */}
        <div className="lg:col-span-5 flex flex-col">
          
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {isEmail ? 'Why use an automated sequence?' : isInvoice ? 'Why use a digital invoice?' : isEstimate ? 'Why use a professional estimate?' : isQuote ? 'Why use a fixed quote?' : 'Why use a written agreement?'}
            </h2>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              {isEmail ? (
                <>Chasing money ruins client relationships. As a <strong className="font-bold text-slate-900">{title}</strong>, sending desperate, unstructured emails makes you look unprofessional. Using an escalating, structured email sequence removes the emotion and sets clear boundaries.</>
              ) : isInvoice ? (
                <>Paper invoices get lost. PDFs get ignored. As a <strong className="font-bold text-slate-900">{title}</strong>, cash flow is everything. Sending a digital invoice with a "Pay Now" button gets you paid faster.</>
              ) : isEstimate ? (
                <>Clients want to know what to expect. As a <strong className="font-bold text-slate-900">{title}</strong>, sending a clean, professional estimate builds trust and sets clear boundaries before you lock in a final price.</>
              ) : isQuote ? (
                <>Stop haggling over email. As a <strong className="font-bold text-slate-900">{title}</strong>, a formal quote locks in your scope and allows you to request a deposit before you start working.</>
              ) : (
                <>Handshake deals are risky. As a <strong className="font-bold text-slate-900">{title}</strong>, "scope creep" is your biggest enemy. A clear agreement ensures everyone understands the deliverables before work begins.</>
              )}
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-10">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className={textColors}>{isEmail ? '📬' : isInvoice ? '💸' : isProposal ? '📈' : '🛡️'}</span> What this {docType.toLowerCase()} covers:
            </h3>
            <ul className="space-y-4">
               {(isEmail 
                 ? ['Day 3: The "Gentle Reminder"', 'Day 15: The Firm Notice', 'Day 30: Final Demand', 'Stop-Work Order Phrasing', 'Professional Escalation']
                 : isInvoice 
                 ? ['Itemized Labor & Materials', 'Automatic Tax Calculation', 'Instant "Pay Now" Button', 'Late Fee Terms', 'Professional Branding'] 
                 : isProposal
                 ? ['Itemized Deliverables Breakdown', 'One-Click Client Approval', 'Deposit Collection Settings', 'Seamless Contract Conversion', 'Professional Presentation']
                 : ['Deliverables List', 'Payment Terms', 'IP Rights', 'Revision Limits', 'Cancellation Policy']
               ).map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-sm bg-slate-200 ${textColors}`}>✓</div>
                    <span className="font-bold text-slate-900">{item}</span>
                  </li>
               ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Platform Features</h3>
              <ul className="space-y-5">
                 <li className="flex gap-3">
                    <div className="shrink-0 mt-0.5"><PenTool className={`w-5 h-5 ${textColors}`} /></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">ESIGN-Compliant Workflow</h4>
                      <p className="text-xs text-slate-600 mt-1">Digital signatures built directly into the platform.</p>
                    </div>
                 </li>
                 <li className="flex gap-3">
                    <div className="shrink-0 mt-0.5"><CreditCard className={`w-5 h-5 ${textColors}`} /></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Upfront Deposits</h4>
                      <p className="text-xs text-slate-600 mt-1">Clients can pay immediately upon signing via Stripe integration.</p>
                    </div>
                 </li>
              </ul>
          </div>
        </div>

        {/* RIGHT: The Preview Window */}
        <div id="email-preview" className="lg:col-span-7 relative lg:sticky lg:top-24 h-fit">
          <div className={`absolute inset-0 transform rotate-1 rounded-2xl opacity-10 ${themeColors}`}></div>
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
            
            <div className="bg-slate-100 border-b border-slate-200 p-3 flex gap-2 items-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-auto text-xs font-mono text-slate-400">READ ONLY PREVIEW</span>
            </div>

            {/* 🔥 RESTORED DYNAMIC SEO TEXT: Google reads this perfectly! */}
            <div className="p-8 text-sm leading-relaxed overflow-y-auto pb-64 prose max-w-none text-slate-700">
              {isEmail ? (
                <div className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-6">Email Drafts</h2>
                  {listItems.map((emailText: string, i: number) => {
                      const labels = ['Day 3: Gentle Reminder', 'Day 15: Firm Notice', 'Day 30: Final Demand'];
                      return (
                        <div key={i} className={`border border-slate-200 rounded-lg overflow-hidden shadow-sm`}>
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                              <span className="font-bold text-xs text-indigo-700 uppercase tracking-wider">{labels[i] || `Draft ${i+1}`}</span>
                          </div>
                          <div className="p-4 bg-white text-slate-700 whitespace-pre-wrap font-sans text-[13px] md:text-sm">
                              {emailText}
                          </div>
                        </div>
                      )
                  })}
                </div>
              ) : (
                <div>
                    <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                      <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-slate-900">
                          {isInvoice ? 'INVOICE' : isEstimate ? 'ESTIMATE' : isQuote ? 'QUOTE' : 'Statement of Work'}
                      </h2>
                      <span className="text-xs md:text-sm font-mono text-slate-500">REF: {new Date().getFullYear()}-001</span>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {isInvoice ? '1. Bill To' : '1. Project Background'}
                      </h3>
                      <p className="text-slate-600 text-justify">{introParagraph}</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {isInvoice ? '2. Billable Items' : isProposal ? '2. Estimated Deliverables' : '2. Scope of Services'}
                      </h3>
                      <p className="text-slate-600 mb-3">
                          {isInvoice ? 'The following items are billed for this period:' : 'The Contractor shall provide the following deliverables:'}
                      </p>
                      <ul className="space-y-2 pl-2">
                        {listItems.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-slate-800 font-medium">
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${themeColors}`}></div>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {isInvoice ? '3. Payment Instructions' : isProposal ? '3. Next Steps & Terms' : '3. Performance Standards'}
                      </h3>
                      <p className="text-slate-600 text-justify">{standardsParagraph}</p>
                    </div>
                </div>
              )}
            </div>

            {/* The Fade Gate CTA (Sits on top of the real content) */}
            <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-12 px-6 pointer-events-auto">
               <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full text-center transform transition-transform hover:-translate-y-2">
                  <Lock className={`w-8 h-8 mx-auto mb-3 ${textColors}`} />
                  <h3 className="font-bold text-slate-900 mb-2">Ready to use this template?</h3>
                  <p className="text-xs text-slate-500 mb-4">Create a free account to customize this document, collect e-signatures, and attach a Stripe payment link.</p>
                  <Link href={`/login?plan=pro`}>
                    <button className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-colors ${themeColors}`}>
                      Unlock & Send Template
                    </button>
                  </Link>
               </div>
            </div>

          </div>
          
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
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
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Explore Related Templates</h3>
          <RelatedRoles currentSlug={params.slug} batchLabel={doc.batch_label} />
      </div>

    </div>
  );
}