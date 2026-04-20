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
  CheckCircle2,
  Lock
} from 'lucide-react';
import RelatedRoles from '../../components/seo/RelatedRoles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize Supabase (Public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 🧠 THE BRAIN: Smart Slug Resolver ---
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

// --- METADATA ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Template Not Found' };
  
  const { doc, source } = result;
  const title = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const displayTitle = toTitleCase(title);
  
  // 🧠 Determine Mode for Metadata
  const isEmail = params.slug.startsWith('late-payment-email');
  const documentType = doc.document_type || 'Contract'; // Fallback to Contract
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

// --- MAIN PAGE ---
export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return notFound();

  const { doc, source } = result;

  if (doc.document_type === 'Comparison') {
      redirect(`/alternatives/${params.slug}`);
  }
  
  const jobTitleRaw = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const title = toTitleCase(jobTitleRaw);
  const price = source === 'sow' ? doc.price : 0;
  
  // 🧠 THE UPGRADED CHAMELEON ENGINE LOGIC
  const isEmail = params.slug.startsWith('late-payment-email');
  const docType = doc.document_type || 'Contract';
  
  const isInvoice = !isEmail && docType === 'Invoice';
  const isEstimate = !isEmail && docType === 'Estimate';
  const isQuote = !isEmail && docType === 'Quote';
  const isContract = !isEmail && !isInvoice && !isEstimate && !isQuote;

  // Set Theme Colors (Amber for Quotes/Estimates to look distinct)
  const isProposal = isEstimate || isQuote;
  const badgeText = isEmail ? 'Email Templates' : `${docType} Template`;
  const mainHeaderLabel = isEmail ? 'Late Payment Emails' : (isContract ? 'Service Agreement' : `${docType} Template`);

  const painPoint = doc.pain_point_hook || (isInvoice 
    ? `Stop acting like a bank. Send a professional ${title} Invoice and get paid instantly via credit card or ACH.` 
    : isProposal 
    ? `Don't work for free. Send a professional ${docType} that builds trust and secures an upfront deposit.`
    : `Handshake deals are risky. Define your scope and protect your time with a solid agreement.`);
    
  const legalTip = doc.legal_tip;
  
  const rawDeliverables = doc.deliverables;
  const listItems = Array.isArray(rawDeliverables) 
    ? rawDeliverables 
    : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Item 1", "Item 2", "Item 3"]);

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
    ? `Upon approval of this ${docType}, the terms will transition into a binding Service Agreement. A deposit will be required before work commences via our secure portal.`
    : `The Contractor agrees to perform the ${title} services in a professional manner, using the degree of skill and care that is required by current industry standards.`;

  let relatedDocs = [];
  if (doc.batch_label) {
    const { data } = await supabase.from('seo_pages')
      .select('slug, job_title')
      .eq('batch_label', doc.batch_label)
      .neq('slug', params.slug)
      .limit(3);
    relatedDocs = data || [];
  }

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

  const faqs = parsedFaqs 
    ? parsedFaqs 
    : [
        {
          q: `What is a ${title} ${docType}?`,
          a: `A professional document used to protect your business. Our free tools help you run your freelance business like a high-end agency.`
        }
      ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq: any) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* HEADER */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${
                isEmail ? 'bg-indigo-600' : isInvoice ? 'bg-emerald-600' : isProposal ? 'bg-amber-600' : 'bg-blue-600'
            }`}>
              {isEmail ? <Mail className="w-3.5 h-3.5" /> : isInvoice ? <Receipt className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} 
              {badgeText}
            </div>
            <div className="text-slate-400 text-xs font-medium">Updated {new Date().getFullYear()}</div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Free <span className={
                isEmail ? "text-indigo-400" : isInvoice ? "text-emerald-400" : isProposal ? "text-amber-400" : "text-blue-400"
            }>{title}</span> <br className="hidden md:block"/>
            <span className="text-white">{mainHeaderLabel}</span>
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
                   <Shield className={`w-5 h-5 ${
                       isEmail ? 'text-indigo-400' : isInvoice ? 'text-emerald-400' : isProposal ? 'text-amber-400' : 'text-blue-400'
                   }`} />
                </div>
                <div>
                   <h3 className={`font-bold text-xs uppercase mb-1 ${
                       isEmail ? 'text-indigo-400' : isInvoice ? 'text-emerald-400' : isProposal ? 'text-amber-400' : 'text-blue-400'
                   }`}>
                       {isEmail ? 'Collections Tip' : isInvoice ? 'Cash Flow Tip' : isProposal ? 'Conversion Tip' : 'Pro Contractor Tip'}
                   </h3>
                   <p className={`text-sm leading-relaxed ${
                       isEmail ? 'text-indigo-100' : isInvoice ? 'text-emerald-100' : isProposal ? 'text-amber-100' : 'text-blue-100'
                   }`}>{legalTip}</p>
                </div>
             </div>
          )}

          {/* Hero CTA */}
          {isEmail ? (
            <Link href="/login">
              <button className="font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all bg-indigo-500 text-white hover:bg-indigo-400">
                🚀 Automate These Emails
              </button>
            </Link>
          ) : (
            <Link href={`/create?template=${params.slug}`}>
              <button className={`font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all ${
                  isInvoice ? 'bg-emerald-500 text-white hover:bg-emerald-400' : isProposal ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-white text-blue-900 hover:bg-blue-50'
              }`}>
                ✨ Customize This {docType}
              </button>
            </Link>
          )}

        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* LEFT: Educational Content */}
        <div className="flex flex-col">
          
          {/* Section 1: The 'Why' */}
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {isEmail ? 'Why use an automated sequence?' : isInvoice ? 'Why use a digital invoice?' : isEstimate ? 'Why use a professional estimate?' : isQuote ? 'Why use a fixed quote?' : 'Why use a written agreement?'}
            </h2>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              {isEmail ? (
                <>
                  Chasing money ruins client relationships. As a <strong className="font-bold text-slate-900">{title}</strong>, sending desperate, unstructured emails makes you look unprofessional. Using an escalating, structured email sequence removes the emotion and sets clear boundaries.
                </>
              ) : isInvoice ? (
                <>
                  Paper invoices get lost. PDFs get ignored. As a <strong className="font-bold text-slate-900">{title}</strong>, cash flow is everything. Sending a digital invoice with a "Pay Now" button gets you paid 3x faster.
                </>
              ) : isEstimate ? (
                <>
                  Clients want to know what to expect. As a <strong className="font-bold text-slate-900">{title}</strong>, sending a clean, professional estimate builds trust and sets clear boundaries before you lock in a final price.
                </>
              ) : isQuote ? (
                <>
                  Stop haggling over email. As a <strong className="font-bold text-slate-900">{title}</strong>, a formal quote locks in your scope and allows you to demand a deposit before you start working.
                </>
              ) : (
                <>
                  Handshake deals are risky. As a <strong className="font-bold text-slate-900">{title}</strong>, "scope creep" is your biggest enemy. A clear agreement ensures everyone agrees on the deliverables before money changes hands.
                </>
              )}
            </p>
          </div>
          
          {/* Section 2: What's Included */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-10">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className={
                  isEmail ? "text-indigo-600" : isInvoice ? "text-emerald-600" : isProposal ? "text-amber-600" : "text-blue-600"
              }>{isEmail ? '📬' : isInvoice ? '💸' : isProposal ? '📈' : '🛡️'}</span> What this {docType.toLowerCase()} covers:
            </h3>
            <ul className="space-y-4">
               {(isEmail 
                 ? ['Day 3: The "Gentle Reminder"', 'Day 15: The Firm Notice', 'Day 30: Final Demand', 'Stop-Work Order Phrasing', 'Professional Escalation']
                 : isInvoice 
                 ? ['Itemized Labor & Materials', 'Automatic Tax Calculation', 'Instant "Pay Now" Button', 'Late Fee Terms', 'Professional Branding'] 
                 : isProposal
                 ? ['Itemized Deliverables Breakdown', 'One-Click Client Approval', 'Automatic Deposit Collection', 'Seamless Contract Conversion', 'Professional Presentation']
                 : ['Deliverables List', 'Payment Terms', 'IP Rights', 'Revision Limits', 'Cancellation Policy']
               ).map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                        isEmail ? 'bg-indigo-100 text-indigo-600' : isInvoice ? 'bg-emerald-100 text-emerald-600' : isProposal ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>✓</div>
                    <span className="font-bold text-slate-900">{item}</span>
                  </li>
               ))}
            </ul>
          </div>

          {/* Section 3: CTA Box */}
          <div className={`p-6 rounded-xl border mt-auto ${
              isEmail ? 'bg-indigo-50 border-indigo-100' : isInvoice ? 'bg-emerald-50 border-emerald-100' : isProposal ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
          }`}>
            <h4 className={`font-bold mb-2 text-lg ${
                isEmail ? 'text-indigo-900' : isInvoice ? 'text-emerald-900' : isProposal ? 'text-amber-900' : 'text-blue-900'
            }`}>
                {isEmail ? 'Tired of copy-pasting?' : 'Ready to send?'}
            </h4>
            <p className="text-slate-700 mb-4 leading-relaxed">
              {isEmail
                ? 'Stop doing this manually. MicroFreelanceHub will automatically send these exact emails on days 3, 15, and 30 for you.'
                : (isInvoice ? 'Our AI will organize your line items and calculate totals automatically.' : 'Our AI will fill in the client\'s name, dates, and specific project details for you.')}
            </p>
            <Link href={isEmail ? `/login` : `/create?template=${params.slug}`} className={`font-bold hover:underline flex items-center gap-1 ${
                isEmail ? 'text-indigo-700' : isInvoice ? 'text-emerald-700' : isProposal ? 'text-amber-700' : 'text-blue-600'
            }`}>
              {isEmail ? 'Create your free account \u2192' : 'Start building now \u2192'}
            </Link>
          </div>
        </div>

        {/* RIGHT: The Preview Window */}
        <div id="email-preview" className="relative lg:sticky lg:top-24 h-fit">
          <div className={`absolute inset-0 transform rotate-1 rounded-2xl ${
              isEmail ? 'bg-indigo-600/5' : isInvoice ? 'bg-emerald-600/5' : isProposal ? 'bg-amber-600/5' : 'bg-blue-600/5'
          }`}></div>
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[800px]">
            
            {/* Mock Browser Bar */}
            <div className="bg-slate-100 border-b border-slate-200 p-3 flex gap-2 items-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-auto text-xs font-mono text-slate-400">READ ONLY PREVIEW</span>
            </div>

            {/* Document Content Scroll Area */}
            <div className="p-6 md:p-8 text-sm leading-relaxed overflow-y-auto">
              
              {isEmail ? (
                // 📧 EMAIL UI MODE
                <div className="space-y-6 pb-20 relative">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-6">
                      Email Drafts
                  </h2>
                  {listItems.map((emailText: string, i: number) => {
                      const labels = ['Day 3: Gentle Reminder', 'Day 15: Firm Notice', 'Day 30: Final Demand'];
                      return (
                        <div key={i} className={`border border-slate-200 rounded-lg overflow-hidden shadow-sm ${i >= 2 ? 'blur-sm select-none opacity-40 pointer-events-none' : ''}`}>
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                              <span className="font-bold text-xs text-indigo-700 uppercase tracking-wider">{labels[i] || `Draft ${i+1}`}</span>
                          </div>
                          <div className="p-4 bg-white text-slate-700 whitespace-pre-wrap font-sans text-[13px] md:text-sm">
                              {emailText}
                          </div>
                        </div>
                      )
                  })}

                  {/* Paywall Overlay for Freemium Tease */}
                  {listItems.length > 2 && (
                    <div className="absolute inset-0 top-[35%] bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-center z-10">
                      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm shadow-xl">
                        <Lock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-700 font-semibold mb-6">
                          Create a free account to unlock the Legal Escalation templates (and automate sending).
                        </p>
                        <Link href="/login">
                          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors w-full">
                            Unlock Free Templates
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 📄 CONTRACT / INVOICE / ESTIMATE / QUOTE UI MODE
                <div className="pb-20">
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
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                isInvoice ? 'bg-emerald-600' : isProposal ? 'bg-amber-600' : 'bg-blue-600'
                            }`}></div>
                            <span className="leading-relaxed">{item}</span>
                            {(isInvoice || isProposal) && <span className="ml-auto font-mono text-slate-400">$0.00</span>}
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

                    <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                      <span className="font-bold text-slate-600">Total {isInvoice ? 'Due' : isEstimate ? 'Estimated' : 'Value'}</span>
                      <span className="font-bold text-xl md:text-2xl text-slate-900">
                        {price > 0 ? `$${price.toLocaleString()}` : (isInvoice ? '$0.00' : 'Variable')}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-6">
                      <p className="mb-2"><strong>TERMS & CONDITIONS (Summary):</strong></p>
                      <p>1. <strong>Payment:</strong> {isInvoice ? 'Due upon receipt.' : '50% Deposit required.'}</p>
                      <p>2. <strong>Copyright:</strong> Rights transfer to Client upon full payment.</p>
                      <p className="mt-4 italic text-[9px] text-slate-300">Disclaimer: This template is for educational purposes only.</p>
                    </div>
                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              {!isEmail && (
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-6">
                  <Link href={`/create?template=${params.slug}`}>
                    <button className={`text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:-translate-y-1 ${
                        isInvoice ? 'bg-emerald-900 hover:bg-emerald-800' : isProposal ? 'bg-amber-700 hover:bg-amber-800' : 'bg-slate-900 hover:bg-slate-800'
                    }`}>
                      Use This {docType} Free &rarr;
                    </button>
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* FAQ SECTION */}
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

      {/* WIDGET */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
          <RelatedRoles currentSlug={params.slug} batchLabel={doc.batch_label} />
      </div>

    </div>
  );
}