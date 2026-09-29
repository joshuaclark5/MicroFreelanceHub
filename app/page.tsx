import type { Metadata } from 'next';
import HomePage from './HomePage';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.microfreelancehub.com' },
};

export default function Home() {
  return <HomePage />;
}
