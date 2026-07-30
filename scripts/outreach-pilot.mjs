import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const targetsPath = path.join(process.cwd(), 'scripts', 'outreach-targets.json');
const isSendMode = process.argv.includes('--send');
const isFollowupMode = process.argv.includes('--followups');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const testToArg = process.argv.find((arg) => arg.startsWith('--test-to='));
const sendLimit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : Number.POSITIVE_INFINITY;
const testTo = testToArg ? testToArg.split('=')[1]?.trim() : '';
const resendApiKey = process.env.RESEND_API_KEY;
const followupDelayDays = Number.parseInt(process.env.OUTREACH_FOLLOWUP_DELAY_DAYS || '4', 10);
let shouldRunTargetList = true;

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

function buildInitialEmail(target) {
  const link = partnerLink(target.refCode);
  const note = target.personalNote?.trim()
    ? `${target.personalNote.trim()}\n\n`
    : '';

  const text = `Hi ${target.name},

${note}One of the biggest problems I see for freelancers is that projects start from scattered messages, vague scope, and unclear payment steps. That is when small misunderstandings turn into extra work, awkward approvals, and messy handoffs.

I am reaching out about MicroFreelanceHub, a simple workflow that helps freelancers put scope, pricing, approvals, timelines, signatures, and payment steps in one client-ready link before a project starts.

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

function buildFollowupEmail(target) {
  const link = partnerLink(target.refCode);
  const text = `Hi ${target.name},

Just wanted to follow up once on MicroFreelanceHub.

It helps freelancers avoid messy project starts by putting scope, pricing, approvals, timelines, signatures, and payment steps in one client-ready link before work begins.

If it feels useful for your audience, I can keep your partner link active here:
${link}

No worries if it is not a fit. I will not keep following up.

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
    subject: 'Quick follow-up on MicroFreelanceHub',
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

if (testTo) {
  const testTarget = {
    name: 'Joshua',
    email: testTo,
    audience: 'freelancers and solo service providers',
    refCode: 'test-joshua',
    personalNote: 'This is a test of the MicroFreelanceHub partner outreach email.',
  };
  const payload = buildInitialEmail(testTarget);

  if (!isSendMode) {
    console.log(payload.text);
    shouldRunTargetList = false;
  } else {
    const result = await sendEmail(payload);
    console.log(`TEST SENT ${testTo}: ${result.id}`);
    shouldRunTargetList = false;
  }
}

const targets = shouldRunTargetList ? loadTargets() : [];
let changed = false;
let processed = 0;
const now = Date.now();
const followupDelayMs = followupDelayDays * 24 * 60 * 60 * 1000;

for (const target of targets) {
  if (processed >= sendLimit) {
    break;
  }
  if (!target.email) {
    console.log(`SKIP ${target.name}: missing email`);
    continue;
  }
  if (!target.approved) {
    console.log(`SKIP ${target.name}: not approved`);
    continue;
  }

  if (isFollowupMode) {
    if (!target.sentAt) {
      console.log(`SKIP ${target.name}: no initial email sent`);
      continue;
    }
    if (target.followupSentAt) {
      console.log(`SKIP ${target.name}: follow-up already sent at ${target.followupSentAt}`);
      continue;
    }
    if (now - Date.parse(target.sentAt) < followupDelayMs) {
      console.log(`SKIP ${target.name}: follow-up delay has not passed`);
      continue;
    }
  } else if (target.sentAt) {
    console.log(`SKIP ${target.name}: already sent at ${target.sentAt}`);
    continue;
  }

  const payload = isFollowupMode ? buildFollowupEmail(target) : buildInitialEmail(target);

  if (!isSendMode) {
    console.log(`\n--- PREVIEW: ${target.name} <${target.email}> ---`);
    console.log(payload.text);
    processed += 1;
    continue;
  }

  const result = await sendEmail(payload);
  if (isFollowupMode) {
    target.followupSentAt = new Date().toISOString();
    target.followupResendId = result.id;
    console.log(`FOLLOW-UP SENT ${target.name}: ${result.id}`);
  } else {
    target.sentAt = new Date().toISOString();
    target.resendId = result.id;
    console.log(`SENT ${target.name}: ${result.id}`);
  }
  changed = true;
  processed += 1;
}

if (changed) {
  saveTargets(targets);
}

if (!isSendMode) {
  const command = isFollowupMode ? 'npm run outreach:followups:send' : 'npm run outreach:send';
  console.log(`\nPreview only. Run ${command} after Joshua approves targets and copy.`);
}
