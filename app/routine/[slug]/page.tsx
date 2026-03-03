import hairData from './../../components/data/hair-data.json';
import { notFound } from 'next/navigation';
import EmailCapture from './../../components/EmailCapture';

// SEO: This dynamically creates the title and description for each specific hair type
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = (hairData as any)[params.slug];
  if (!data) return { title: 'Routine Not Found' };

  return {
    title: `${data.title} | 90-Day Custom Protocol`,
    description: `Your science-backed diagnostic results for ${params.slug.replace('-', ' ')}. Download your custom routine.`,
  };
}

// Generates static paths for all 50+ combinations in your JSON
export async function generateStaticParams() {
  return Object.keys(hairData).map((slug) => ({
    slug: slug,
  }));
}

export default function RoutinePage({ params }: { params: { slug: string } }) {
  const data = (hairData as any)[params.slug];

  if (!data) return notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* Identity Section */}
        <div className="border-b pb-6">
          <h1 className="text-4xl font-serif font-black text-slate-900 leading-tight">
            {data.title}
          </h1>
          <div className="flex gap-4 mt-6">
            {Object.entries(data.analysis).map(([key, val]) => (
              <div key={key} className="bg-white border p-3 rounded-xl text-center flex-1 shadow-sm">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-lg font-black text-pink-600">{val as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Section */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Your Diagnostic Results</h2>
          <p className="text-slate-600 leading-relaxed mb-6">{data.diagnostic_summary}</p>
          
          <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              ⚠️ {data.insightWarning.title}
            </h3>
            <p className="mt-1 text-amber-800 text-sm italic">"{data.insightWarning.message}"</p>
          </div>
        </section>

        {/* Lead Capture */}
        <EmailCapture slug={params.slug} />

        {/* The $27 Upsell */}
        <section className="bg-slate-900 rounded-3xl p-10 text-white text-center shadow-2xl">
          <span className="text-pink-400 font-bold uppercase tracking-widest text-xs">Required Protocol</span>
          <h2 className="text-3xl font-bold mt-2">{data.ladder.primary_cta.title}</h2>
          <p className="mt-4 text-slate-400">{data.ladder.primary_cta.hook}</p>
          <button className="mt-8 w-full bg-pink-500 hover:bg-pink-400 text-white font-black py-4 rounded-xl transition-transform hover:scale-[1.02]">
            GET THE PROTOCOL — {data.ladder.primary_cta.price}
          </button>
        </section>

        {/* Affiliate Anchor */}
        <div className="border-t pt-8">
          <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Recommended Professional Tools</p>
          <div className="bg-white border p-6 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-pink-200 transition-colors shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800">{data.ladder.upsell_tool.name}</h4>
              <p className="text-sm text-slate-500">{data.ladder.upsell_tool.context}</p>
            </div>
            <div className="text-right">
              <span className="block font-black text-lg text-slate-900">{data.ladder.upsell_tool.price}</span>
              <span className="text-xs text-pink-600 font-bold underline">Check Price &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}