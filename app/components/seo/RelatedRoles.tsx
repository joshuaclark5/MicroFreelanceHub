import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowRight, LayoutTemplate } from 'lucide-react';

export default async function RelatedRoles({ currentSlug, batchLabel }: { currentSlug: string, batchLabel?: string }) {
  const supabase = createClientComponentClient();
  
  // Strategy: Find pages in the same batch
  // ✅ FIX 1: Ask Supabase for the 'document_type' column
  let query = supabase
    .from('seo_pages')
    .select('slug, job_title, document_type')
    .neq('slug', currentSlug) // Don't link to self
    .limit(6);

  if (batchLabel) {
    query = query.eq('batch_label', batchLabel);
  }

  const { data: roles } = await query;

  if (!roles || roles.length === 0) return null;

  // Check if this batch is mostly invoices to change the header title
  const isInvoiceBatch = roles[0]?.document_type === 'Invoice';

  return (
    <div className="mt-16 pt-10 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <LayoutTemplate className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">
            {/* ✅ FIX 2: Smart Header Title */}
            {batchLabel 
              ? (isInvoiceBatch ? 'Similar Invoice Templates' : 'Similar Professional Templates') 
              : 'Popular Templates'}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          // ✅ FIX 3: Smart Link Label (Invoice vs Contract)
          const label = role.document_type === 'Invoice' ? 'Invoice' : 'Contract';
          
          return (
            <Link 
              key={role.slug} 
              href={`/templates/${role.slug}`}
              className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-600 hover:shadow-md transition-all"
            >
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-900 line-clamp-1">
                {role.job_title} {label}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}