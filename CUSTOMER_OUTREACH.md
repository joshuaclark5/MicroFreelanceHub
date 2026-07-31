# MicroFreelanceHub Direct Customer Outreach

## Purpose

Use direct customer outreach as a small validation channel, separate from partner outreach.

Partner outreach asks creators and communities to share MicroFreelanceHub. Customer outreach asks working freelancers whether late payment follow-up and unclear client project terms are still painful enough to try the product.

## Cadence

- Send up to 5 new direct customer emails per day.
- Use only public business/contact emails from real freelancer websites, portfolios, studios, or agency pages.
- Do not use guessed emails, scraped personal inboxes, marketplace private messages, or questionable bulk lists.
- Send batch emails 3-7 minutes apart.
- Send at most 1 follow-up per customer, 3-4 days later, with the same 3-7 minute per-recipient spacing.
- Stop contacting anyone who replies negatively, asks not to be contacted, or bounces.

## Positioning

Keep the email simple and customer-focused:

- "Do late payments or unclear project scope still create problems in your client work?"
- "MicroFreelanceHub puts scope, pricing, approvals, signatures, Stripe payment steps, and automated late-payment reminders in one workflow."
- Ask for a quick look or a reply, not a purchase.

Avoid:

- affiliate/commission language
- legal claims or payment guarantees
- buzzwords
- promises that the tool will make them get paid

## Workflow

The real target file is local-only and ignored by git:

```powershell
scripts/customer-outreach-targets.json
```

Use the example file as a template:

```powershell
scripts/customer-outreach-targets.example.json
```

Preview new outreach:

```powershell
npm run customer-outreach:preview
```

Send new outreach:

```powershell
npm run customer-outreach:send
```

Preview follow-ups:

```powershell
npm run customer-outreach:followups:preview
```

Send follow-ups:

```powershell
npm run customer-outreach:followups:send
```

Send a test email to Joshua:

```powershell
npm run customer-outreach:test
```
