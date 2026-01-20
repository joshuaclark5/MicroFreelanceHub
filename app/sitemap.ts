import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 👇 DEBUGGING: Log what we find to the Vercel Console
  console.log("🔍 SITEMAP: Starting generation...");
  
  const { data: templates, error } = await supabase
    .from('sow_documents')
    .select('slug, updated_at')
    .not('slug', 'is', null);

  if (error) {
    console.error("❌ SITEMAP ERROR:", error.message);
  } else {
    console.log(`✅ SITEMAP SUCCESS: Found ${templates?.length} templates.`);
  }

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