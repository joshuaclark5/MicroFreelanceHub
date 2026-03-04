import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Force dynamic so Vercel rebuilds this on every request (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 🛑 ABSOLUTE CACHE KILLER: Forces Vercel to generate this fresh every time.

// CUSTOM FETCH: Forces Next.js to never cache the database response
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

  // Initialize Supabase with the Service Key (Bypasses RLS)
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

  // 1. FETCH SYSTEM TEMPLATES (Legacy "sow_documents")
  const { data: systemTemplates, error: systemError } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null);

  if (systemError) {
    console.error('Error fetching system templates:', systemError.message);
  } else {
    console.log(`System Templates Found: ${systemTemplates?.length || 0}`);
  }

  // 2. FETCH SEO PAGES (The New "Enriched" Content)
  const { data: seoPages, error: seoError } = await supabase
    .from('seo_pages')
    .select('slug, document_type');

  if (seoError) {
    console.error('Error fetching SEO pages:', seoError.message);
  } else {
    console.log(`SEO Pages Found: ${seoPages?.length || 0}`);
  }

  // 3. MAPPING
  // Legacy Templates
  const systemUrls = (systemTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // SEO Pages (BULLETPROOF ROUTING)
  const seoUrls = (seoPages || []).map((page) => {
    // 🛡️ Bulletproof Check: If it starts with 'alternative-to-', it's a comparison page.
    const isCompetitor = page.slug?.startsWith('alternative-to-') || page.document_type?.toLowerCase() === 'comparison';
    
    const folder = isCompetitor ? 'alternatives' : 'templates';
    
    return {
      url: `${baseUrl}/${folder}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    };
  });

  // 4. STATIC ROUTES (VIP ONLY)
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/create`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Combine ALL
  let finalSitemap = [...staticRoutes, ...systemUrls, ...seoUrls];
  
  // 5. DEDUPLICATION
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