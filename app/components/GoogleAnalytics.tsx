'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  // Auth URLs may contain one-time codes. A continuation-page view is not a signup.
  if (['/login', '/reset-password', '/signup-success'].includes(pathname)) return null;
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-3PZE2XQMH0`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3PZE2XQMH0', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
