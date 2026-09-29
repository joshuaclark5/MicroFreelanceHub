-- Read-only operational snapshot. Includes staff/test users; not a GA funnel.
-- Legacy Paid labels are intentionally not counted as verified Stripe receipts.
with confirmed as (
  select id from auth.users where email_confirmed_at is not null or phone_confirmed_at is not null
), documents as (
  select d.* from public.sow_documents d join confirmed c on c.id = d.user_id
)
select jsonb_build_object(
  'confirmed_accounts', (select count(*) from confirmed),
  'owners_with_saved_agreement', (select count(distinct user_id) from documents),
  'owners_with_currently_signed_agreement', (select count(distinct user_id) from documents where signed_by is not null and provider_sign is not null),
  'owners_with_verified_receipt', (select count(distinct d.user_id) from documents d join public.agreement_payment_receipts r on r.sow_id=d.id),
  'verified_receipt_count', (select count(*) from public.agreement_payment_receipts),
  'verified_agreement_volume_usd_cents', (select coalesce(sum(amount_cents),0) from public.agreement_payment_receipts),
  'profiles_with_subscription_reference', (select count(*) from public.profiles where subscription_id is not null),
  'profiles_with_first_touch', (select count(*) from public.profiles where signup_landing_page is not null or lead_source is not null)
) as operational_snapshot;
