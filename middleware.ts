import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get country from Vercel's geo data
  const country = request.geo?.country;

  // Define high-risk countries you see spam from (Singapore, China, Russia)
  const highRiskCountries = ['SG', 'CN', 'RU'];

  // If the request is from a high-risk country...
  if (country && highRiskCountries.includes(country)) {
    
    // RULE 1: Let them READ the website (GET requests are safe)
    // This allows Google Search Console, AI bots, and real users to see the site.
    if (request.method === 'GET') {
      return NextResponse.next();
    }

    // RULE 2: Block them from SUBMITTING data (POST, PUT, DELETE)
    // This stops spam form submissions, brute-force logins, and API abuse.
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      console.log(`🛑 Blocked malicious ${request.method} from ${country}`);
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
    // Match all routes except static files, images, robots, and sitemaps
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};