import Link from 'next/link';

export default function WaitlistModal({ templateSlug }: { templateSlug?: string }) {
  return (
    <Link href="/login">
      <button className="text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:-translate-y-1 bg-indigo-900 hover:bg-indigo-800 w-full md:w-auto">
        Automate This Sequence &rarr;
      </button>
    </Link>
  );
}
