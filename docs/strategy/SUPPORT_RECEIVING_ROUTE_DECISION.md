# Support receiving-route decision — 2026-11-25

## Verified observations
- Existing hosted email plan is Free; mailbox list contains admin@microfreelancehub.com, with historical received messages.
- Support mailbox/alias and current delivery have not been verified. No test email sent.
- Root user has blank primary email; that alone is NOT evidence of a configuration fault. Provider separates root and ordinary users.

## Official constraints (fetched 2026-11-25)
- https://www.dynadot.com/help/question/create-email-user : free plan one ordinary user excluding root, one email address; Pro up to 25. Personal email cannot be modified after setting.
- https://www.dynadot.com/help/question/turn-on-catch-all : hosted catch-all is Pro-only, disabled by default.
- https://www.dynadot.com/help/question/email-forwarding : free domain forwarding exists, but enabling it disconnects existing Dynadot Email Hosting; verification email required. Do not use as a drop-in alias fix.

## Proposed no-new-cost path
Use the existing admin@microfreelancehub.com inbox for support/deletion requests only after Joshua confirms it is the inbox he will monitor and approves it as the public contact. Then align the native request/fallback copy, public privacy/request resource and Play listing; verify current receiving path and request handling without destructive customer deletion tests. Existing hosted mail and records remain intact. Do not claim historical incoming mail proves current delivery or deletion fulfillment.

Alternative: a paid email-plan upgrade to retain admin and add support; requires separate spending authorization. Do not rename/delete the existing mailbox, reset the root account or switch domain forwarding automatically.

No DNS/mailbox/user/billing/settings mutations made. Android0.1.6 packages remain tested but unpublished; website calendar PR38 remains separately blocked by Vercel403.
