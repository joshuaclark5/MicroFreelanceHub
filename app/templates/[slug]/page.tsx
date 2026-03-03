import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation'; // <-- Added redirect here
import { Metadata } from 'next';
import { 
  Shield, 
  FileText, 
  ArrowRight,
  Receipt,
  CheckCircle2
} from 'lucide-react';
// 👇 IMPORT THE WIDGET
import RelatedRoles from '../../components/seo/RelatedRoles';

// ☢️ THE NUCLEAR OPTION: Force Next.js to NEVER cache this page.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize Supabase (Public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 🧠 THE BRAIN: Smart Slug Resolver ---
async function findDoc(slug: string) {
  
  // 1. PRIORITY: Check 'sow_documents' (System Templates)
  const { data: sowDoc } = await supabase.from('sow_documents').select('*').eq('slug', slug).single();
  if (sowDoc) return { doc: sowDoc, source: 'sow' };

  // 2. EXACT MATCH: Check 'seo_pages' for the new URL format
  let { data: exactDoc } = await supabase.from('seo_pages').select('*').eq('slug', slug).single();
  if (exactDoc) return { doc: exactDoc, source: 'seo' };

  // 3. 🛡️ SAFETY NET: The "Rescue" Logic
  let baseSlug = slug.replace(/-invoice-template$/, '').replace(/-contract-template$/, '');
  
  if (baseSlug !== slug) {
      const { data: baseDoc } = await supabase.from('seo_pages').select('*').eq('slug', baseSlug).single();
      if (baseDoc) return { doc: baseDoc, source: 'seo' };
  }

  const oldHireSlug = `hire-${baseSlug}`;
  const { data: hireDoc } = await supabase.from('seo_pages').select('*').eq('slug', oldHireSlug).single();
  if (hireDoc) return { doc: hireDoc, source: 'seo' };

  // 4. DICTIONARY: Manual overrides
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

// Helper: Title Case
function toTitleCase(str: string | null) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// --- METADATA (Updated for High CTR & AI Search 🧲🤖) ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Template Not Found' };
  
  const { doc, source } = result;
  const title = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const displayTitle = toTitleCase(title);
  
  const isInvoice = doc.document_type === 'Invoice';
  const label = isInvoice ? 'Invoice' : 'Contract';
  
  // ✅ THE CTR FIX: Safe, highly clickable copy designed for Google Search users.
  const metaDescription = isInvoice
    ? `Create and send a professional ${displayTitle} invoice in seconds. Stop waiting for checks with this free, mobile-friendly invoice generator.`
    : `Download a free, professional ${displayTitle} contract template. Protect your business from scope creep with this industry-standard, ready-to-use agreement.`;

  return {
    title: `Free ${displayTitle} ${label} Template (2026)`,
    description: metaDescription,
    keywords: [
      `${displayTitle} ${label}`, 
      `Free ${displayTitle} template`, 
      isInvoice ? 'Invoice generator' : 'Contract generator',
      'MicroFreelanceHub'
    ],
    alternates: {
      canonical: `https://www.microfreelancehub.com/templates/${params.slug}`,
    },
    openGraph: {
      title: `Free ${displayTitle} ${label} Template`,
      description: metaDescription,
      type: 'website',
    }
  };
}

