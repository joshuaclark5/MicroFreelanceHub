export const metadata = {
  title: 'MicroFreelanceHub',
  description: 'Create clean and structured scopes of work fast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}