import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// ✅ Force dynamic so Vercel rebuilds this on every request (no caching)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log('🗺️ GENERATING SITEMAP STARTED...');

  // 1. DEBUG THE KEY (Check if Vercel actually has the secret)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('❌ CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables!');
  } else {
    console.log(`🔑 Service Key loaded (Starts with: ${serviceKey.substring(0, 5)}...)`);
  }

  // Initialize Supabase Admin Client (Bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || '', // Fallback to empty string to prevent crash, logs will catch it
    {
      auth: {
        persistSession: false, // Important for server-side usage
      },
    }
  );

  const baseUrl = 'https://www.microfreelancehub.com';

  // 2. FETCH TEMPLATES (Old "sow_documents")
  const { data: oldTemplates, error: templateError } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null)
    .limit(10000);

  if (templateError) {
    console.error('❌ Error fetching templates:', templateError.message);
  } else {
    console.log(`✅ Fetched ${oldTemplates?.length || 0} Old Templates`);
  }

  const oldTemplateUrls = (oldTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. FETCH SEO PAGES (The New Content Engine)
  const { data: newSeoPages, error: seoError } = await supabase
    .from('seo_pages')
    .select('slug')
    .limit(10000);

  if (seoError) {
    console.error('❌ Error fetching SEO pages:', seoError.message);
  } else {
    console.log(`✅ Fetched ${newSeoPages?.length || 0} SEO Pages`);
  }

  const newSeoUrls = (newSeoPages || []).map((page) => ({
    url: `${baseUrl}/hire/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 4. STATIC ROUTES
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // LEGAL PAGES
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // 5. MERGE & RETURN
  const allUrls = [...staticRoutes, ...oldTemplateUrls, ...newSeoUrls];
  console.log(`🚀 SITEMAP COMPLETE: Returning ${allUrls.length} total URLs`);
  
  return allUrls;
}