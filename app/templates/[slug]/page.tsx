import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { 
  Shield, 
  FileText, 
  ArrowRight
} from 'lucide-react';
// 👇 1. IMPORT THE NEW WIDGET
import RelatedRoles from '../../components/seo/RelatedRoles';

// Initialize Supabase (Public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 🧠 THE BRAIN: Smart Slug Resolver (Upgraded) ---
async function findDoc(slug: string) {
  
  // 1. PRIORITY: Check 'sow_documents' (System Templates)
  const { data: sowDoc } = await supabase.from('sow_documents').select('*').eq('slug', slug).single();
  if (sowDoc) return { doc: sowDoc, source: 'sow' };

  // 2. EXACT MATCH: Check 'seo_pages' for the new URL format
  let { data: exactDoc } = await supabase.from('seo_pages').select('*').eq('slug', slug).single();
  if (exactDoc) return { doc: exactDoc, source: 'seo' };

  // 3. 🛡️ SAFETY NET: The "Rescue" Logic
  const baseSlug = slug.replace(/-contract-template$/, '');
  
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

// --- METADATA ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Template Not Found' };
  
  const { doc, source } = result;
  const title = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  const displayTitle = toTitleCase(title);
  
  const hook = doc.pain_point_hook || `Download a professional ${displayTitle} contract. Includes scope, payments, and legal terms.`;

  return {
    title: `Free ${displayTitle} Contract Template (2026)`,
    description: hook,
    alternates: {
      canonical: `https://www.microfreelancehub.com/templates/${params.slug}`,
    },
  };
}

// --- MAIN PAGE ---
export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return notFound();

  const { doc, source } = result;
  
  // Normalize Data
  const title = toTitleCase(source === 'sow' ? doc.title : (doc.job_title || doc.keyword));
  const price = source === 'sow' ? doc.price : 0;
  
  const documentType = doc.document_type || 'Contract';
  const painPoint = doc.pain_point_hook || `A battle-tested agreement for ${title}s. Define your scope, set your price, and protect your time.`;
  const legalTip = doc.legal_tip;
  
  const rawDeliverables = doc.deliverables;
  const deliverablesList = Array.isArray(rawDeliverables) 
    ? rawDeliverables 
    : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Scope of work details...", "Payment Milestones", "Timeline"]);

  const introParagraph = `This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services, and the Contractor agrees to perform such services in accordance with the terms and conditions set forth below.`;
  
  const standardsParagraph = `The Contractor agrees to perform the ${title} services in a professional manner, using the degree of skill and care that is required by current industry standards. The Contractor shall provide all tools and equipment necessary to complete the tasks unless otherwise agreed.`;

  // Inline Related (Keep this for the sidebar)
  let relatedDocs = [];
  if (doc.batch_label) {
    const { data } = await supabase.from('seo_pages')
      .select('slug, job_title')
      .eq('batch_label', doc.batch_label)
      .neq('slug', params.slug)
      .limit(3);
    relatedDocs = data || [];
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> {documentType} Template
            </div>
            <div className="text-slate-400 text-xs font-medium">
               Updated {new Date().getFullYear()}
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Free <span className="text-blue-400">{title}</span> Template
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {painPoint}
          </p>
          
          {legalTip && (
             <div className="max-w-2xl mx-auto bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-8 flex gap-4 text-left">
                <div className="bg-amber-500/20 p-2 rounded-lg shrink-0 h-fit">
                   <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                   <h3 className="font-bold text-amber-400 text-xs uppercase mb-1">Pro Contractor Tip</h3>
                   <p className="text-amber-100 text-sm leading-relaxed">{legalTip}</p>
                </div>
             </div>
          )}

          <Link href={`/create?template=${params.slug}`}>
            <button className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all">
              ✨ Customize This Contract
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
              Why use a written contract?
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              Handshake deals are risky. As a <strong>{title}</strong>, "scope creep" is your biggest enemy. 
              A clear <strong>Statement of Work (SOW)</strong> ensures everyone agrees on the deliverables before money changes hands.
            </p>
          </div>
          
          {/* Section 2: What's Included */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-10">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-blue-600">🛡️</span> What this template covers:
            </h3>
            <ul className="space-y-4">
               {['Deliverables List', 'Payment Terms', 'IP Rights', 'Revision Limits', 'Cancellation Policy'].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold text-sm">✓</div>
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
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 mt-auto">
            <h4 className="font-bold text-blue-900 mb-2 text-lg">Ready to send?</h4>
            <p className="text-slate-700 mb-4 leading-relaxed">
              Our AI will fill in the client's name, dates, and specific project details for you.
            </p>
            <Link href={`/create?template=${params.slug}`} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
              Start building now &rarr;
            </Link>
          </div>
        </div>

        {/* RIGHT: The "Meaty" Macbook Window Preview */}
        <div className="relative lg:sticky lg:top-24 h-fit">
          <div className="absolute inset-0 bg-blue-600/5 transform rotate-1 rounded-2xl"></div>
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
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-slate-900">Statement of Work</h2>
                <span className="text-xs md:text-sm font-mono text-slate-500">REF: {new Date().getFullYear()}-001</span>
              </div>

              {/* SECTION 1: BACKGROUND */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Project Background</h3>
                <p className="text-slate-600 text-justify">
                    {introParagraph}
                </p>
              </div>

              {/* SECTION 2: SCOPE */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">2. Scope of Services</h3>
                <p className="text-slate-600 mb-3">The Contractor shall provide the following specific deliverables:</p>
                <ul className="space-y-2 pl-2">
                  {deliverablesList.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-800 font-medium">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION 3: STANDARDS */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">3. Performance Standards</h3>
                <p className="text-slate-600 text-justify">
                    {standardsParagraph}
                </p>
              </div>

              {/* SECTION 4: PRICE */}
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-600">Total Project Value</span>
                <span className="font-bold text-xl md:text-2xl text-slate-900">
                  {price > 0 ? `$${price.toLocaleString()}` : 'Variable'}
                </span>
              </div>

              {/* SECTION 5: LEGAL FOOTER */}
              <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-6">
                <p className="mb-2"><strong>TERMS & CONDITIONS (Summary):</strong></p>
                <p>1. <strong>Payment:</strong> 50% Non-refundable deposit required to begin work.</p>
                <p>2. <strong>Copyright:</strong> Rights transfer to Client only upon full payment.</p>
                <p>3. <strong>Liability:</strong> Contractor liability limited to total project fee.</p>
                <p className="mt-4 italic text-[9px] text-slate-300">Disclaimer: This template is for educational purposes only and does not constitute legal advice.</p>
              </div>

              {/* Overlay Button */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-6">
                  <Link href={`/create?template=${params.slug}`}>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-transform hover:-translate-y-1">
                      Use This Template Free &rarr;
                    </button>
                  </Link>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* 👇 2. INJECT THE WIDGET AT THE BOTTOM */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
          <RelatedRoles currentSlug={params.slug} batchLabel={doc.batch_label} />
      </div>

    </div>
  );
}