// --- MAIN PAGE ---
export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return notFound();

  const { doc, source } = result;

  // 🛑 THE BOUNCER: Redirect Competitor pages to the correct folder
  if (doc.document_type === 'Comparison') {
      redirect(`/alternatives/${params.slug}`);
  }
  
  const jobTitleRaw = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const title = toTitleCase(jobTitleRaw);
  const price = source === 'sow' ? doc.price : 0;
  
  const isInvoice = doc.document_type === 'Invoice';

  const painPoint = doc.pain_point_hook || (isInvoice 
    ? `Stop acting like a bank. Send a professional ${title} Invoice and get paid instantly via credit card or ACH.` 
    : `Handshake deals are risky. Define your scope and protect your time with a solid agreement.`);
    
  const legalTip = doc.legal_tip;
  
  const rawDeliverables = doc.deliverables;
  const listItems = Array.isArray(rawDeliverables) 
    ? rawDeliverables 
    : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Item 1", "Item 2", "Item 3"]);

  const introParagraph = isInvoice
    ? `This Invoice is for professional ${title} services rendered. By using this digital template, you can enable instant payments and automatic tax calculations.`
    : `This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services.`;
  
  const standardsParagraph = isInvoice
    ? `Payment is due upon receipt. Late payments may be subject to a fee. Please make checks payable to the Contractor or use the secure payment link provided.`
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

  // ✅ AI SEO FIX: JSON-LD Schema explicitly telling ChatGPT/Gemini this is a Software Tool
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `MicroFreelanceHub - Free ${title} ${isInvoice ? 'Invoice' : 'Contract'} Generator`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: `A free software tool to generate, customize, and send a professional ${title} ${isInvoice ? 'invoice' : 'contract'} instantly.`,
    featureList: isInvoice ? 'Instant Payments, Tax Calculation, Mobile Friendly' : 'eSignatures, Scope of Work, Liability Protection'
  };

  // ✅ AI SEO FIX: HYPER-FORGIVING PARSER
  let parsedFaqs = null;
  
  // 🕵️‍♂️ Debugging Log: Look in your VS Code terminal for this!
  console.log(`\n--- DB DATA FOR [${params.slug}] ---`);
  console.log("SOURCE:", source);
  console.log("RAW FAQS:", doc.faqs);

  if (doc.faqs) {
    try {
      let tempFaqs = typeof doc.faqs === 'string' ? JSON.parse(doc.faqs) : doc.faqs;
      
      // Handle case where AI nested it inside an object like { faqs: [...] }
      if (tempFaqs && !Array.isArray(tempFaqs) && tempFaqs.faqs && Array.isArray(tempFaqs.faqs)) {
         tempFaqs = tempFaqs.faqs;
      }

      // If it's an array and has at least 1 item, we accept it!
      if (Array.isArray(tempFaqs) && tempFaqs.length > 0) {
         parsedFaqs = tempFaqs;
      }
    } catch (e) {
      console.error("Failed to parse FAQs from DB", e);
    }
  }

  console.log("FINAL PARSED FAQS:", parsedFaqs);
  console.log("------------------------------------\n");

  const faqs = parsedFaqs 
    ? parsedFaqs 
    : [
        {
          q: `What is a ${title} ${isInvoice ? 'Invoice' : 'Contract'}?`,
          a: isInvoice 
            ? `A ${title} invoice is a professional billing document used to request payment for services. Our free digital template includes itemized billing, automatic tax calculations, and a secure "Pay Now" button.`
            : `A ${title} contract is a professional agreement that outlines the scope of work, deliverables, and payment terms. It protects both you and your client from scope creep and miscommunication.`
        },
        {
          q: `Is this ${title} template really free?`,
          a: `Yes. MicroFreelanceHub allows you to generate, customize, and manage up to 3 active projects completely free. You do not need a credit card to start.`
        },
        {
          q: isInvoice ? `Can clients pay this ${title} invoice online?` : `Does this ${title} contract include e-signatures?`,
          a: isInvoice
            ? `Absolutely. When you send this digital invoice, your clients can pay instantly via credit card or ACH transfer. We handle the secure processing so you get paid faster.`
            : `Yes. Both you and your client can legally sign this agreement from any device, including mobile phones. We securely log the signature and timestamp for your protection.`
        }
      ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq: any) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      {/* INJECT JSON-LD FOR AI BOTS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* INJECT FAQ JSON-LD FOR AI BOTS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* HEADER */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isInvoice ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
              {isInvoice ? <Receipt className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} 
              {isInvoice ? 'Invoice Template' : 'Contract Template'}
            </div>
            <div className="text-slate-400 text-xs font-medium">
               Updated {new Date().getFullYear()}
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Free <span className={isInvoice ? "text-emerald-400" : "text-blue-400"}>{title}</span> <br className="hidden md:block"/>
            <span className="text-white">{isInvoice ? 'Invoice Template' : 'Service Agreement'}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {painPoint}
          </p>
          
          {legalTip && (
             <div className={`max-w-2xl mx-auto border p-4 rounded-xl mb-8 flex gap-4 text-left ${isInvoice ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <div className={`p-2 rounded-lg shrink-0 h-fit ${isInvoice ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                   <Shield className={`w-5 h-5 ${isInvoice ? 'text-emerald-400' : 'text-amber-400'}`} />
                </div>
                <div>
                   <h3 className={`font-bold text-xs uppercase mb-1 ${isInvoice ? 'text-emerald-400' : 'text-amber-400'}`}>{isInvoice ? 'Cash Flow Tip' : 'Pro Contractor Tip'}</h3>
                   <p className={`text-sm leading-relaxed ${isInvoice ? 'text-emerald-100' : 'text-amber-100'}`}>{legalTip}</p>
                </div>
             </div>
          )}

          <Link href={`/create?template=${params.slug}`}>
            <button className={`font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all ${isInvoice ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-white text-blue-900 hover:bg-blue-50'}`}>
              ✨ {isInvoice ? 'Create Invoice Now' : 'Customize This Contract'}
            </button>
          </Link>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* LEFT: Educational Content */}
        <div className="flex flex-col">
          
          {/* Section 1: The 'Why' */}
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {isInvoice ? 'Why use a digital invoice?' : 'Why use a written agreement?'}
            </h2>
            
            {/* React Elements for Bold Text */}
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              {isInvoice ? (
                <>
                  Paper invoices get lost. PDFs get ignored. As a <strong className="font-bold text-slate-900">{title}</strong>, cash flow is everything. Sending a digital invoice with a "Pay Now" button gets you paid 3x faster.
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
              <span className={isInvoice ? "text-emerald-600" : "text-blue-600"}>{isInvoice ? '💸' : '🛡️'}</span> What this template covers:
            </h3>
            <ul className="space-y-4">
               {(isInvoice 
                  ? ['Itemized Labor & Materials', 'Automatic Tax Calculation', 'Instant "Pay Now" Button', 'Late Fee Terms', 'Professional Branding'] 
                  : ['Deliverables List', 'Payment Terms', 'IP Rights', 'Revision Limits', 'Cancellation Policy']
               ).map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isInvoice ? 'bg-emerald-100 text-emerald-600' : 'bg-green-100 text-green-600'}`}>✓</div>
                    <span className="font-bold text-slate-900">{item}</span>
                  </li>
               ))}
            </ul>
          </div>

          {/* Section 3: Sidebar Related Templates */}
          {relatedDocs.length > 0 && (
             <div className="mb-10">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Related Templates</h3>
                <div className="space-y-3">
                   {relatedDocs.map((item: any) => (
                      <Link key={item.slug} href={`/templates/${item.slug}`} className="block group">
                         <div className="bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600">{item.job_title}</span>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                         </div>
                      </Link>
                   ))}
                </div>
             </div>
          )}

          {/* Section 4: CTA Box */}
          <div className={`p-6 rounded-xl border mt-auto ${isInvoice ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
            <h4 className={`font-bold mb-2 text-lg ${isInvoice ? 'text-emerald-900' : 'text-blue-900'}`}>Ready to send?</h4>
            <p className="text-slate-700 mb-4 leading-relaxed">
              {isInvoice ? 'Our AI will organize your line items and calculate totals automatically.' : 'Our AI will fill in the client\'s name, dates, and specific project details for you.'}
            </p>
            <Link href={`/create?template=${params.slug}`} className={`font-bold hover:underline flex items-center gap-1 ${isInvoice ? 'text-emerald-700' : 'text-blue-600'}`}>
              Start building now &rarr;
            </Link>
          </div>
        </div>

        {/* RIGHT: The "Meaty" Macbook Window Preview */}
        <div className="relative lg:sticky lg:top-24 h-fit">
          <div className={`absolute inset-0 transform rotate-1 rounded-2xl ${isInvoice ? 'bg-emerald-600/5' : 'bg-blue-600/5'}`}></div>
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
            
            {/* Mock Browser Bar */}
            <div className="bg-slate-100 border-b border-slate-200 p-3 flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-auto text-xs font-mono text-slate-400">READ ONLY PREVIEW</span>
            </div>

            {/* Document Content */}
            <div className="p-6 md:p-10 text-sm leading-relaxed">
              
              {/* HEADER */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-slate-900">
                    {isInvoice ? 'INVOICE' : 'Statement of Work'}
                </h2>
                <span className="text-xs md:text-sm font-mono text-slate-500">REF: {new Date().getFullYear()}-001</span>
              </div>

              {/* SECTION 1: BACKGROUND / BILL TO */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {isInvoice ? '1. Bill To' : '1. Project Background'}
                </h3>
                <p className="text-slate-600 text-justify">
                    {introParagraph}
                </p>
              </div>

              {/* SECTION 2: SCOPE / ITEMS */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {isInvoice ? '2. Billable Items' : '2. Scope of Services'}
                </h3>
                <p className="text-slate-600 mb-3">
                    {isInvoice ? 'The following items are billed for this period:' : 'The Contractor shall provide the following deliverables:'}
                </p>
                <ul className="space-y-2 pl-2">
                  {listItems.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-800 font-medium">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isInvoice ? 'bg-emerald-600' : 'bg-blue-600'}`}></div>
                      <span className="leading-relaxed">{item}</span>
                      {isInvoice && <span className="ml-auto font-mono text-slate-400">$0.00</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION 3: STANDARDS / TERMS */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {isInvoice ? '3. Payment Instructions' : '3. Performance Standards'}
                </h3>
                <p className="text-slate-600 text-justify">
                    {standardsParagraph}
                </p>
              </div>

              {/* SECTION 4: PRICE */}
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-600">Total {isInvoice ? 'Due' : 'Value'}</span>
                <span className="font-bold text-xl md:text-2xl text-slate-900">
                  {price > 0 ? `$${price.toLocaleString()}` : (isInvoice ? '$0.00' : 'Variable')}
                </span>
              </div>

              {/* SECTION 5: LEGAL FOOTER */}
              <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-6">
                <p className="mb-2"><strong>TERMS & CONDITIONS (Summary):</strong></p>
                <p>1. <strong>Payment:</strong> {isInvoice ? 'Due upon receipt.' : '50% Deposit required.'}</p>
                <p>2. <strong>Copyright:</strong> Rights transfer to Client upon full payment.</p>
                <p className="mt-4 italic text-[9px] text-slate-300">Disclaimer: This template is for educational purposes only and does not constitute legal advice.</p>
              </div>

              {/* Overlay Button */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-6">
                  <Link href={`/create?template=${params.slug}`}>
                    <button className={`text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:-translate-y-1 ${isInvoice ? 'bg-emerald-900 hover:bg-emerald-800' : 'bg-slate-900 hover:bg-slate-800'}`}>
                      {isInvoice ? 'Use This Invoice Free' : 'Use This Template Free'} &rarr;
                    </button>
                  </Link>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* NEW: FAQ SECTION FOR AI & HUMAN SEO */}
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

      {/* 👇 2. INJECT THE WIDGET AT THE BOTTOM */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
          <RelatedRoles currentSlug={params.slug} batchLabel={doc.batch_label} />
      </div>

    </div>
  );
}