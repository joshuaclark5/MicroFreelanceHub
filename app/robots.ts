import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow human search engines (Google, Bing)
        userAgent: '*',
        allow: '/',
      },
      {
        // Explicitly invite AI Bots to read your templates
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'anthropic-ai'],
        allow: '/',
      }
    ],
    sitemap: 'https://www.microfreelancehub.com/sitemap.xml',
  }
}