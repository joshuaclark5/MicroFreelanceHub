import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_CRAWLER_TOKENS = [
  'adsbot-google',
  'anthropic-ai',
  'applebot',
  'bingbot',
  'chatgpt-user',
  'claudebot',
  'claude-user',
  'claude-web',
  'duckduckbot',
  'facebookexternalhit',
  'gemini',
  'google-extended',
  'google-inspectiontool',
  'googleother',
  'googlebot',
  'grok',
  'gptbot',
  'linkedinbot',
  'meta-externalagent',
  'oai-searchbot',
  'perplexity-user',
  'perplexitybot',
  'slurp',
  'telegrambot',
  'twitterbot',
  'whatsapp',
  'xai',
];

const BLOCKED_BOT_TOKENS = [
  'ahrefsbot',
  'aiohttp',
  'barkrowler',
  'blexbot',
  'crawler4j',
  'curl',
  'dataforseobot',
  'dotbot',
  'go-http-client',
  'httpclient',
  'java/',
  'libwww-perl',
  'masscan',
  'mj12bot',
  'nikto',
  'nmap',
  'petalbot',
  'python-requests',
  'scrapy',
  'semrushbot',
  'wget',
  'zgrab',
];

const HUMAN_BROWSER_TOKENS = [
  'chrome',
  'crios',
  'edg',
  'firefox',
  'fxios',
  'mobile safari',
  'safari',
  'samsungbrowser',
];

const HIGH_RISK_COUNTRIES = ['SG', 'CN', 'RU'];

function includesAny(value: string, tokens: string[]) {
  return tokens.some((token) => value.includes(token));
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() ?? '';
  const country = request.geo?.country ?? request.headers.get('x-vercel-ip-country') ?? undefined;
  const isAllowedCrawler = includesAny(userAgent, ALLOWED_CRAWLER_TOKENS);
  const isHumanBrowser = includesAny(userAgent, HUMAN_BROWSER_TOKENS);

  if (!isAllowedCrawler && (!userAgent || includesAny(userAgent, BLOCKED_BOT_TOKENS))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (country && HIGH_RISK_COUNTRIES.includes(country)) {
    if (request.method === 'GET' && (isAllowedCrawler || isHumanBrowser)) {
      return NextResponse.next();
    }

    if (request.method === 'GET') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      console.log(`Blocked ${request.method} from high-risk country ${country}`);
      return NextResponse.json(
        { error: 'Access Denied: High-risk region data submission blocked.' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
