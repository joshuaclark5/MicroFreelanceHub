import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// ✅ Force dynamic so Vercel rebuilds this on every request (no caching)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const timestamp = new Date().toISOString();
  console.log(`🗺️ SITEMAP GENERATION STARTED at ${timestamp}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. LOGGING: Check if Environment Variables exist
  if (!supabaseUrl) console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing!');
  
  if (!serviceKey) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is missing!');
    // Fallback log to see if we are accidentally using the Anon key
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Warning: Falling back to ANON KEY (RLS must be disabled for this to work)');
    }
  } else {
    // Log first 5 chars to verify it's the Service Key (starts with ey...)
    console.log(`🔑 Using Service Key: ${serviceKey.substring(0, 5)}...`);
  }

  // Initialize Client
  // Note: We use the Service Key if available, otherwise fallback to empty string (which will error out safely in the logs)
  const supabase = createClient(supabaseUrl || '', serviceKey || '', {
    auth: {
      persistSession: false, // Important for server-side usage
    },
  });

  const baseUrl = 'https://www.microfreelancehub.com';

  // 2. FETCH TEMPLATES (Old "sow_documents")
  const { data: oldTemplates, error: templateError } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null)
    .limit(1000);

  if (templateError) {
    console.error('❌ Error fetching templates:', templateError.message);
  } else {
    console.log(`✅ Templates Found: ${oldTemplates?.length || 0}`);
  }

  // 3. FETCH SEO PAGES (The New Content Engine)
  // We fetch just the slug to keep it light
  const { data: newSeoPages, error: seoError } = await supabase
    .from('seo_pages')
    .select('slug')
    .limit(10000); 

  if (seoError) {
    console.error('❌ Error fetching SEO pages:', seoError.message);
  } else {
    console.log(`✅ SEO Pages Found: ${newSeoPages?.length || 0}`);
  }

  // 4. MAPPING
  const templateUrls = (oldTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const seoUrls = (newSeoPages || []).map((page) => ({
    url: `${baseUrl}/hire/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 5. STATIC ROUTES
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/create`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const total = [...staticRoutes, ...templateUrls, ...seoUrls];
  
  console.log(`🚀 SITEMAP FINISHED. Total URLs: ${total.length}`);
  
  return total;
}