-- Independent synthetic Stripe test resources; never linked to profiles or invoices.
create table public.test_billing_sandboxes (
 owner_id uuid primary key references auth.users(id),
 operation_id uuid not null default gen_random_uuid() unique,
 created_at timestamptz not null default now(),
 customer_id text,
 product_id text,
 subscription_id text,
 status text not null default 'pending',
 constraint test_customer_id check (customer_id is null or customer_id ~ '^cus_[A-Za-z0-9]+$'),
 constraint test_product_id check (product_id is null or product_id ~ '^prod_[A-Za-z0-9]+$'),
 constraint test_subscription_id check (subscription_id is null or subscription_id ~ '^sub_[A-Za-z0-9]+$')
);
alter table public.test_billing_sandboxes enable row level security;
alter table public.test_billing_sandboxes force row level security;
revoke all on public.test_billing_sandboxes from public, anon, authenticated;
grant select, insert, update on public.test_billing_sandboxes to service_role;
comment on table public.test_billing_sandboxes is 'One opt-in synthetic TEST Stripe experiment per owner. Server only. No billing entitlements or invoice effects.';
