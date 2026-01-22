import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// 1. Initialize Supabase Client (Server-Side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. HELPER: Force Capitalization (Fixes the "robot glitch")
function toTitleCase(str: string | null) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// 3. Generate Metadata for SEO (Title tags show up correctly on Google)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: page } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!page) return { title: 'Contract Not Found' };

  // Apply the fix to the meta title too
  const cleanTitle = toTitleCase(page.job_title || page.keyword);

  return {
    title: `Free ${cleanTitle} Contract Template (2026 Update)`,
    description: `Download a free, professional contract for ${page.keyword}. Protect your work as a ${cleanTitle}. AI-generated and legally reviewed.`,
  };
}

// 4. The Page Component
export default async function HirePage({ params }: { params: { slug: string } }) {
  // Fetch data
  const { data: page, error } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !page) {
    notFound();
  }

  // ✨ Apply the Capitalization Fix
  const title = toTitleCase(page.job_title);
  const keyword = toTitleCase(page.keyword);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* HEADER / HERO */}
      <div className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-blue-600 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
            Free Contract Template
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Hire a <span className="text-blue-400">{title}</span> safely.
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed">
            Stop using vague emails. Use this standard <strong>{keyword}</strong> agreement to define scope, payments, and IP rights instantly.
          </p>
          
          {/* THE "MONEY BUTTON" */}
          <div className="mt-8">
             <Link href="/create">
                <button 
                  className="bg-white text-blue-900 font-bold py-4 px-8 rounded-full shadow-lg hover:bg-blue-50 transition-all text-lg transform hover:-translate-y-1"
                >
                  ✨ Generate {title} Contract Now
                </button>
             </Link>
             <p className="mt-3 text-sm text-slate-500">
               *Clicking this opens our AI Contract Generator with this template pre-loaded.
             </p>
          </div>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Why you need this */}
        <div className="prose prose-lg mx-auto text-slate-600 mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Why you need a written agreement for {keyword}</h2>
          <p>
            Handshake deals work until they don't. When you hire a <strong>{title}</strong>, vague expectations lead to "scope creep" (doing free work) or payment disputes.
          </p>
          <p>
            This template is designed specifically for <strong>{keyword}</strong>. It covers the standard deliverables, revision limits, and payment schedules used by professionals in this industry.
          </p>
        </div>

        {/* PREVIEW BOX */}
        <div className="border-2 border-slate-200 rounded-xl p-8 bg-slate-50 mb-16 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            📄 What's included in this {title} contract?
          </h3>
          <ul className="space-y-3">
            {page.deliverables && page.deliverables.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">✓</span>
              <span className="text-slate-700 font-semibold">Liability Protection Shield (Standard Legal Terms)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold">✓</span>
              <span className="text-slate-700 font-semibold">Intellectual Property Rights Assignment</span>
            </li>
          </ul>
        </div>

        {/* FINAL CTA */}
        <div className="text-center bg-blue-50 rounded-2xl p-10 border border-blue-100">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Ready to start?</h2>
          <p className="text-blue-700 mb-8 max-w-xl mx-auto">
            Don't copy-paste text files. Use our free AI tool to customize this contract for your specific project in 30 seconds.
          </p>
          <Link 
            href="/create"
            className="inline-block bg-blue-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-blue-700 transition-all shadow-md"
          >
            Create {title} Contract &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}