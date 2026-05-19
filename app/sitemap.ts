import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

const fetchNoCache = (url: string, options?: RequestInit) => {
  return fetch(url, { ...options, cache: 'no-store', next: { revalidate: 0 } });
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const timestamp = new Date().toISOString();
  console.log(`GENERATING VIP SITEMAP (Debug Mode) at ${timestamp}`);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || '', 
    {
      auth: { persistSession: false },
      global: {
        fetch: fetchNoCache, 
      },
    }
  );

  const baseUrl = 'https://www.microfreelancehub.com';

  const { data: systemTemplates, error: systemError } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null);

  let allSeoPages: any[] = [];
  let start = 0;
  const limit = 1000;
  let keepFetching = true;

  console.log('Fetching SEO pages (Paginated)...');

  while (keepFetching) {
    const { data, error: seoError } = await supabase
      .from('seo_pages')
      .select('slug, document_type, job_title')
      .order('slug', { ascending: true })
      .range(start, start + limit - 1);

    if (seoError) {
      console.error('Error fetching SEO pages:', seoError.message);
      break;
    }

    if (data && data.length > 0) {
      allSeoPages = [...allSeoPages, ...data];
      start += limit;
    }

    if (!data || data.length < limit) {
      keepFetching = false;
    }
  }

  // 🚀 NEW: Count templates per profession to find the "Deep Hubs"
  const professionCounts = allSeoPages.reduce((acc: any, page) => {
    if (page.job_title) {
      acc[page.job_title] = (acc[page.job_title] || 0) + 1;
    }
    return acc;
  }, {});

  // ONLY create Hub URLs for professions that have a robust cluster (5+ templates)
  const coreProfessions = Object.keys(professionCounts).filter(prof => professionCounts[prof] >= 5);

  const hubUrls = coreProfessions.map((prof: string) => {
    const slug = prof.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      url: `${baseUrl}/profession/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.95, // 🔥 Hubs get highest priority
    };
  });

  const systemUrls = (systemTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const seoUrls = allSeoPages.map((page) => {
    const isCompetitor = page.slug?.startsWith('alternative-to-') || page.document_type?.toLowerCase() === 'comparison';
    const folder = isCompetitor ? 'alternatives' : 'templates';
    
    return {
      url: `${baseUrl}/${folder}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7, // Lowered slightly so Hub pages take precedence
    };
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/create`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  let finalSitemap = [...staticRoutes, ...hubUrls, ...systemUrls, ...seoUrls];
  
  const uniqueUrls = new Set();
  finalSitemap = finalSitemap.filter((item) => {
    if (uniqueUrls.has(item.url)) {
      return false;
    }
    uniqueUrls.add(item.url);
    return true;
  });
  
  console.log(`SITEMAP GENERATION COMPLETE: ${finalSitemap.length} URLs`);
  
  return finalSitemap;
}