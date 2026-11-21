/**
 * Refuse live Stripe credentials outside Vercel Production. This is a second
 * containment layer: Preview/Development must use a Stripe test key even if a
 * live secret is accidentally inherited from an all-environments setting.
 */
export function getStripeSecretKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured.');
  if (env.VERCEL_ENV !== 'production' && !key.startsWith('sk_test_') && !key.startsWith('rk_test_')) {
    throw new Error('Live Stripe credentials are unavailable outside Production.');
  }
  return key;
}
