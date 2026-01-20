import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Force dynamic so it never caches an empty list again
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 👇 CHANGED: We removed 'updated_at' to prevent crashing if the column is missing
  const { data: templates, error } = await supabase
    .from('sow_documents')
    .select('slug') 
    .not('slug', 'is', null);

  // If there's an error, log it to the server console (optional safety)
  if (error) {
    console.error("Sitemap Error:", error);
  }

  const baseUrl = 'https://www.microfreelancehub.com';

  const templateUrls = (templates || []).map((doc) => ({
    url: `${baseUrl}/templates/${doc.slug}`,
    lastModified: new Date(), // 👇 Fallback: Just use today's date
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