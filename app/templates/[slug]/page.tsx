import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Initialize Supabase (Public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 🧠 THE BRAIN: Smart Slug Resolver (V3 - Priority Fix) ---
async function findDoc(slug: string) {
  
  // 1. PRIORITY: Check 'sow_documents' (The High-Quality Data you just uploaded)
  const { data: sowDoc } = await supabase
    .from('sow_documents')
    .select('*')
    .eq('slug', slug)
    .single();

  if (sowDoc) return { doc: sowDoc, source: 'sow' };

  // 2. Fallback: Manual Dictionary (Maps to SEO pages if SOW is missing)
  const manualOverrides: Record<string, string> = {
    'graphic-design-contract': 'freelance-logo-designer',
    'video-editor-contract': 'freelance-videographer',
    'event-photographer-contract': 'hire-event-photographer',
    'web-development-contract': 'hire-wordpress-developer',
    'social-media-manager-contract': 'hire-twitter-manager',
    'seo-specialist-contract': 'hire-local-seo-expert',
    'copywriting-contract': 'case-study-copywriter', 
  };

  if (manualOverrides[slug]) {
    const overrideSlug = manualOverrides[slug];
    const { data: seoDoc } = await supabase.from('seo_pages').select('*').eq('slug', overrideSlug).single();
    if (seoDoc) return { doc: seoDoc, source: 'seo' };
  }

  // 3. Last Resort: SEO Pages variations
  const variations = [slug, slug.replace('-contract', ''), `hire-${slug}`];
  const { data: seoDocs } = await supabase.from('seo_pages').select('*').in('slug', variations);
  if (seoDocs && seoDocs.length > 0) return { doc: seoDocs[0], source: 'seo' };

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
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Template Not Found' };
  const { doc, source } = result;
  const title = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  return {
    title: `Free ${toTitleCase(title)} Contract Template (2026)`,
    description: `Download a professional ${toTitleCase(title)} contract. Includes scope, deliverables, and legal protection.`,
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
  // Ensure deliverables is always an array for the list view
  const deliverablesList = Array.isArray(doc.deliverables) ? doc.deliverables : [doc.deliverables || "Scope of work details..."];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-blue-600 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
            Verified Template
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Free <span className="text-blue-400">{title}</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            A battle-tested agreement for {title}s. Define your scope, set your price, and protect your time.
          </p>
          <Link href={`/create?template=${params.slug}`}>
            <button className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all">
              ✨ Customize This Contract
            </button>
          </Link>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT: Content + Preview */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">
        
        {/* LEFT: The "Meat" (SEO Content) */}
        <div className="prose prose-lg text-slate-600">
          <h2 className="text-3xl font-bold text-slate-900">Why use a written contract?</h2>
          <p>
            Handshake deals are risky. As a <strong>{title}</strong>, "scope creep" is your biggest enemy. A client asks for "one small change," and suddenly you're working for free.
          </p>
          <p>
            This template protects you by defining exactly what is included (and what isn't).
          </p>
          
          <h3 className="text-xl font-bold text-slate-900 mt-8">What's included in this template?</h3>
          <ul className="space-y-2 mt-4">
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>Deliverables List:</strong> Clear output definitions.</li>
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>Payment Terms:</strong> Deposit and final payment schedule.</li>
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>IP Rights:</strong> Who owns the work upon payment.</li>
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>Revision Limits:</strong> Prevent endless feedback loops.</li>
          </ul>

          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 not-prose">
            <h4 className="font-bold text-blue-900 mb-2">Ready to send?</h4>
            <p className="text-sm text-blue-700 mb-4">Our AI will fill in the client's name, dates, and specific project details for you.</p>
            <Link href={`/create?template=${params.slug}`} className="text-blue-600 font-bold hover:underline">
              Start building now &rarr;
            </Link>
          </div>
        </div>

        {/* RIGHT: The Contract Preview */}
        <div className="relative">
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
            <div className="p-8 md:p-12">
              <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-900">Statement of Work</h2>
                <span className="text-sm font-mono text-slate-500">REF: {new Date().getFullYear()}-001</span>
              </div>

              {/* Dynamic Deliverables Section */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Scope of Work</h3>
                <ul className="space-y-4">
                  {deliverablesList.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-800">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Price Section */}
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-600">Total Project Value</span>
                <span className="font-bold text-2xl text-slate-900">
                  {price > 0 ? `$${price.toLocaleString()}` : 'Variable'}
                </span>
              </div>

              {/* Legal Footer (Static) */}
              <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-6">
                <p className="mb-2"><strong>TERMS & CONDITIONS (Summary):</strong></p>
                <p>1. <strong>Payment:</strong> 50% Non-refundable deposit required to begin work.</p>
                <p>2. <strong>Copyright:</strong> Rights transfer to Client only upon full payment.</p>
                <p>3. <strong>Liability:</strong> Contractor liability limited to total project fee.</p>
              </div>

              {/* Overlay Button */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-8">
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
    </div>
  );
}