import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import FeedbackWidget from './components/FeedbackWidget';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google'; // 👈 NEW IMPORT

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.microfreelancehub.com'),
  title: {
    default: 'MicroFreelance | Professional Contracts & Payments',
    template: '%s | MicroFreelance',
  },
  description: 'The all-in-one workspace for freelancers. Create professional agreements, collect digital signatures, and automate recurring payments with Stripe.',
  keywords: [
    'freelance contract generator', 
    'retainer agreement template', 
    'stripe for freelancers', 
    'digital signatures', 
    'client invoicing'
  ],
  openGraph: {
    title: 'MicroFreelance | Contracts that get you paid',
    description: 'Create, sign, and bill monthly retainers in seconds.',
    url: 'https://www.microfreelancehub.com',
    siteName: 'MicroFreelance',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MicroFreelance | Professional Contracts',
    description: 'The fastest way to sign clients and automate monthly billing.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        
        {/* MAIN CONTENT */}
        <main className="flex-grow">
            {children}
        </main>
        
        {/* 🛡️ GLOBAL LEGAL FOOTER (Hidden on Print) */}
        <footer className="bg-white border-t border-gray-200 py-12 px-4 print:hidden">
            <div className="max-w-7xl mx-auto text-center">
                
                {/* Brand */}
                <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
                    <div className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs">M</div>
                    <span className="font-bold text-gray-900 text-sm">MicroFreelance</span>
                </div>

                {/* The Legal Shield */}
                <p className="text-[10px] text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">
                    <strong>DISCLAIMER:</strong> MicroFreelanceHub provides templates and software for informational purposes only. We are not a law firm and do not provide legal advice. Your use of this site and any documents generated is at your own risk. Disputes regarding payments or contracts are solely between the Client and the Service Provider. MicroFreelanceHub processes payments via Stripe Connect and does not hold funds.
                </p>

                {/* Links */}
                <div className="flex justify-center gap-6 text-xs text-gray-500 font-medium">
                    <Link href="/terms-of-service" className="hover:text-black transition-colors">Terms of Service</Link>
                    <Link href="/privacy-policy" className="hover:text-black transition-colors">Privacy Policy</Link>
                    <Link href="/disclaimer" className="hover:text-black transition-colors">Full Disclaimer</Link>
                </div>

                <p className="text-[10px] text-gray-300 mt-8">
                    © {new Date().getFullYear()} MicroFreelanceHub. All rights reserved.
                </p>
            </div>
        </footer>

        <FeedbackWidget />
        
        {/* 📊 ANALYTICS COMPONENT */}
        <GoogleAnalytics gaId="G-3PZE2XQMH0" />
      </body>
    </html>
  );
}