import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const targetsPath = path.join(process.cwd(), 'scripts', 'outreach-targets.json');
const isSendMode = process.argv.includes('--send');
const resendApiKey = process.env.RESEND_API_KEY;

function loadTargets() {
  const raw = fs.readFileSync(targetsPath, 'utf8');
  return JSON.parse(raw);
}

function saveTargets(targets) {
  fs.writeFileSync(targetsPath, `${JSON.stringify(targets, null, 2)}\n`);
}

function partnerLink(refCode) {
  const cleanCode = encodeURIComponent(refCode.trim().toLowerCase());
  return `https://www.microfreelancehub.com/partners?ref=${cleanCode}`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail(target) {
  const link = partnerLink(target.refCode);
  const note = target.personalNote?.trim()
    ? `${target.personalNote.trim()}\n\n`
    : '';

  const text = `Hi ${target.name},

${note}I am reaching out about MicroFreelanceHub, a simple tool for freelancers to outline scope, pricing, approvals, timelines, signatures, and payment steps before a client project starts.

Your audience seems like a fit: ${target.audience || 'people who work directly with clients'}.

Would you be open to taking a quick look and sharing it if it feels useful? I can set up a partner link so signups and paid plans from your audience are tracked.

Partner page:
${link}

No pressure if it is not a fit.

Joshua
MicroFreelanceHub
joshuastevenclark@gmail.com`;

  const html = text
    .split('\n\n')
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n');

  return {
    from: 'MicroFreelanceHub <support@microfreelancehub.com>',
    to: [target.email],
    reply_to: ['joshuastevenclark@gmail.com'],
    subject: 'Possible partner fit for your freelance audience',
    text,
    html,
  };
}

async function sendEmail(payload) {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is missing.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
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

const targets = loadTargets();
let changed = false;

for (const target of targets) {
  if (!target.email) {
    console.log(`SKIP ${target.name}: missing email`);
    continue;
  }
  if (target.sentAt) {
    console.log(`SKIP ${target.name}: already sent at ${target.sentAt}`);
    continue;
  }
  if (!target.approved) {
    console.log(`SKIP ${target.name}: not approved`);
    continue;
  }

  const payload = buildEmail(target);

  if (!isSendMode) {
    console.log(`\n--- PREVIEW: ${target.name} <${target.email}> ---`);
    console.log(payload.text);
    continue;
  }

  const result = await sendEmail(payload);
  target.sentAt = new Date().toISOString();
  target.resendId = result.id;
  changed = true;
  console.log(`SENT ${target.name}: ${result.id}`);
}

if (changed) {
  saveTargets(targets);
}

if (!isSendMode) {
  console.log('\nPreview only. Run npm run outreach:send after Joshua approves targets and copy.');
}
