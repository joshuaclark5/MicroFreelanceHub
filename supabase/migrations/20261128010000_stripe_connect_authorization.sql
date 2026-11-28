-- One-time authenticated Stripe Connect attempts. No provider tokens stored.
begin;
-- Ownership RLS alone must not let a browser replace payout/subscription identities.
create function public.guard_profile_financial_fields()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if current_user in ('anon','authenticated') then
  if tg_op='INSERT' then
   if coalesce(new.is_pro,false) or new.stripe_account_id is not null or new.stripe_customer_id is not null or new.subscription_id is not null then
    raise exception 'Verified billing action required' using errcode='42501';
   end if;
  elsif new.id is distinct from old.id or new.is_pro is distinct from old.is_pro or new.stripe_account_id is distinct from old.stripe_account_id or new.stripe_customer_id is distinct from old.stripe_customer_id or new.subscription_id is distinct from old.subscription_id then
   raise exception 'Verified billing action required' using errcode='42501';
  end if;
 end if;
 return new;
end;
$$;
create trigger guard_profile_financial_fields before insert or update on public.profiles for each row execute function public.guard_profile_financial_fields();
create table public.stripe_connect_attempts (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 state_hash text not null unique check (state_hash ~ '^[a-f0-9]{64}$'),
 origin text not null,
 expires_at timestamptz not null,
 consumed_at timestamptz,
 completed_at timestamptz
);
alter table public.stripe_connect_attempts enable row level security;
alter table public.stripe_connect_attempts force row level security;
revoke all on public.stripe_connect_attempts from public,anon,authenticated;
create function public.stripe_connect_authorization(p_action text,p_actor uuid,p_hash text,p_origin text,p_account text default null)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare attempt public.stripe_connect_attempts; linked text;
begin
 if p_actor is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_origin is null or p_origin !~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$' then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended('stripe-connect:'||p_actor::text,0));
 select stripe_account_id into linked from public.profiles where id=p_actor for update;
 if not found or nullif(linked,'') is not null then return false; end if;
 if p_action='begin' then
  insert into public.stripe_connect_attempts(owner_id,state_hash,origin,expires_at)
  values(p_actor,p_hash,p_origin,clock_timestamp()+interval '10 minutes')
  on conflict(owner_id) do update set state_hash=excluded.state_hash,origin=excluded.origin,expires_at=excluded.expires_at,consumed_at=null,completed_at=null;
  return true;
 end if;
 select * into attempt from public.stripe_connect_attempts where owner_id=p_actor for update;
 if not found or attempt.state_hash<>p_hash or attempt.origin<>p_origin or attempt.expires_at<=clock_timestamp() or attempt.completed_at is not null then return false; end if;
 if p_action='consume' then
  if attempt.consumed_at is not null then return false; end if;
  update public.stripe_connect_attempts set consumed_at=clock_timestamp() where owner_id=p_actor;
  return true;
 elsif p_action='complete' then
  if attempt.consumed_at is null or p_account is null or p_account !~ '^acct_[a-zA-Z0-9]+$' then return false; end if;
  update public.profiles set stripe_account_id=p_account where id=p_actor and nullif(stripe_account_id,'') is null;
  if not found then return false; end if;
  update public.stripe_connect_attempts set completed_at=clock_timestamp() where owner_id=p_actor;
  return true;
 end if;
 return false;
end;
$$;
revoke all on function public.stripe_connect_authorization(text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.stripe_connect_authorization(text,uuid,text,text,text) to service_role;
commit;
