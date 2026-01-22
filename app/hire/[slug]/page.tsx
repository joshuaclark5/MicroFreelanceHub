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
  
  // 1. Try Finding an Exact SEO Page Match FIRST
  let { data: seoDoc } = await supabase.from('seo_pages').select('*').eq('slug', slug).single();
  if (seoDoc) return { doc: seoDoc, source: 'seo' };

  // 2. Fallback: Try "System Templates"
  const { data: sowDoc } = await supabase.from('sow_documents').select('*').eq('slug', slug).single();
  if (sowDoc) return { doc: sowDoc, source: 'sow' };

  // 3. Fallback: Smart Dictionary
  const manualOverrides: Record<string, string> = {
    'hire-graphic-designer': 'freelance-logo-designer',
    'hire-video-editor': 'freelance-videographer',
    'hire-photographer': 'hire-event-photographer',
    'hire-web-developer': 'hire-wordpress-developer',
    'hire-plumber': 'hire-plumber',
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
  
  const rawDeliverables = doc.deliverables;
  const deliverablesList = Array.isArray(rawDeliverables) 
    ? rawDeliverables 
    : (typeof rawDeliverables === 'string' ? [rawDeliverables] : ["Scope of work details..."]);

  // 🧠 SMART FILLER TEXT
  const introParagraph = `This Agreement is entered into by and between the Client and the Contractor. The Client wishes to engage the Contractor for professional ${title} services, and the Contractor agrees to perform such services in accordance with the terms and conditions set forth below.`;
  
  const standardsParagraph = `The Contractor agrees to perform the ${title} services in a professional manner, using the degree of skill and care that is required by current industry standards. The Contractor shall provide all tools and equipment necessary to complete the tasks unless otherwise agreed.`;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-green-500 rounded-full text-xs font-bold mb-6 uppercase tracking-wider text-black">
            Free Freelancer Tool
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Hire a <span className="text-blue-400">{title}</span> safely.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Don't start work without a contract. Generate a professional agreement for your {title} project in seconds.
          </p>
          <Link href={`/create?template=${params.slug}`}>
            <button className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:bg-blue-50 hover:-translate-y-1 transition-all">
              ✨ Create Contract Now
            </button>
          </Link>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* LEFT: Educational Content (CLEANED UP) */}
        <div className="flex flex-col justify-center">
          
          {/* Section 1: The 'Why' */}
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Why do I need a contract for a {title}?
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              Whether you are the client or the freelancer, vague verbal agreements lead to disputes. 
              A clear <strong>Statement of Work (SOW)</strong> ensures everyone agrees on the deliverables before money changes hands.
            </p>
          </div>
          
          {/* Section 2: What's Included (Card Style) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-10">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-blue-600">🛡️</span> What this template covers:
            </h3>
            <ul className="space-y-4">
               <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold text-sm">✓</div>
                  <div>
                    <strong className="block text-slate-900">Clear Deliverables</strong>
                    <span className="text-slate-600 text-sm">Specific list of what is included (and what isn't).</span>
                  </div>
               </li>
               <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold text-sm">✓</div>
                  <div>
                    <strong className="block text-slate-900">Payment Schedule</strong>
                    <span className="text-slate-600 text-sm">Deposits, milestones, and final payment terms.</span>
                  </div>
               </li>
               <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold text-sm">✓</div>
                  <div>
                    <strong className="block text-slate-900">IP & Ownership</strong>
                    <span className="text-slate-600 text-sm">Clear definition of who owns the work when finished.</span>
                  </div>
               </li>
               <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold text-sm">✓</div>
                  <div>
                    <strong className="block text-slate-900">Cancellation Policy</strong>
                    <span className="text-slate-600 text-sm">Protection for both parties if the project stops.</span>
                  </div>
               </li>
            </ul>
          </div>

          {/* Section 3: CTA Box */}
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2 text-lg">Use our AI Generator</h4>
            <p className="text-slate-700 mb-4 leading-relaxed">
              We can interview you to customize this specifically for your project needs in about 30 seconds.
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
    </div>
  );
}