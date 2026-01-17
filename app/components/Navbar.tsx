'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '../supabaseClient';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
        <div className="flex gap-4">
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
      </div>
    </nav>
  );
}
