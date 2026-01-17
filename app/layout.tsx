import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MicroFreelanceHub',
  description: 'Create professional SOWs in seconds',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* We removed the Navbar here so it doesn't duplicate on the Dashboard */}
        {children}
      </body>
    </html>
  )
}