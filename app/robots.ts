import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // General rule for all standard search engines
        userAgent: '*',
        allow: '/',
        disallow: ['/login', '/dashboard', '/create', '/api'],
      },
      {
        // Explicit VIP pass for all major AI crawlers
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'anthropic-ai'],
        allow: ['/', '/templates', '/alternatives'],
      }
    ],
    sitemap: 'https://www.microfreelancehub.com/sitemap.xml',
  };
}