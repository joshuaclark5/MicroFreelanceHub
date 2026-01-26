import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const alt = 'Free Freelance Contract Template'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
// Image generation
export default async function Image({ params }: { params: { slug: string } }) {
  // 1. Get the slug
  const slug = params.slug
  
  // 2. Format it
  const rawTitle = slug
    .replace('contract', '') // Remove the word "contract" so it doesn't say "Graphic Design Contract Contract"
    .replace('template', '')
    .replace(/-/g, ' ')
    .trim()

  // 3. Capitalize
  const title = rawTitle.replace(/\b\w/g, (l) => l.toUpperCase())
 
  return new ImageResponse(
    (
      // ImageDesign
      <div
        style={{
          background: 'linear-gradient(to bottom right, #111827, #1e3a8a)', // Slate-900 to Blue-900
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {/* Subtle Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25px 25px, #3b82f6 2%, transparent 0%), radial-gradient(circle at 75px 75px, #3b82f6 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            opacity: 0.1,
          }}
        />

        {/* Badge - BLUE for Templates */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#2563eb', // Blue-600
            color: 'white',
            padding: '10px 24px',
            borderRadius: '50px',
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 40,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
        >
          Verified Template
        </div>

        {/* Main Title */}
        <div
          style={{
            display: 'flex', 
            fontSize: 80,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 20,
            backgroundImage: 'linear-gradient(to right, #ffffff, #93c5fd)', // White to Blue-300
            backgroundClip: 'text',
            color: 'transparent',
            maxWidth: '1000px',
            justifyContent: 'center',
            textAlign: 'center',
            flexWrap: 'wrap',
          }}
        >
          {title} Contract
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#bfdbfe', // Blue-200
            marginTop: 20,
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          Download, Edit, and Sign in 30 Seconds
        </div>

        {/* Brand Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            fontSize: 24,
            fontWeight: 600,
            color: '#60a5fa', // Blue-400
            display: 'flex',
            alignItems: 'center',
          }}
        >
          MicroFreelanceHub
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}