import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load the standard font
const inter = Inter({ subsets: ['latin'] });

// 🛠️ FIX: Add metadataBase to resolve the warning
export const metadata: Metadata = {
  metadataBase: new URL('https://www.microfreelancehub.com'),
  title: {
    default: 'MicroFreelanceHub | Free AI Contract Generator',
    template: '%s | MicroFreelanceHub',
  },
  description: 'Turn vague ideas into professional contracts. Free AI-powered generator for freelancers.',
  openGraph: {
    title: 'MicroFreelanceHub',
    description: 'Free AI-Powered Freelance Contracts',
    url: 'https://www.microfreelancehub.com',
    siteName: 'MicroFreelanceHub',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MicroFreelanceHub',
    description: 'Free AI-Powered Freelance Contracts',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}