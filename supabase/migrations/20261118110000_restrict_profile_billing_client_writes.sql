-- Keep profile billing and Stripe Connect fields server-owned.
-- User-owned profile edits remain limited to the fields used by onboarding/settings.
BEGIN;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT
  (id, email, is_pro, stripe_account_id, company_name, full_name,
   has_completed_onboarding, stripe_customer_id, subscription_id,
   created_at, updated_at, signup_landing_page, lead_source)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE
  (is_pro, stripe_account_id, stripe_customer_id, subscription_id)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

GRANT UPDATE (full_name, company_name, has_completed_onboarding)
  ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;

COMMIT;
