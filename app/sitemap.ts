import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// ✅ Force dynamic so Vercel rebuilds this on every request (no caching)
export const dynamic = 'force-dynamic';

// 🛑 CUSTOM FETCH: Forces Next.js to never cache the database response
const fetchNoCache = (url: string, options?: RequestInit) => {
  return fetch(url, { ...options, cache: 'no-store', next: { revalidate: 0 } });
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const timestamp = new Date().toISOString();
  console.log(`🗺️ GENERATING SITEMAP (Debug Mode) at ${timestamp}`);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
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
  // We added .not('slug', 'is', null) to ensure we don't get empty rows
  const { data: systemTemplates, error: systemError } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null);

  if (systemError) {
    console.error('❌ Error fetching system templates:', systemError.message);
  } else {
    // 🔍 DEBUG LOG: This will tell you if it found your 20 original templates
    console.log(`✅ System Templates Found: ${systemTemplates?.length || 0}`);
  }

  // 2. FETCH SEO PAGES (The New "Enriched" Content)
  const { data: seoPages, error: seoError } = await supabase
    .from('seo_pages')
    .select('slug');

  if (seoError) {
    console.error('❌ Error fetching SEO pages:', seoError.message);
  } else {
    // 🔍 DEBUG LOG: This should say ~269
    console.log(`✅ SEO Pages Found: ${seoPages?.length || 0}`);
  }

  // 3. MAPPING
  // Legacy Templates (Your original 20)
  const systemUrls = (systemTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // SEO Pages (The 269 new ones)
  const seoUrls = (seoPages || []).map((page) => ({
    url: `${baseUrl}/templates/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 4. STATIC ROUTES
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/create`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Combine ALL (Removed deduplication for now to ensure nothing is hidden)
  const finalSitemap = [...staticRoutes, ...systemUrls, ...seoUrls];
  
  console.log(`🚀 SITEMAP GENERATION COMPLETE: ${finalSitemap.length} URLs`);
  
  return finalSitemap;
}