import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Force dynamic so it never caches an empty list again
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );

  const baseUrl = 'https://www.microfreelancehub.com';

  // 1. FETCH TEMPLATES (Only ones with slugs)
  const { data: oldTemplates } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null);

  const oldTemplateUrls = (oldTemplates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 2. FETCH SEO PAGES
  const { data: newSeoPages } = await supabase
    .from('seo_pages')
    .select('slug');

  const newSeoUrls = (newSeoPages || []).map((page) => ({
    url: `${baseUrl}/hire/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 3. STATIC ROUTES (Added Legal Pages Here 👇)
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
    // ✅ NEW LEGAL PAGES
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

  return [...staticRoutes, ...oldTemplateUrls, ...newSeoUrls];
}