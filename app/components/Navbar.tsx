'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { createClient } from '../supabaseClient';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

useEffect(() => {
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);
  };
  getUser();
}, []);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          MicroFreelanceHub
        </Link>

        {/* Right Side Buttons */}
        <div className="hidden gap-4 md:flex">
          <Link href="/articles" className="text-gray-600 hover:text-black mt-2">
            Articles
          </Link>
          <Link href="/create" className="text-gray-600 hover:text-black mt-2">
            New SOW
          </Link>

          {userEmail ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Log In
            </Link>
          )}
        </div>
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="rounded-md border border-gray-200 p-2 text-gray-700 md:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {isMenuOpen && (
        <div className="container mx-auto flex flex-col gap-3 px-4 pt-4 md:hidden">
          <Link href="/articles" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Articles
          </Link>
          <Link href="/create" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            New SOW
          </Link>
          {userEmail ? (
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-200 px-3 py-2 text-left text-sm font-medium hover:bg-gray-300"
            >
              Log Out
            </button>
          ) : (
            <Link href="/login" className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Log In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
