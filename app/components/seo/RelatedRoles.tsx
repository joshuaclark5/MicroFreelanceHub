import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { FileText, ArrowRight } from 'lucide-react';

export default async function RelatedRoles({ currentSlug, jobTitle }: { currentSlug: string, jobTitle?: string | null }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🎯 THE UPGRADE: Fetch documents for the EXACT same profession
  let query = supabase
    .from('seo_pages')
    .select('slug, document_type, job_title')
    .neq('slug', currentSlug)
    .limit(8);
  
  if (jobTitle) {
    query = query.eq('job_title', jobTitle);
  }

  const { data: links } = await query;

  if (!links || links.length === 0) return null;

  return (
    <div className="w-full mt-10">
      <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">
        Complete your <span className="text-blue-600">{jobTitle || 'Freelance'}</span> workflow
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {links.map((link) => (
          <Link key={link.slug} href={`/templates/${link.slug}`}>
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                 </div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{link.document_type}</span>
              </div>
              <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                {link.job_title} {link.document_type}
              </span>
              <div className="mt-auto pt-4 flex items-center text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                View Template <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}