# Repeatable configured checkout commands

Set `MFH_ENV_FILE` to the absolute path of the existing private environment file, outside this checkout. Do not copy it into Git or paste values into chat. The launcher prints required names and Stripe mode, never values.

```
node scripts/run-configured.cjs check
node scripts/run-configured.cjs build
node scripts/run-configured.cjs start
```

The explicit file overrides inherited shell variables to avoid mixed credentials. `start` binds only to loopback, default port3087; `PORT` overrides it. Check/build do not create Stripe objects. The Next application can contact services during a build or request; use the existing fixture browser tests for local UI verification.

For Stripe integration tests set `MFH_EXPECT_STRIPE_MODE=test` and use a separate test environment file. A live key is rejected in that mode. Never replace Production Stripe keys with test keys. A successful configuration check establishes presence/format, not provider permissions or webhook delivery.

Production Reply-To is saved in Vercel; it still requires deployment of the supporting code. The seven-day trial flag stays off until the real Stripe test lifecycle and account mapping pass. No settings in this launcher activate a trial or modify production.
