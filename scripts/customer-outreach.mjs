import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const targetsPath = path.join(process.cwd(), 'scripts', 'customer-outreach-targets.json');
const exampleTargetsPath = path.join(process.cwd(), 'scripts', 'customer-outreach-targets.example.json');
const isSendMode = process.argv.includes('--send');
const isFollowupMode = process.argv.includes('--followups');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const testToArg = process.argv.find((arg) => arg.startsWith('--test-to='));
const staggerMinArg = process.argv.find((arg) => arg.startsWith('--stagger-min='));
const staggerMaxArg = process.argv.find((arg) => arg.startsWith('--stagger-max='));
const sendLimit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : Number.POSITIVE_INFINITY;
const testTo = testToArg ? testToArg.split('=')[1]?.trim() : '';
const staggerMinMinutes = staggerMinArg ? Number.parseFloat(staggerMinArg.split('=')[1]) : 0;
const staggerMaxMinutes = staggerMaxArg ? Number.parseFloat(staggerMaxArg.split('=')[1]) : staggerMinMinutes;
const resendApiKey = process.env.RESEND_API_KEY;
const followupMinDays = Number.parseFloat(process.env.CUSTOMER_OUTREACH_FOLLOWUP_MIN_DAYS || '3');
const followupMaxDays = Number.parseFloat(process.env.CUSTOMER_OUTREACH_FOLLOWUP_MAX_DAYS || '4');
const maxFollowupAttempts = 1;
let shouldRunTargetList = true;

function loadTargets() {
  const filePath = fs.existsSync(targetsPath) ? targetsPath : exampleTargetsPath;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveTargets(targets) {
  fs.writeFileSync(targetsPath, `${JSON.stringify(targets, null, 2)}\n`);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomStaggerMs() {
  if (!Number.isFinite(staggerMinMinutes) || !Number.isFinite(staggerMaxMinutes)) {
    return 0;
  }
  const min = Math.max(0, Math.min(staggerMinMinutes, staggerMaxMinutes));
  const max = Math.max(min, Math.max(staggerMinMinutes, staggerMaxMinutes));
  if (max <= 0) {
    return 0;
  }
  return Math.round((min + Math.random() * (max - min)) * 60 * 1000);
}

function randomFollowupDelayMs() {
  const min = Math.max(0, Math.min(followupMinDays, followupMaxDays));
  const max = Math.max(min, Math.max(followupMinDays, followupMaxDays));
  return Math.round((min + Math.random() * (max - min)) * 24 * 60 * 60 * 1000);
}

function getFollowups(target) {
  return Array.isArray(target.followups) ? target.followups : [];
}

function scheduleNextFollowup(target, baseDate) {
  if (getFollowups(target).length >= maxFollowupAttempts) {
    delete target.nextFollowupAfter;
    return;
  }
  target.nextFollowupAfter = new Date(baseDate.getTime() + randomFollowupDelayMs()).toISOString();
}

function buildInitialEmail(target) {
  const note = target.personalNote?.trim() ? `${target.personalNote.trim()}\n\n` : '';
  const businessType = target.businessType || 'freelancer';

  const text = `Hi ${target.name},

${note}Quick question: do late payments, unclear scope, or approval back-and-forth still create problems in your client work?

I am building MicroFreelanceHub for freelancers who want one place to put scope, pricing, approvals, signatures, Stripe payment steps, and automated late-payment reminders.

It is especially meant for ${businessType}s who work directly with clients.

Would you be open to taking a quick look and telling me if this would actually help your workflow?

https://www.microfreelancehub.com/create?source=customer-outreach

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
    subject: 'Quick question about freelance client work',
    text,
    html,
  };
}

function buildFollowupEmail(target) {
  const text = `Hi ${target.name},

Just wanted to follow up once.

I am trying to learn whether late payments, unclear scope, and approval back-and-forth are still real problems for freelancers working directly with clients.

MicroFreelanceHub puts scope, pricing, approvals, signatures, Stripe payment steps, and automated late-payment reminders in one workflow.

If you have a minute, I would appreciate a quick reply on whether that sounds useful or not.

https://www.microfreelancehub.com/create?source=customer-outreach-followup

No worries if not. I will not keep following up.

Joshua`;

  const html = text
    .split('\n\n')
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n');

  return {
    from: 'MicroFreelanceHub <support@microfreelancehub.com>',
    to: [target.email],
    reply_to: ['joshuastevenclark@gmail.com'],
    subject: 'Following up once',
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
    businessType: 'freelancer',
    personalNote: 'This is a test of the MicroFreelanceHub direct customer outreach email.',
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
    const followups = getFollowups(target);
    if (followups.length >= maxFollowupAttempts) {
      console.log(`SKIP ${target.name}: max follow-up attempts reached`);
      continue;
    }
    if (!target.nextFollowupAfter) {
      if (isSendMode) {
        scheduleNextFollowup(target, new Date(target.sentAt));
        changed = true;
      }
      console.log(`SKIP ${target.name}: next follow-up date is not set yet`);
      continue;
    }
    if (now < Date.parse(target.nextFollowupAfter)) {
      console.log(`SKIP ${target.name}: next follow-up is scheduled for ${target.nextFollowupAfter}`);
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

  if (processed > 0) {
    const waitMs = randomStaggerMs();
    if (waitMs > 0) {
      const waitMinutes = Math.round((waitMs / 60_000) * 10) / 10;
      console.log(`WAIT ${waitMinutes} minutes before next send`);
      await sleep(waitMs);
    }
  }

  const result = await sendEmail(payload);
  if (isFollowupMode) {
    const sentAt = new Date();
    target.followups = getFollowups(target);
    target.followups.push({ sentAt: sentAt.toISOString(), resendId: result.id });
    scheduleNextFollowup(target, sentAt);
    console.log(`FOLLOW-UP SENT ${target.name}: ${result.id}`);
  } else {
    const sentAt = new Date();
    target.sentAt = sentAt.toISOString();
    target.resendId = result.id;
    scheduleNextFollowup(target, sentAt);
    console.log(`SENT ${target.name}: ${result.id}`);
  }
  changed = true;
  processed += 1;
}

if (changed) {
  saveTargets(targets);
}

if (!isSendMode) {
  const command = isFollowupMode ? 'npm run customer-outreach:followups:send' : 'npm run customer-outreach:send';
  console.log(`\nPreview only. Run ${command} after Joshua approves targets and copy.`);
}
