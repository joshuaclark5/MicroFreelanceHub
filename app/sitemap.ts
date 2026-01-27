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
  console.log(`🗺️ GENERATING SITEMAP (Fresh) at ${timestamp}`);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
  } else {
    console.log(`🔑 Service Key loaded (Starts with: ${serviceKey.substring(0, 5)}...)`);
  }

  // Initialize Supabase with the Cache Buster
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || '', 
    {
      auth: { persistSession: false },
      global: {
        fetch: fetchNoCache, // 👈 THIS FIXES THE PROBLEM
      },
    }
  );

  const baseUrl = 'https://www.microfreelancehub.com';

  // 1. FETCH TEMPLATES (Old "sow_documents")
  const { data: oldTemplates, error: templateError } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null)
    .limit(10000);

  if (templateError) {
    console.error('❌ Error fetching templates:', templateError.message);
  } else {
    console.log(`✅ Templates Found: ${oldTemplates?.length || 0}`);
  }

  // 2. FETCH SEO PAGES (The New Content Engine)
  const { data: allSeoPages, error: seoError } = await supabase
    .from('seo_pages')
    .select('slug')
    .limit(10000); // Fetch everything

  if (seoError) {
    console.error('❌ Error fetching SEO pages:', seoError.message);
  } else {
    console.log(`✅ SEO Pages Found: ${allSeoPages?.length || 0}`);
  }

  // 3. MAPPING
  const templateUrls = (oldTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const seoUrls = (allSeoPages || []).map((page) => ({
    url: `${baseUrl}/hire/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 4. STATIC ROUTES
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/create`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const allUrls = [...staticRoutes, ...templateUrls, ...seoUrls];
  console.log(`🚀 SITEMAP GENERATION COMPLETE: ${allUrls.length} URLs`);
  
  return allUrls;
}