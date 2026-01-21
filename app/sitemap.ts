import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.microfreelancehub.com'

  // 1. Initialize Supabase Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 2. Fetch the NEW Dynamic SEO Pages from the database
  const { data: seoPages } = await supabase
    .from('seo_pages')
    .select('slug, updated_at')

  const seoRoutes = seoPages?.map((page) => ({
    url: `${baseUrl}/hire/${page.slug}`,
    lastModified: page.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  })) || []

  // 3. Define your Static Routes
  const staticRoutes = [
    '',
    '/login',
    '/create',
    '/dashboard',
    '/pricing',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // 4. (Optional) Keep your old manual templates if you want them
  // If you have a hardcoded list of old templates, you can keep them here.
  // For now, I'll assume we are focusing on the new DB ones.

  return [...staticRoutes, ...seoRoutes]
}