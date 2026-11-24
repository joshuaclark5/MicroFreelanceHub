'use client';

import Link from 'next/link';
import Brand from './Brand';
import AccountControl from './AccountControl';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav aria-label="Main navigation" className="mfh-public-nav w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="d4-brand">
          <Brand/>
        </Link>

        {/* Right Side Buttons */}
        <div className="hidden gap-4 lg:flex"><Link href="/features" className="text-gray-600 hover:text-black mt-2">Features</Link>
          <Link href="/templates" className="text-gray-600 hover:text-black mt-2">Templates</Link>
          <Link href="/pricing" className="text-gray-600 hover:text-black mt-2">Pricing</Link>
          <a href="/support" className="text-gray-600 hover:text-black mt-2">Help</a>
          
          <Link href="/articles" className="text-gray-600 hover:text-black mt-2">
            Articles
          </Link>
          <Link href="/tools/client-message-generator" className="text-gray-600 hover:text-black mt-2">
            Client Reply Tool
          </Link>
          <Link href="/create" className="text-gray-600 hover:text-black mt-2">
            New SOW
          </Link>

          <AccountControl/>
        </div>
        <button
          type="button"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="rounded-md border border-gray-200 p-2 text-gray-700 lg:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <div className="public-mobile-account"><AccountControl/></div>
      {isMenuOpen && (
        <div className="container mx-auto flex flex-col gap-3 px-4 pt-4 lg:hidden">
          <Link href="/features" className="p-3">Features</Link><Link href="/templates" className="p-3">Templates</Link>
          <Link href="/pricing" className="p-3">Pricing</Link>
          <a href="/support" className="p-3">Help</a>
          
          <Link href="/articles" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Articles
          </Link>
          <Link href="/tools/client-message-generator" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Client Reply Tool
          </Link>
          <Link href="/create" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            New SOW
          </Link>
          
        </div>
      )}
    </nav>
  );
}
