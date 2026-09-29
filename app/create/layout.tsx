import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.microfreelancehub.com/create' },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
