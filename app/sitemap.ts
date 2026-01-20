import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// 👇 THIS IS THE MAGIC LINE. It forces the sitemap to run fresh every time.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: templates } = await supabase
    .from('sow_documents')
    .select('slug, updated_at')
    .not('slug', 'is', null);

  const baseUrl = 'https://www.microfreelancehub.com';

  const templateUrls = (templates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(doc.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

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