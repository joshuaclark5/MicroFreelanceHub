# MicroFreelanceHub Project Context

Last updated: 2026-07-29

## Active Project Folder

Use this folder for the real website work:

`C:\Users\joshu\Downloads\MicroFreelanceHub-GitHubPush\MicroFreelanceHubFrontend`

There is also a smaller folder at `C:\Users\joshu\microfreelancehub`, but it is not the full active project. If a fresh agent lands there, redirect it to the active project folder above.

## Product Scope

MicroFreelanceHub is a Next.js website/app for freelancers and contractors to create client-ready agreements, templates, signatures, and Stripe payment links. It includes:

- profession pages at `/profession/[slug]`
- template pages at `/templates/[slug]`
- agreement creation/editing flows
- dashboard/settings pages
- Stripe checkout/connect/payment integrations
- Supabase data/auth integrations
- SEO articles, metadata, sitemap, and Open Graph previews

## Long-Term Goal

Build a useful, trustworthy freelance agreement and payment workflow platform that helps users clarify scope, pricing, approvals, timelines, signatures, and payment steps without pretending to be a law firm or promising legal outcomes.

## Short-Term Goals

- Keep profession and template pages useful even when database content is sparse or oddly categorized.
- Make the create-agreement path obvious from profession and template pages.
- Remove or soften risky legal/liability marketing language across pages, generated descriptions, tools, SEO metadata, Open Graph text, and schema.
- Preserve intentional legal disclaimers in dedicated disclaimer, Terms, privacy, or lawyer-approved legal pages.
- Keep production builds passing before pushing or reporting completion.

## Recent Important Updates

- `d52e00d` - Fixed blank profession template libraries.
  - The shared dynamic profession route now shows a create-agreement action and fallback template section for all `/profession/[slug]` pages, not just one profession.
- `20e528e` - Softened legal marketing language.
  - Profession cards no longer display raw high-risk `ai_summary` text directly.
  - Profession page SEO/meta and hero copy now uses neutral business-template wording.
  - Template pages use safer meta descriptions and sanitize risky database-driven text before display.
  - Open Graph/link-preview slogans were toned down.
  - The agreement builder's default cancellation/liability clause was softened.
- `2fa8fb6` through `9cadd90` - Added partner outreach pilot.
  - `/partners` explains the approved partner program and referral link format.
  - Referral links using `?ref=` or `?partner=` are captured into existing lead-source tracking.
  - `scripts/outreach-pilot.mjs` sends guarded Resend outreach from public business/contact emails only.
  - `scripts/outreach-targets.json` is intentionally local/ignored so recipient emails and send IDs are not pushed.
  - A daily isolated cron job runs at 9:00 AM America/Denver to find up to 10 new verified contacts and check one-time follow-ups.
  - Outreach copy should lead with the plain-language pain: freelancers do the work, then chase late payments, extra requests, and approvals that were never clearly written down.

## Permanent Copy Rule

Never write or preserve copy that promises legal protection, guaranteed payment, enforceability, liability limits, lawsuit prevention, forced payment, or other legal outcomes.

This rule applies to:

- visible website page text
- forms, buttons, builder/tool text, placeholders, and help text
- generated or database-driven descriptions
- template descriptions
- profession page descriptions
- SEO titles and meta descriptions
- Open Graph and link-preview copy
- schema/structured data
- article CTAs and promotional copy

Use neutral wording like:

- "helps outline scope, pricing, approvals, timelines, and payment details"
- "organizes the terms both sides should review"
- "provides a starting point for a business agreement"
- "supports clearer expectations before work begins"

Allowed legal language should be limited to disclaimer, Terms of Service, privacy, or other lawyer-approved legal pages.

## Sensitive Files

Do not reveal, paste, upload, or expose secrets from:

- `.env.local`
- `service_account.json`
- Supabase service role credentials
- Stripe secret keys
- Google service credentials

## Useful Commands

Run from the active project folder:

```powershell
npm run build
```

Search risky copy:

```powershell
rg -n -i "legal protection|guarantee|guaranteed|force payment|limit liability|prevent lawsuits|legally binding|enforceable|protect yourself legally|legal advice" app
```

Check recent commits:

```powershell
git log --oneline -5
```

Check changed files:

```powershell
git status --short
```

## Crown Files Note

The files currently found on this computer matching "Crown" are:

- `C:\Users\joshu\Downloads\Base_White_Witch_Crown.stl`
- `C:\Users\joshu\Downloads\Full_White_Witch_Crown.stl`

They appear separate from the MicroFreelanceHub website project unless Joshua says otherwise.

## Fresh Session Recovery Prompt

Use the prompt below if a new agent/session starts from scratch.

```text
You are helping me with my MicroFreelanceHub website. Start by going to:

C:\Users\joshu\Downloads\MicroFreelanceHub-GitHubPush\MicroFreelanceHubFrontend

First read these files:

1. AGENTS.md
2. PROJECT_CONTEXT.md
3. package.json

Then run:

git log --oneline -5
git status --short

Important: there is a smaller folder at C:\Users\joshu\microfreelancehub, but the full active project with profession pages, template pages, Supabase, Stripe, SEO files, and the latest commits is the Downloads\MicroFreelanceHub-GitHubPush\MicroFreelanceHubFrontend folder.

The project is a Next.js app for freelancer/client agreement templates, profession pages, signatures, and Stripe payment links. Long term, I want it to be useful and trustworthy without making risky legal promises.

Permanent rule: never write or preserve copy anywhere on the site, tools, generated descriptions, template descriptions, profession pages, metadata, Open Graph/link previews, or schema that promises legal protection, guaranteed payment, enforceability, liability limits, lawsuit prevention, forced payment, or anything similar. Use neutral business-document language about scope, pricing, approvals, timelines, expectations, signatures, and payment steps instead. Legal/disclaimer language belongs only in Terms, privacy, disclaimer, or lawyer-approved legal pages.

Recent important commits:
- d52e00d: fixed blank profession template libraries across the shared /profession/[slug] route.
- 20e528e: softened risky legal marketing language across profession pages, template pages, metadata, previews, and builder copy.

Before claiming any website code change is done, run npm run build. Also search for risky legal copy with rg before shipping copy or metadata changes.

Also note: files on this computer matching Crown are currently in Downloads:
- C:\Users\joshu\Downloads\Base_White_Witch_Crown.stl
- C:\Users\joshu\Downloads\Full_White_Witch_Crown.stl
```
