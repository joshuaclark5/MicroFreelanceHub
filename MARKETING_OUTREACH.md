# MicroFreelanceHub Partner Outreach

## Permanent Outreach Positioning

Lead with the painful freelancer problem in plain language, not tool buzzwords.

Preferred framing:

- A lot of freelancers do the work, then end up chasing late payments, extra requests, and approvals that were never clearly written down.
- MicroFreelanceHub is built for that problem.
- It gives freelancers one client-ready link for scope, pricing, approvals, timelines, signatures, Stripe payment steps, and automated late-payment reminders that can become firmer over time.
- Approved partners can earn 30% recurring commission on referred paid subscriptions while the customer stays subscribed.

Avoid:

- buzzwords like "all-in-one solution," "revolutionary workflow," "seamless platform," or "business operating system"
- claims that the tool guarantees payment, guarantees legal results, or leads to "way more payments"
- saying "lifetime commission"; use "while the customer stays subscribed"
- saying reminders "get aggressive"; use "become firmer over time"

Tone:

- simple, direct, and human
- focused on the real pain of unpaid or unclear client work
- clear that this is an affiliate/partner opportunity, not a vague collaboration
- modest about outcomes and factual about features

## Current Partner Link Format

Use a creator-specific code in links:

```text
https://www.microfreelancehub.com/?ref=creatorname
https://www.microfreelancehub.com/pricing?ref=creatorname
https://www.microfreelancehub.com/templates?ref=creatorname
```

The site stores `?ref=` and `?partner=` as `affiliate:creatorname` in existing lead-source tracking. Stripe checkout metadata also receives the captured lead source when a user upgrades.

## Pilot Send Workflow

Outreach emails should be one-to-one and approved before sending.

1. Copy `scripts/outreach-targets.example.json` to the local-only `scripts/outreach-targets.json`.
2. Add target contacts to `scripts/outreach-targets.json`.
3. Keep `approved` as `false` until Joshua approves the recipient and copy.
4. Preview with:

```powershell
npm run outreach:preview
```

5. Send only after approval:

```powershell
npm run outreach:send
```

The initial send command is capped at 10 sends per run and waits a random 3-7 minutes between recipients. The send script skips any contact where `approved` is not `true`, where `email` is blank, or where `sentAt` is already filled. The real target file is ignored by git so recipient emails and send IDs stay local.

Preview follow-ups:

```powershell
npm run outreach:followups:preview
```

Send follow-ups:

```powershell
npm run outreach:followups:send
```

Follow-ups are capped at 10 sends per run, wait 4 days by default, wait a random 3-7 minutes between recipients, and skip contacts where `followupSentAt` is already filled.

Send a test email to Joshua:

```powershell
npm run outreach:test
```

## Influencer Targets

Prioritize creators who already talk to freelancers, solo operators, contractors, and client-service businesses:

- Freelance designers and Webflow creators
- Freelance developer educators
- Copywriting, marketing, and social media freelancer coaches
- Local-service business coaches
- Bookkeeping, invoicing, and small-business operations creators

## Pilot Candidate Types

Start with 10 small or mid-sized creators, not giant accounts:

- Freelance Webflow or Framer educator
- Freelance web developer newsletter writer
- Freelance designer business coach
- Freelance copywriter coach
- Solo agency operator with an audience
- Small-business bookkeeping creator
- Freelancer YouTube creator focused on client workflow
- Local-service business coach
- Independent creative-operations consultant
- Newsletter writer for consultants or contractors

## Short DM Draft

Hi [Name], I'm building MicroFreelanceHub for freelancers who do the work and then get stuck chasing late payments, extra requests, and approvals that were never clearly written down.

It gives them one client-ready link for scope, pricing, approvals, timelines, signatures, Stripe payment steps, and automated late-payment reminders that can become firmer over time.

Your audience seems like a strong fit because you already help freelancers run smoother client projects. Would you be open to trying it and sharing it if it feels useful? We are testing a partner program with 30% recurring commission on referred paid subscriptions while the customer stays subscribed.

Partner page: https://www.microfreelancehub.com/partners

## Short Post Draft

Freelancers: stop starting client work from scattered messages.

MicroFreelanceHub puts scope, pricing, approvals, signatures, Stripe payment steps, and automated late-payment reminders into one client-ready workflow.

[partner link]

## Outreach Rules

- Do not send messages or public posts without Joshua approving the recipient list and wording first.
- Keep claims factual and modest.
- Do not promise legal protection, guaranteed payment, enforceability, liability limits, lawsuit prevention, or forced payment.
- Only use public business/contact emails, not guessed personal inboxes.
- Limit outreach to 10 new contacts per day until deliverability and reply quality are proven.
- Send batch emails 3-7 minutes apart instead of all at once.
- Send at most one follow-up per contact, usually after 4 days.
- Stop contacting anyone who replies negatively, asks not to be contacted, or bounces.
