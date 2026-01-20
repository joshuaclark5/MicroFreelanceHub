import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 👇 WE USE THE SERVICE ROLE KEY HERE (Admin Access)
  // This bypasses RLS so we can find the templates to list them
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );

  // 1. Get all your templates
  const { data: templates } = await supabase
    .from('sow_documents')
    .select('slug, updated_at')
    .not('slug', 'is', null);

  const baseUrl = 'https://www.microfreelancehub.com';

  // 2. Build the template URLs
  const templateUrls = (templates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(doc.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Add the static pages
  return [
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
    ...templateUrls,
  ];
}