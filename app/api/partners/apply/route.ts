import { NextResponse } from 'next/server';

const JOSHUA_EMAIL = 'joshuastevenclark@gmail.com';
const FROM_EMAIL = 'MicroFreelanceHub <support@microfreelancehub.com>';

function cleanText(value: unknown, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makeRefCode(name: string, email: string) {
  const base = (name || email.split('@')[0] || 'partner')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'partner';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmail(payload: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is missing.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Resend failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (cleanText(body.website)) {
      return NextResponse.json({
        message: 'Partner request received.',
        referralLink: '',
      });
    }

    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 160).toLowerCase();
    const channelUrl = cleanText(body.channelUrl, 300);
    const audience = cleanText(body.audience, 200);
    const audienceSize = cleanText(body.audienceSize, 120);
    const notes = cleanText(body.notes, 1000);

    if (!name || !email || !channelUrl) {
      return NextResponse.json({ error: 'Name, email, and channel URL are required.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const refCode = makeRefCode(name, email);
    const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const referralLink = `${origin.replace(/\/$/, '')}/?ref=${encodeURIComponent(refCode)}`;

    const summary = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Channel: ${channelUrl}`,
      `Audience: ${audience || 'Not provided'}`,
      `Audience size: ${audienceSize || 'Not provided'}`,
      `Ref code: ${refCode}`,
      `Referral link: ${referralLink}`,
      '',
      `Notes: ${notes || 'Not provided'}`,
    ].join('\n');

    await sendEmail({
      from: FROM_EMAIL,
      to: [JOSHUA_EMAIL],
      reply_to: [email],
      subject: `Partner request: ${name}`,
      text: summary,
      html: `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap;">${escapeHtml(summary)}</pre>`,
    });

    const partnerText = `Hi ${name},

Thanks for requesting a MicroFreelanceHub partner link.

Here is your provisional referral link:
${referralLink}

Joshua will review partner fit before commissions are approved. Approved partners can earn 30% recurring commission on referred paid subscriptions while the customer stays subscribed.

MicroFreelanceHub`;

    await sendEmail({
      from: FROM_EMAIL,
      to: [email],
      reply_to: [JOSHUA_EMAIL],
      subject: 'Your MicroFreelanceHub partner link',
      text: partnerText,
      html: partnerText
        .split('\n\n')
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
        .join('\n'),
    });

    return NextResponse.json({
      message: 'Your provisional partner link is ready. Joshua will review partner fit before commissions are approved.',
      referralLink,
    });
  } catch (err: any) {
    console.error('Partner application error:', err);
    return NextResponse.json({ error: 'Unable to submit partner request right now.' }, { status: 500 });
  }
}
