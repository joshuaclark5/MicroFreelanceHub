begin;

alter table public.sow_documents
  add column if not exists payment_received_cents bigint not null default 0;

-- Preserve the recorded paid state of existing agreements; do not charge again.
update public.sow_documents
set payment_received_cents = greatest(0, round(coalesce(price, 0)::numeric * 100)::bigint)
where status = 'Paid' and payment_received_cents = 0;

create table if not exists public.agreement_payment_receipts (
  stripe_session_id text primary key,
  sow_id uuid not null references public.sow_documents(id),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null check (currency = 'usd'),
  recorded_at timestamptz not null default now()
);
alter table public.agreement_payment_receipts enable row level security;
revoke all on public.agreement_payment_receipts from anon, authenticated;

-- Browser clients may edit their own drafts, but cannot forge payment or signatures.
create or replace function public.guard_agreement_verified_fields()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('anon', 'authenticated') then
    if auth.uid() is null or new.user_id is distinct from auth.uid() then
      raise exception 'Agreement owner required';
    end if;
    if tg_op = 'INSERT' then
      if new.payment_received_cents <> 0 or new.signed_by is not null or new.provider_sign is not null
        or coalesce(new.status, 'Draft') <> 'Draft' or new.last_payment_date is not null then
        raise exception 'Verified server action required';
      end if;
    else
      if new.user_id is distinct from old.user_id or new.payment_received_cents is distinct from old.payment_received_cents
        or new.last_payment_date is distinct from old.last_payment_date
        or (new.status is distinct from old.status and new.status <> 'Draft')
        or (new.signed_by is distinct from old.signed_by and new.signed_by is not null)
        or (new.provider_sign is distinct from old.provider_sign and new.provider_sign is not null) then
        raise exception 'Verified server action required';
      end if;
      if (new.signed_by is distinct from old.signed_by or new.provider_sign is distinct from old.provider_sign)
        and new.status <> 'Draft' then raise exception 'Changed agreements require a fresh draft'; end if;
      if (old.signed_by is not null or old.provider_sign is not null) and (
        new.price is distinct from old.price or
        (to_jsonb(new)->'deliverables') is distinct from (to_jsonb(old)->'deliverables') or
        (to_jsonb(new)->'payment_schedule_structured') is distinct from (to_jsonb(old)->'payment_schedule_structured') or
        (to_jsonb(new)->'payment_type') is distinct from (to_jsonb(old)->'payment_type')
      ) and (new.status <> 'Draft' or new.signed_by is not null or new.provider_sign is not null) then
        raise exception 'Changed agreements require new signatures';
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_agreement_verified_fields on public.sow_documents;
create trigger guard_agreement_verified_fields before insert or update on public.sow_documents
for each row execute function public.guard_agreement_verified_fields();

create or replace function public.record_agreement_payment(
  p_sow_id uuid, p_session_id text, p_amount_cents bigint, p_currency text
) returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  agreement public.sow_documents%rowtype;
  receipt public.agreement_payment_receipts%rowtype;
  received bigint;
begin
  if p_amount_cents <= 0 or p_currency <> 'usd' or p_session_id not like 'cs_%' then
    raise exception 'Invalid receipt';
  end if;
  select * into agreement from public.sow_documents where id = p_sow_id for update;
  if not found then raise exception 'Agreement not found'; end if;
  select * into receipt from public.agreement_payment_receipts where stripe_session_id = p_session_id;
  if found then
    if receipt.sow_id <> p_sow_id or receipt.amount_cents <> p_amount_cents then
      raise exception 'Receipt conflict';
    end if;
    return;
  end if;
  insert into public.agreement_payment_receipts (stripe_session_id, sow_id, amount_cents, currency)
    values (p_session_id, p_sow_id, p_amount_cents, p_currency);
  received := agreement.payment_received_cents + p_amount_cents;
  update public.sow_documents set
    payment_received_cents = received,
    status = case when received >= round(agreement.price::numeric * 100)::bigint then 'Paid' else 'Signed' end,
    last_payment_date = now()
  where id = p_sow_id;
end;
$$;
revoke all on function public.record_agreement_payment(uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.record_agreement_payment(uuid, text, bigint, text) to service_role;

commit;
