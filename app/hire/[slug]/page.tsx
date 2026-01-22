import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Initialize Supabase (Public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 🧠 THE BRAIN: Smart Slug Resolver ---
async function findDoc(slug: string) {
  
  // 1. Try Finding an Exact SEO Page Match FIRST (Since this is the /hire/ route)
  let { data: seoDoc } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (seoDoc) return { doc: seoDoc, source: 'seo' };

  // 2. Fallback: Try the "System Templates" (SOW Documents)
  // This allows /hire/ links to work even if we only have a Template for it
  const { data: sowDoc } = await supabase
    .from('sow_documents')
    .select('*')
    .eq('slug', slug)
    .single();

  if (sowDoc) return { doc: sowDoc, source: 'sow' };

  // 3. Fallback: Try Variations (Smart Dictionary)
  // This connects "hire-video-editor" to "freelance-videographer"
  const manualOverrides: Record<string, string> = {
    'hire-graphic-designer': 'freelance-logo-designer',
    'hire-video-editor': 'freelance-videographer',
    'hire-photographer': 'hire-event-photographer',
    'hire-web-developer': 'hire-wordpress-developer',
    'hire-plumber': 'hire-plumber', // Ensures exact matches pass through
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
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return { title: 'Contract Not Found' };
  const { doc, source } = result;
  const title = source === 'sow' ? doc.title : (doc.job_title || doc.keyword);
  return {
    title: `Hire a ${toTitleCase(title)} - Free Contract Template`,
    description: `Generate a professional contract for a ${toTitleCase(title)}. Scope, payments, and legal terms included.`,
  };
}

// --- MAIN PAGE ---
export default async function HirePage({ params }: { params: { slug: string } }) {
  const result = await findDoc(params.slug);
  if (!result) return notFound();

  const { doc, source } = result;
  
  // Normalize Data
  const title = toTitleCase(source === 'sow' ? doc.title : (doc.job_title || doc.keyword));
  const price = source === 'sow' ? doc.price : 0;
  
  // Ensure deliverables is always an array
  const rawDeliverables = doc.deliverables;
  const deliverablesList = Array.isArray(rawDeliverables) 
    ? rawDeliverables 
    : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Scope of work details..."]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-green-500 rounded-full text-xs font-bold mb-6 uppercase tracking-wider text-black">
            Free Freelancer Tool
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Hire a <span className="text-blue-400">{title}</span> safely.
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Don't start work without a contract. Generate a professional agreement for your {title} project in seconds.
          </p>
          {/* We pass the 'template' param so the next page knows what to load */}
          <Link href={`/create?template=${params.slug}`}>
            <button className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all">
              ✨ Create Contract Now
            </button>
          </Link>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT: Content + Preview */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">
        
        {/* LEFT: Educational Content */}
        <div className="prose prose-lg text-slate-600">
          <h2 className="text-3xl font-bold text-slate-900">Why do I need a contract for a {title}?</h2>
          <p>
            Whether you are the client or the freelancer, vague verbal agreements lead to disputes. 
            A clear SOW (Statement of Work) ensures everyone agrees on the deliverables before money changes hands.
          </p>
          
          <h3 className="text-xl font-bold text-slate-900 mt-8">What this template covers:</h3>
          <ul className="space-y-2 mt-4">
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>Clear Deliverables:</strong> Specific list of what is included.</li>
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>Payment Schedule:</strong> Deposits and final milestones.</li>
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>IP & Ownership:</strong> Who owns the work when finished.</li>
             <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> <strong>Cancellation Policy:</strong> Protection if the project stops.</li>
          </ul>

          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 not-prose">
            <h4 className="font-bold text-blue-900 mb-2">Use our AI Generator</h4>
            <p className="text-sm text-blue-700 mb-4">We can interview you to customize this specifically for your project needs.</p>
            <Link href={`/create?template=${params.slug}`} className="text-blue-600 font-bold hover:underline">
              Start building &rarr;
            </Link>
          </div>
        </div>

        {/* RIGHT: The Macbook Window Preview (The UI you liked) */}
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