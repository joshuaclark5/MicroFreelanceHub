import type { Metadata } from 'next';

// Workspace tools are account-specific and should not appear in search results.
// Keep them crawlable so search engines can observe this directive; robots.txt
// must not block the route before the noindex metadata is read.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
