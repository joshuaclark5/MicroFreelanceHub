import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
import TemplatesLibraryClient, { TemplateLibraryItem } from './TemplatesLibraryClient';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Freelance Contract Template Library',
  description: 'Search MicroFreelanceHub contract, invoice, scope of work, estimate, and payment templates for freelancers and contractors.',
  alternates: {
    canonical: 'https://www.microfreelancehub.com/templates',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TemplatesLibraryPage() {
  const { data } = await supabase
    .from('seo_pages')
    .select('slug, document_type, job_title, ai_summary')
    .not('slug', 'is', null)
    .neq('document_type', 'Comparison')
    .order('job_title', { ascending: true })
    .limit(600);

  const templates = ((data || []) as TemplateLibraryItem[])
    .filter((template) => template.slug && !template.slug.startsWith('alternative-to-'));

  return <TemplatesLibraryClient templates={templates} />;
}
