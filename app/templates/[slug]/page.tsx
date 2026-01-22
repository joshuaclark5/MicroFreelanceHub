import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Initialize Supabase Client (Public Read Access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper: Fix capitalization for SEO titles
function toTitleCase(str: string | null) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// 1. Generate Metadata (Checks BOTH tables)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  // Try Table A (sow_documents)
  let { data: doc } = await supabase
    .from('sow_documents')
    .select('title, deliverables')
    .eq('slug', params.slug)
    .single();

  // If not found, Try Table B (seo_pages)
  if (!doc) {
    const { data: seoPage } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('slug', params.slug)
      .single();
      
    if (seoPage) {
      doc = { 
        title: seoPage.job_title || seoPage.keyword, 
        deliverables: seoPage.deliverables 
      } as any;
    }
  }

  if (!doc) return { title: 'Template Not Found' };

  const cleanTitle = toTitleCase(doc.title);
  return {
    title: `Free ${cleanTitle} Template (2026) | MicroFreelanceHub`,
    description: `Download a professional ${cleanTitle} contract for free. Includes deliverables, scope, and legal protections. Perfect for freelancers.`,
  };
}

// 2. The Main Page Component
export default async function TemplatePage({ params }: { params: { slug: string } }) {
  
  // STEP 1: Try finding it in 'sow_documents'
  let { data: doc } = await supabase
    .from('sow_documents')
    .select('*')
    .eq('slug', params.slug)
    .single();

  // STEP 2: If not there, try finding it in 'seo_pages' (The Backup)
  if (!doc) {
    const { data: seoDoc } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('slug', params.slug)
        .single();
    
    if (seoDoc) {
        // Map seo_pages data to look like sow_documents data
        // Note: seo_pages stores deliverables as an array, so we join them for the text block
        const deliverableText = Array.isArray(seoDoc.deliverables) 
            ? seoDoc.deliverables.map((d: string) => `• ${d}`).join('\n') 
            : seoDoc.deliverables;

        doc = {
            title: seoDoc.job_title || seoDoc.keyword,
            price: 0, // Default for SEO pages
            client_name: "Your Client", // Default placeholder
            deliverables: deliverableText || "Scope of work details...",
            slug: seoDoc.slug
        };
    }
  }

  // If still not found in EITHER table, then it's a real 404
  if (!doc) return notFound();

  const displayTitle = toTitleCase(doc.title);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* 🟢 SEO HEADER */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-indigo-400 font-bold tracking-widest uppercase text-xs mb-3">Free Contract Template</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">{displayTitle}</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Stop using generic PDFs. This AI-enhanced template is designed specifically for your niche to protect you from scope creep.
          </p>
          
          <div className="flex gap-4 justify-center">
            {/* Link passes the template slug to login so we can load it later */}
            <Link href={`/create?template=${params.slug}`}>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:-translate-y-1 transition-all">
                Use This Template For Free ⚡
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 📄 PREVIEW SECTION */}
      <div className="max-w-4xl mx-auto -mt-10 px-4 pb-20">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          
          {/* Mock Browser Header */}
          <div className="bg-gray-100 border-b border-gray-200 p-3 flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-4 text-xs text-gray-400 font-mono">PREVIEW MODE • READ ONLY</span>
          </div>

          {/* Contract Content */}
          <div className="p-12 md:p-20 opacity-90">
            <h2 className="text-3xl font-bold uppercase mb-2 text-gray-900">{displayTitle}</h2>
            <p className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-12">Statement of Work</p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase border-b pb-2 mb-4">Price</h3>
                <p className="text-2xl font-bold text-gray-900">
                    {doc.price ? `$${doc.price.toLocaleString()}` : 'Variable Rate'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase border-b pb-2 mb-4">Deliverables</h3>
                <div className="prose text-gray-800 whitespace-pre-line leading-relaxed">
                  {doc.deliverables}
                </div>
              </div>
            </div>

            {/* CTA Overlay */}
            <div className="mt-16 p-8 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
              <h3 className="text-xl font-bold text-indigo-900 mb-2">Want to customize this?</h3>
              <p className="text-indigo-700 mb-6">Use our AI to add your specific project details, liability clauses, and payment terms in seconds.</p>
              <Link href={`/create?template=${params.slug}`}>
                <button className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800">
                  Customize for {doc.client_name || 'Your Client'} Now &rarr;
                </button>
              </Link>
            </div>

          </div>
        </div>
        
        {/* SEO Footer Links (Internal Linking Strategy) */}
        <div className="mt-20 text-center">
            <h4 className="font-bold text-gray-900 mb-6">Popular Templates</h4>
            <div className="flex flex-wrap justify-center gap-4">
                <Link href="/templates/web-development-contract" className="text-gray-500 hover:text-indigo-600 underline">Web Dev</Link>
                <Link href="/templates/seo-specialist-contract" className="text-gray-500 hover:text-indigo-600 underline">SEO Retainer</Link>
                <Link href="/templates/graphic-design-contract" className="text-gray-500 hover:text-indigo-600 underline">Graphic Design</Link>
                <Link href="/templates/social-media-manager-contract" className="text-gray-500 hover:text-indigo-600 underline">Social Media</Link>
            </div>
        </div>

      </div>
    </div>
  );
}