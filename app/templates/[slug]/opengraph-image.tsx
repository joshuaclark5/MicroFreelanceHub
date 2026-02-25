import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const alt = 'Free MicroFreelanceHub Template'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
// Image generation
export default async function Image({ params }: { params: { slug: string } }) {
  // 1. Get the slug
  const slug = params.slug
  
  // ✅ 2. DETECT MODE: Is this an Invoice or a Contract?
  const isInvoice = slug.includes('-invoice');
  
  // 3. ROBUST FORMATTING
  let cleanSlug = slug;

  // Remove known suffixes from the END of the string only
  const suffixes = ['-invoice-template', '-invoice', '-contract-template', '-contract', '-template'];
  for (const suffix of suffixes) {
    if (cleanSlug.endsWith(suffix)) {
      cleanSlug = cleanSlug.slice(0, -suffix.length);
      break; 
    }
  }

  // Remove "hire-" prefix if it exists (legacy support)
  cleanSlug = cleanSlug.replace(/^hire-/, '');

  // Convert "graphic-designer" to "Graphic Designer"
  const title = cleanSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
 
  // ✅ 4. CHAMELEON STYLING
  const bgGradient = isInvoice 
    ? 'linear-gradient(to bottom right, #0f172a, #064e3b)' // Slate to Emerald
    : 'linear-gradient(to bottom right, #0f172a, #1e3a8a)'; // Slate to Blue

  const badgeColor = isInvoice ? '#059669' : '#2563eb'; // Emerald-600 vs Blue-600
  const docTypeLabel = isInvoice ? 'Invoice' : 'Contract';
  const subtitleText = isInvoice 
    ? 'Itemized Billing & Instant Payments' 
    : 'Professional Scope of Work & Legal Terms';

  return new ImageResponse(
    (
      // ImageDesign
      <div
        style={{
          background: bgGradient,
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
          position: 'relative',
        }}
      >
        {/* Background Grid Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.2,
          }}
        />

        {/* High-CTR Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: badgeColor,
            color: 'white',
            padding: '8px 20px',
            borderRadius: '50px',
            fontSize: 20,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: 40,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 10,
          }}
        >
          Free Template (2026)
        </div>

        {/* Main Title */}
        <div
          style={{
            display: 'flex', 
            fontSize: 70, 
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 20,
            color: 'white',
            maxWidth: '1000px',
            justifyContent: 'center',
            textAlign: 'center',
            flexWrap: 'wrap',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          {title} {docTypeLabel}
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: isInvoice ? '#6ee7b7' : '#93c5fd', // Emerald-300 vs Blue-300
            marginTop: 10,
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {subtitleText}
        </div>

        {/* Footer Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: 0.8,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>MicroFreelanceHub</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}