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
  // 1. Get the slug (e.g., "hire-plumber")
  const slug = params.slug
  
  // 2. Format it: remove "hire-", replace dashes with spaces, capitalize
  // Result: "Plumber" or "Rust Developer"
  const rawTitle = slug.replace('hire-', '').replace(/-/g, ' ')
  const title = rawTitle.replace(/\b\w/g, (l) => l.toUpperCase())
 
  return new ImageResponse(
    (
      // ImageDesign
      <div
        style={{
          background: 'linear-gradient(to bottom right, #111827, #000000)',
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
            backgroundImage: 'radial-gradient(circle at 25px 25px, #374151 2%, transparent 0%), radial-gradient(circle at 75px 75px, #374151 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            opacity: 0.2,
          }}
        />

        {/* Badge */}
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          Free Template
        </div>

        {/* Main Title - ADDED display: 'flex' here to fix error */}
        <div
          style={{
            display: 'flex', 
            fontSize: 80,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 20,
            backgroundImage: 'linear-gradient(to right, #ffffff, #9ca3af)',
            backgroundClip: 'text',
            color: 'transparent',
            maxWidth: '900px',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {title} Contract
        </div>

        {/* Subtitle - ADDED display: 'flex' here for safety */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#9ca3af', // Gray-400
            marginTop: 20,
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          Draft, Sign, and Download in 30 Seconds
        </div>

        {/* Brand Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            fontSize: 24,
            fontWeight: 600,
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          MicroFreelanceHub
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}