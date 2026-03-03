import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Shield, ArrowRight, Zap, CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findDoc(slug: string) {
  const { data } = await supabase.from('seo_pages').select('*').eq('slug', slug).single();
  return data;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const doc = await findDoc(params.slug);
  if (!doc) return { title: 'Comparison Not Found' };
  
  return {
    title: doc.seo_title || `MicroFreelanceHub vs ${doc.job_title} (2026)`,
    description: doc.seo_desc,
    alternates: {
      canonical: `https://www.microfreelancehub.com/alternatives/${params.slug}`,
    }
  };
}

export default async function AlternativePage({ params }: { params: { slug: string } }) {
  const doc = await findDoc(params.slug);
  if (!doc || doc.document_type !== 'Comparison') return notFound();

  const competitor = doc.job_title;
  const painPoint = doc.pain_point_hook || `Tired of ${competitor}'s high fees? Switch to the simpler alternative.`;
  const legalTip = doc.legal_tip;
  
  // Safely parse arrays
  let deliverables = ["No Monthly Fees", "Instant Stripe Payments", "Free eSignatures", "Mobile Friendly"];
  if (doc.deliverables && Array.isArray(doc.deliverables)) deliverables = doc.deliverables;

  // Safely parse FAQs
  let parsedFaqs = [];
  if (doc.faqs) {
    try {
      let temp = typeof doc.faqs === 'string' ? JSON.parse(doc.faqs) : doc.faqs;
      if (temp && !Array.isArray(temp) && temp.faqs) temp = temp.faqs;
      if (Array.isArray(temp) && temp.length > 0) parsedFaqs = temp;
    } catch (e) { console.error(e); }
  }

  const faqs = parsedFaqs.length > 0 ? parsedFaqs : [
    { q: `Is MicroFreelanceHub completely free compared to ${competitor}?`, a: "Yes. We don't charge $39/month. We just take a 1% fee when you get paid via Stripe." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-bold uppercase tracking-wider mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            Software Comparison
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            The best free alternative <br className="hidden md:block" /> to <span className="text-blue-400">{competitor}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {painPoint}
          </p>

          <Link href={`/create`}>
            <button className="font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all bg-blue-600 text-white hover:bg-blue-500">
              Start Free Today &rarr;
            </button>
          </Link>
        </div>
      </div>

      {/* COMPARISON SECTION */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* THE COMPETITOR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm opacity-80">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-500">{competitor}</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-slate-500"><XCircle className="w-5 h-5 shrink-0 text-red-400" /> Expensive Monthly Subscriptions</li>
              <li className="flex gap-3 text-slate-500"><XCircle className="w-5 h-5 shrink-0 text-red-400" /> Bloated with features you don't use</li>
              <li className="flex gap-3 text-slate-500"><XCircle className="w-5 h-5 shrink-0 text-red-400" /> Complex learning curve</li>
            </ul>
          </div>

          {/* MICROFREELANCEHUB */}
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-xl relative transform md:-translate-y-4">
            <div className="absolute -top-4 right-6 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Winner
            </div>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">MicroFreelanceHub</h2>
            </div>
            <ul className="space-y-4">
              {deliverables.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 font-medium text-slate-800">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* PRO TIP BOX */}
        {legalTip && (
          <div className="mt-12 bg-amber-50 border border-amber-200 p-6 rounded-xl flex gap-4 max-w-3xl mx-auto">
            <Shield className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Switching Pro Tip</h3>
              <p className="text-amber-800">{legalTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* FAQS */}
      <div className="max-w-3xl mx-auto px-4 py-16 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq: any, index: number) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-2">{faq.q}</h3>
              <p className="text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}