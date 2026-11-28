begin;
-- Service-only reconciliation state. No raw provider payloads or contact data.
create sequence public.mfh_subscription_observation;
revoke all on sequence public.mfh_subscription_observation from public,anon,authenticated;
create table public.mfh_subscription_state (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 subscription_id text not null,
 status text not null,
 plan text not null,
 observation bigint not null,
 updated_at timestamptz not null default now()
);
create table public.mfh_subscription_events (
 event_id text primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 subscription_id text not null,
 event_type text not null,
 applied boolean not null,
 recorded_at timestamptz not null default now()
);
create table public.mfh_subscription_invoices (
 invoice_id text primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 subscription_id text not null,
 amount_paid bigint not null check(amount_paid>=0),
 currency text not null check(currency ~ '^[a-z]{3}$'),
 paid_at timestamptz not null,
 recorded_at timestamptz not null default now()
);
alter table public.mfh_subscription_state enable row level security;
alter table public.mfh_subscription_state force row level security;
alter table public.mfh_subscription_events enable row level security;
alter table public.mfh_subscription_events force row level security;
alter table public.mfh_subscription_invoices enable row level security;
alter table public.mfh_subscription_invoices force row level security;
revoke all on public.mfh_subscription_state,public.mfh_subscription_events,public.mfh_subscription_invoices from public,anon,authenticated;
grant select on public.mfh_subscription_state,public.mfh_subscription_events,public.mfh_subscription_invoices to service_role;

create function public.mfh_subscription_ticket() returns bigint
language sql security definer set search_path=pg_catalog,public
as $$select nextval('public.mfh_subscription_observation');$$;
revoke all on function public.mfh_subscription_ticket() from public,anon,authenticated;
grant execute on function public.mfh_subscription_ticket() to service_role;

create function public.apply_mfh_subscription_event(
 p_owner uuid,p_customer text,p_subscription text,p_expected_subscription text,
 p_ticket bigint,p_event text,p_type text,p_status text,p_plan text,p_apply_state boolean,p_grant_access boolean,
 p_invoice text default null,p_paid_at timestamptz default null,p_amount bigint default null,p_currency text default null
) returns text language plpgsql security definer set search_path=pg_catalog,public as $$
declare current_profile public.profiles; previous_observation bigint; apply_state boolean; old_invoice public.mfh_subscription_invoices;
begin
 if p_owner is null or p_customer is null or p_subscription is null or p_event is null or p_type is null or p_status is null or p_plan is null or p_apply_state is null or p_grant_access is null or p_customer !~ '^cus_[a-zA-Z0-9]+$' or p_subscription !~ '^sub_[a-zA-Z0-9]+$'
 or p_event !~ '^evt_[a-zA-Z0-9]+$' or p_ticket is null or p_ticket<=0
 or p_status not in ('active','trialing','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')
 or p_plan not in ('starter','pro','agency','legacy')
 or p_type not in ('checkout.session.completed','checkout.session.async_payment_succeeded','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed') then
  raise exception 'Invalid subscription reconciliation' using errcode='22023';
 end if;
 select * into current_profile from public.profiles where id=p_owner for update;
 if not found or current_profile.stripe_customer_id is distinct from p_customer then
  raise exception 'Billing owner mismatch' using errcode='42501';
 end if;
 if exists(select 1 from public.mfh_subscription_events where event_id=p_event) then return 'duplicate'; end if;
 select observation into previous_observation from public.mfh_subscription_state where owner_id=p_owner;
 apply_state:=coalesce(p_apply_state,false) and (previous_observation is null or p_ticket>previous_observation);
 if apply_state and current_profile.subscription_id is distinct from p_expected_subscription then
  raise exception 'Billing identity changed; retry reconciliation' using errcode='40001';
 end if;
 if p_invoice is not null then
  if p_invoice !~ '^in_[a-zA-Z0-9]+$' or p_paid_at is null or p_amount is null or p_amount<0 or p_currency is null or p_currency !~ '^[a-z]{3}$' then
   raise exception 'Invalid subscription invoice' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('mfh-invoice:'||p_invoice,0));
  select * into old_invoice from public.mfh_subscription_invoices where invoice_id=p_invoice;
  if found and (old_invoice.owner_id<>p_owner or old_invoice.subscription_id<>p_subscription or old_invoice.amount_paid<>p_amount or old_invoice.currency<>p_currency or old_invoice.paid_at<>p_paid_at) then
   raise exception 'Invoice identity conflict' using errcode='23505';
  end if;
  insert into public.mfh_subscription_invoices(invoice_id,owner_id,subscription_id,amount_paid,currency,paid_at)
  values(p_invoice,p_owner,p_subscription,p_amount,p_currency,p_paid_at) on conflict(invoice_id) do nothing;
 end if;
 if apply_state then
  -- Scheduled cancellation stays active until Stripe reports an ended state.
  -- Pending/failed lookup never downgrades. past_due/trial/paused do not newly grant.
  update public.profiles set subscription_id=p_subscription,
   is_pro=case when p_status='active' and p_grant_access then true when p_status in ('canceled','unpaid','incomplete_expired') then false else is_pro end,
   updated_at=now() where id=p_owner;
  insert into public.mfh_subscription_state(owner_id,subscription_id,status,plan,observation)
  values(p_owner,p_subscription,p_status,p_plan,p_ticket)
  on conflict(owner_id) do update set subscription_id=excluded.subscription_id,status=excluded.status,plan=excluded.plan,observation=excluded.observation,updated_at=now();
 end if;
 insert into public.mfh_subscription_events(event_id,owner_id,subscription_id,event_type,applied)
 values(p_event,p_owner,p_subscription,p_type,apply_state);
 return case when apply_state then 'applied' else 'recorded_without_state_change' end;
end;
$$;
revoke all on function public.apply_mfh_subscription_event(uuid,text,text,text,bigint,text,text,text,text,boolean,boolean,text,timestamptz,bigint,text) from public,anon,authenticated;
grant execute on function public.apply_mfh_subscription_event(uuid,text,text,text,bigint,text,text,text,text,boolean,boolean,text,timestamptz,bigint,text) to service_role;
commit;
