# Pricing decision and authenticated HoneyBook inspection

Joshua approved a maximum $20/month SMS budget and requested subscription pricing $5 below HoneyBook. New list prices are higher than MFH's previous $9/$29/$79; this was explicitly communicated before implementation. No existing subscription migration is authorized or performed.

## Standard USD pricing, verified November 23, 2026

Sources: https://www.honeybook.com/pricing and https://www.honeybook.com/pricing.md. The main page currently advertises temporary sale pricing; this release benchmarks standard list rates, not promotions. Matching tier position is a pricing mapping, not a feature-equivalence claim.

| MFH plan | HoneyBook benchmark | HB monthly | MFH monthly | HB annual monthly-equivalent | MFH annual monthly-equivalent | MFH annual total |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Starter | Starter | $36 | $31 | $29 | $24 | $288 |
| Professional | Essentials | $59 | $54 | $49 | $44 | $528 |
| Agency | Premium | $129 | $124 | $109 | $104 | $1,248 |

Free remains free. Payment-processing fees are unchanged. Existing subscriptions keep their current prices. No claim that this pricing alone will improve conversion. Our smaller capability set remains a significant conversion disadvantage; improve the workflow rather than claiming feature parity.

## Checkout controls

One shared price catalog drives marketing, pricing, upgrade prompts, checkout review and server amount construction. An explicit review screen displays the amount and interval before opening Stripe. Annual cadence survives email/OAuth sign-in. Old clients without the current price version fail closed and must refresh. Active/trialing/past-due/incomplete subscriptions are directed to Settings rather than receiving a second checkout through this endpoint. No paid charges or live test subscriptions are created for QA.

## What was actually inspected in HoneyBook

The authorized managed-browser tab exposed the signed-in Calendar on November 23. Screenshot visually inspected. Observed month layout, timezone display, external-calendar connection action, filters for booked projects, meetings, payments, tentative and archived projects, and separate Calendar / Booked sessions / Session types tabs. Session types showed a reusable 30-minute consultation with location, timezone, active status, copy-booking-link and preview actions.

Opening the existing consultation editor led to repeated page-control timeouts. Doctor confirmed transport connectivity, but a snapshot retry also timed out. Do not claim the editor, automation builder, or document/payment editors were audited. No sessions, records, integrations, payments or messages were created or changed; only the navigation tour was dismissed.

## SMS authorization and remaining dependency

$20 is the total monthly ceiling, including provider/number/registration/usage fees and applicable taxes, not a per-customer allowance. No SMS spend or provider enrollment occurred. No Twilio/SMS tool integration was available. Reminder and marketing opt-ins remain separate; storing a phone number is not consent. Start with a small reminder pilot once a provider is configured; marketing requires a separate explicit recipient review.

Twilio is a candidate, not a selected or purchased provider. Official documentation confirms US application-to-person 10DLC registration is required, including sender identity and campaign costs. A platform sending on behalf of customer businesses must also determine the correct per-business registration model. Do not assume one $20 account budget supports unlimited tenant marketing or that Twilio budget alerts are hard spending caps.

Before spending: establish the provider account and sender verification, obtain exact all-in fees within the approved cap, then implement durable consent/suppression, outbox idempotency, cancellation/reschedule checks, provider webhooks, and a genuinely enforced budget guard as described in CALENDAR_AND_SMS.md. SMS remains unimplemented and disabled.
