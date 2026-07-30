# MicroFreelanceHub Partner Outreach

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

The send script skips any contact where `approved` is not `true`, where `email` is blank, or where `sentAt` is already filled. The real target file is ignored by git so recipient emails and send IDs stay local.

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

Hi [Name], I'm building MicroFreelanceHub, a simple tool for freelancers to outline scope, pricing, approvals, timelines, signatures, and payment steps before a client project starts.

Your audience seems like a strong fit because you already help freelancers run smoother client projects. Would you be open to trying it and sharing it if it feels useful? I can set up a partner link for you so signups and paid plans from your audience are tracked.

Partner page: https://www.microfreelancehub.com/partners

## Short Post Draft

Freelancers: before you start a client project, put the basics in one place: scope, timeline, approvals, pricing, signatures, and payment steps.

MicroFreelanceHub gives you templates and a simple agreement builder so the project starts with clearer expectations.

[partner link]

## Outreach Rules

- Do not send messages or public posts without Joshua approving the recipient list and wording first.
- Keep claims factual and modest.
- Do not promise legal protection, guaranteed payment, enforceability, liability limits, lawsuit prevention, or forced payment.
