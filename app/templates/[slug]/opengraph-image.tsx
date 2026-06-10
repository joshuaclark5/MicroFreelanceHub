import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const alt = 'Free MicroFreelanceHub Template'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
 
export default async function Image({ params }: { params: { slug: string } }) {
  const slug = params.slug
  
  const isEmail = slug.startsWith('late-payment-email-');
  const isInvoice = !isEmail && slug.includes('-invoice');
  const isEstimate = !isEmail && slug.includes('-estimate');
  const isQuote = !isEmail && slug.includes('-quote');
  const isRetainer = !isEmail && slug.includes('-retainer');
  const isChangeOrder = !isEmail && slug.includes('-change-order');
  const isScopeOfWork = !isEmail && slug.includes('-scope-of-work');
  const isWorkOrder = !isEmail && slug.includes('-work-order');
  const isSubcontractor = !isEmail && slug.includes('-subcontractor');
  const isNDA = !isEmail && (slug.includes('-non-disclosure') || slug.includes('-nda'));
  const isDemandLetter = !isEmail && slug.includes('-late-payment-demand-letter');
  const isCeaseAndDesist = !isEmail && slug.includes('-cease-and-desist-letter');
  const isServiceAgreement = !isEmail && slug.includes('-service-agreement');
  const isMaintenance = !isEmail && slug.includes('-maintenance-agreement');
  const isContractor = !isEmail && slug.includes('-independent-contractor-agreement');
  const isSignOff = !isEmail && slug.includes('-project-sign-off-form');
  const isDepositAgreement = !isEmail && slug.includes('-deposit-agreement');
  const isProposal = isEstimate || isQuote;
  
  let cleanSlug = slug;
  cleanSlug = cleanSlug.replace(/^late-payment-email-/, '');
  cleanSlug = cleanSlug.replace(/^hire-/, '');

  const suffixes = [
    '-invoice-template', '-invoice', 
    '-contract-template', '-contract', 
    '-estimate-template', '-estimate', 
    '-quote-template', '-quote', 
    '-retainer-agreement', '-retainer',
    '-change-order-template', '-change-order',
    '-scope-of-work-template', '-scope-of-work',
    '-work-order-template', '-work-order',
    '-subcontractor-agreement', '-subcontractor',
    '-non-disclosure-agreement', '-nda',
    '-late-payment-demand-letter',
    '-cease-and-desist-letter',
    '-service-agreement-template', '-service-agreement',
    '-maintenance-agreement-template', '-maintenance-agreement',
    '-independent-contractor-agreement',
    '-project-sign-off-form',
    '-deposit-agreement',
    '-template'
  ];
  
  for (const suffix of suffixes) {
    if (cleanSlug.endsWith(suffix)) {
      cleanSlug = cleanSlug.slice(0, -suffix.length);
      break; 
    }
  }

  const title = cleanSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
 
  // 👉 Dynamic Background Colors
  const bgGradient = isEmail ? 'linear-gradient(to bottom right, #0f172a, #312e81)' 
    : isInvoice ? 'linear-gradient(to bottom right, #0f172a, #064e3b)' 
    : isProposal ? 'linear-gradient(to bottom right, #0f172a, #78350f)' 
    : isRetainer ? 'linear-gradient(to bottom right, #0f172a, #4c1d95)' 
    : isChangeOrder ? 'linear-gradient(to bottom right, #0f172a, #881337)' 
    : isScopeOfWork ? 'linear-gradient(to bottom right, #0f172a, #164e63)' 
    : isWorkOrder ? 'linear-gradient(to bottom right, #0f172a, #7c2d12)' 
    : isSubcontractor ? 'linear-gradient(to bottom right, #0f172a, #134e4a)' 
    : isNDA ? 'linear-gradient(to bottom right, #0f172a, #27272a)' 
    : isDemandLetter ? 'linear-gradient(to bottom right, #0f172a, #7f1d1d)'
    : isCeaseAndDesist ? 'linear-gradient(to bottom right, #0f172a, #44403c)'
    : isServiceAgreement ? 'linear-gradient(to bottom right, #0f172a, #86198f)'
    : isMaintenance ? 'linear-gradient(to bottom right, #0f172a, #3f6212)'
    : isContractor ? 'linear-gradient(to bottom right, #0f172a, #075985)'
    : isSignOff ? 'linear-gradient(to bottom right, #0f172a, #9d174d)'
    : isDepositAgreement ? 'linear-gradient(to bottom right, #0f172a, #065f46)'
    : 'linear-gradient(to bottom right, #0f172a, #1e3a8a)'; 

  // 👉 Dynamic Badge Colors
  const badgeColor = isEmail ? '#4f46e5' 
    : isInvoice ? '#059669' 
    : isProposal ? '#d97706' 
    : isRetainer ? '#7c3aed'
    : isChangeOrder ? '#e11d48'
    : isScopeOfWork ? '#0891b2'
    : isWorkOrder ? '#ea580c'
    : isSubcontractor ? '#0d9488'
    : isNDA ? '#52525b'
    : isDemandLetter ? '#dc2626'
    : isCeaseAndDesist ? '#78716c'
    : isServiceAgreement ? '#c026d3'
    : isMaintenance ? '#65a30d'
    : isContractor ? '#0ea5e9'
    : isSignOff ? '#ec4899'
    : isDepositAgreement ? '#047857'
    : '#2563eb'; 
  
  // 👉 Dynamic Labels
  const docTypeLabel = isEmail ? 'Email Sequence' 
    : isInvoice ? 'Invoice Template' 
    : isEstimate ? 'Estimate Template' 
    : isQuote ? 'Quote Template' 
    : isRetainer ? 'Retainer Agreement'
    : isChangeOrder ? 'Change Order'
    : isScopeOfWork ? 'Scope of Work'
    : isWorkOrder ? 'Work Order'
    : isSubcontractor ? 'Subcontractor Agreement'
    : isNDA ? 'Non-Disclosure Agreement'
    : isDemandLetter ? 'Demand Letter'
    : isCeaseAndDesist ? 'Cease & Desist'
    : isServiceAgreement ? 'Service Agreement'
    : isMaintenance ? 'Maintenance Agreement'
    : isContractor ? 'Contractor Agreement'
    : isSignOff ? 'Project Sign-Off Form'
    : isDepositAgreement ? 'Deposit Agreement'
    : 'Contract Template';
  
  // 👉 High-Conversion Title Copy
  const mainTitleSuffix = isEmail ? 'That Gets You Paid' 
    : isInvoice ? 'With Instant Payments'
    : isProposal ? 'That Secures Deposits'
    : isRetainer ? 'For Recurring Revenue'
    : isChangeOrder ? 'To Stop Scope Creep'
    : isScopeOfWork ? 'To Protect Your Time'
    : isWorkOrder ? 'To Start The Job Fast'
    : isSubcontractor ? 'To Outsource Safely'
    : isNDA ? 'To Protect Your IP'
    : isDemandLetter ? 'To Force Payment Now'
    : isCeaseAndDesist ? 'To Stop Unauthorized Use'
    : isServiceAgreement ? 'To Define Your Services'
    : isMaintenance ? 'For Ongoing Support'
    : isContractor ? 'To Ensure 1099 Status'
    : isSignOff ? 'To Prevent Free Revisions'
    : isDepositAgreement ? 'To Secure Upfront Payment'
    : 'That Protects Your Time';

  // 👉 Subtitle Copy
  const subtitleText = isEmail ? 'Automate your collections & stop chasing checks'
    : isInvoice ? 'Enable Stripe payments & streamline cash flow' 
    : isProposal ? 'Set clear boundaries & lock in your project rate'
    : isRetainer ? 'Automate monthly billing & secure your baseline income'
    : isChangeOrder ? 'Never do unpaid extra work for clients again'
    : isScopeOfWork ? 'Define exact deliverables and revision limits'
    : isWorkOrder ? 'Document site details, labor, and authorize the start'
    : isSubcontractor ? 'Prevent client poaching and limit your liability'
    : isNDA ? 'Secure trade secrets and unreleased portfolio work'
    : isDemandLetter ? 'Issue a formal legal threat and set a hard deadline'
    : isCeaseAndDesist ? 'Demand immediate removal of stolen or unpaid work'
    : isServiceAgreement ? 'Clearly outline your ongoing service terms and SLAs'
    : isMaintenance ? 'Secure long-term revenue with a structured upkeep plan'
    : isContractor ? 'Legally define autonomy, tax liability, and scope'
    : isSignOff ? 'Force formal acceptance of the final deliverables'
    : isDepositAgreement ? 'Collect deposits before reserving labor or materials'
    : 'Prevent scope creep & secure your upfront deposit';
    
  // 👉 Subtitle Colors
  const subtitleColor = isEmail ? '#a5b4fc' : isInvoice ? '#6ee7b7' : isProposal ? '#fcd34d' : isRetainer ? '#c4b5fd' : isChangeOrder ? '#fda4af' : isScopeOfWork ? '#67e8f9' : isWorkOrder ? '#fdba74' : isSubcontractor ? '#5eead4' : isNDA ? '#a1a1aa' : isDemandLetter ? '#fca5a5' : isCeaseAndDesist ? '#d6d3d1' : isServiceAgreement ? '#e879f9' : isMaintenance ? '#a3e635' : isContractor ? '#7dd3fc' : isSignOff ? '#f472b6' : isDepositAgreement ? '#6ee7b7' : '#93c5fd';

  return new ImageResponse(
    (
      <div style={{ background: bgGradient, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: 'white', padding: '40px', textAlign: 'center', position: 'relative', }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2, }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: badgeColor, color: 'white', padding: '8px 24px', borderRadius: '50px', fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 30, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: 10, }}>
          Free {docTypeLabel}
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, color: 'white', maxWidth: '1050px', justifyContent: 'center', textAlign: 'center', flexWrap: 'wrap', textShadow: '0 4px 8px rgba(0,0,0,0.4)', zIndex: 10, }}>
          {title} {mainTitleSuffix}
        </div>
        <div style={{ display: 'flex', fontSize: 32, fontWeight: 600, color: subtitleColor, marginTop: 10, justifyContent: 'center', textAlign: 'center', zIndex: 10, maxWidth: '850px', lineHeight: 1.3, }}>
          {subtitleText}
        </div>
        <div style={{ display: 'flex', marginTop: 40, padding: '12px 32px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: 24, fontWeight: 700, color: 'white', zIndex: 10, }}>
          Create & Send in 60 Seconds →
        </div>
      </div>
    ), { ...size }
  )
}
