# Curly Hair Guide - Project Brain

## Project Overview
A Next.js 14 diagnostic tool for curly hair.
- **Goal:** Lead generation for hair care protocols.
- **Stack:** Next.js (App Router), Tailwind CSS, Supabase.

## Critical Technical Paths (The "Source of Truth")
- **Root Directory:** `./`
- **Supabase Client:** Located at `./supabaseClient.ts`
- **Components:** Located at `./app/components/`
- **Data Store:** `./app/components/data/hair-data.json`

## Import Logic (Relative Paths)
Because `@/` aliases are currently unsupported in this environment, use the following:
- **Inside app/quiz/page.tsx:** `import QuizComponent from './../components/QuizComponent';`
- **Inside app/routine/[slug]/page.tsx:** `import EmailCapture from './../../components/EmailCapture';`
- **Inside app/components/EmailCapture.tsx:** `import { supabase } from './../../supabaseClient';`

## Database Schema (Supabase)
**Table Name:** `hair_leads`
- `id`: uuid (primary key)
- `created_at`: timestamp
- `email`: text
- `hair_profile`: text (slug format: type-porosity)

## Deployment Checklist
- [ ] Connect Domain
- [ ] Add `og-image.jpg` to `/public`
- [ ] Run SEO Sitemap Generator
- [ ] Verify Supabase `anon` keys in `.env.local`