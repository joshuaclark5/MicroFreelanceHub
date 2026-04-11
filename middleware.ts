import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get country from Vercel's geo data
  const country = request.geo?.country;

  // Block traffic from Singapore
  if (country === 'SG') {
    return NextResponse.json(
      { error: 'Access Denied' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except:
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
