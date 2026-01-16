import { ReactNode } from 'react';

export const metadata = {
  title: 'MicroFreelanceHub',
  description: 'Create clean and structured scopes of work fast',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
