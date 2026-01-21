import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// ✅ Force dynamic so Vercel rebuilds this on every request (no caching)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Initialize Supabase Admin Client (Bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );

  const baseUrl = 'https://www.microfreelancehub.com';

  // 1. FETCH TEMPLATES (Old "sow_documents")
  // Limit set to 10,000 so you never have to worry about this again.
  const { data: oldTemplates } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null)
    .limit(10000);

  const oldTemplateUrls = (oldTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 2. FETCH SEO PAGES (The New Content Engine)
  // Limit set to 10,000. This covers your goal of 2,000 pages + room to grow.
  const { data: newSeoPages } = await supabase
    .from('seo_pages')
    .select('slug')
    .limit(10000);

  const newSeoUrls = (newSeoPages || []).map((page) => ({
    url: `${baseUrl}/hire/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 3. STATIC ROUTES
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    // LEGAL PAGES
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  // 4. MERGE & RETURN
  return [...staticRoutes, ...oldTemplateUrls, ...newSeoUrls];
}