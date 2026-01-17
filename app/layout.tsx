import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';
import Navbar from './components/Navbar'; // Import the new component

export const metadata: Metadata = {
  title: 'MicroFreelanceHub',
  description: 'Create clean and structured scopes of work fast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <Providers>
          <Navbar /> {/* This adds the bar to the top */}
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}