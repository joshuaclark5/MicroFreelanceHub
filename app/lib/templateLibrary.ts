import { createClient } from '@supabase/supabase-js';

export const PAGE_SIZE = 48;
export async function searchTemplates(query = '', filter = 'all', page = 1) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  let request = supabase.from('seo_pages').select('slug, document_type, job_title, ai_summary', { count: 'exact' })
    .not('slug', 'is', null).neq('document_type', 'Comparison').not('slug', 'like', 'alternative-to-%');
  // Restrict filter syntax characters before interpolating into PostgREST expressions.
  const term = query.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 150);
  if (term) request = request.or(['job_title', 'document_type', 'slug', 'ai_summary'].map(column => `${column}.ilike.%${term}%`).join(','));
  const groups: Record<string, string[]> = { contract: ['contract', 'agreement'], invoice: ['invoice', 'payment'], scope: ['scope', 'work-order', 'proposal', 'estimate'] };
  if (groups[filter]) request = request.or(groups[filter].flatMap(word => [`document_type.ilike.%${word}%`, `slug.ilike.%${word}%`]).join(','));
  const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
  const { data, count, error } = await request.order('job_title', { ascending: true }).order('slug', { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
  if (error) throw new Error('Unable to load templates');
  return { templates: data || [], total: count || 0 };
}
