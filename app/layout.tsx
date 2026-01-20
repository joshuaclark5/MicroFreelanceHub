import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MicroFreelanceHub | AI Contract Generator',
  description: 'Free AI-powered contract templates for freelancers. Protect your work with professional SOWs.',
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
      {/* 📊 Google Analytics connected to your specific ID */}
      <GoogleAnalytics gaId="G-3PZE2XQMH0" />
    </html>
  );
}