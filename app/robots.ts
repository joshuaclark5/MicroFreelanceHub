import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // General rule for all standard search engines
        userAgent: '*',
        allow: '/',
        // 👉 ADDED TRAILING SLASHES: Blocks the entire directories properly
        disallow: ['/login', '/dashboard/', '/create/', '/api/'],
      },
      {
        // Explicit VIP pass for all major AI crawlers
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'anthropic-ai'],
        // 👉 Added trailing slashes here as well for consistency
        allow: ['/', '/templates/', '/alternatives/'],
        disallow: ['/login', '/dashboard/', '/create/', '/api/'],
      }
    ],
    sitemap: 'https://www.microfreelancehub.com/sitemap.xml',
  };
}