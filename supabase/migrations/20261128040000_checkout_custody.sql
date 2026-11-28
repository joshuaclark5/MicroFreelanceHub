begin;
create table public.mfh_checkout_attempts (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 operation_id uuid not null unique default gen_random_uuid(),
 request jsonb not null check(jsonb_typeof(request)='object'),
 customer_id text,
 session_id text unique,
 created_at timestamptz not null default now()
);
alter table public.mfh_checkout_attempts enable row level security;
alter table public.mfh_checkout_attempts force row level security;
revoke all on public.mfh_checkout_attempts from public,anon,authenticated;
grant select on public.mfh_checkout_attempts to service_role;

-- Service callers alone validate the authenticated actor and provider expiry.
-- The profile row serializes first creation as well as compare-and-swap rotation.
create function public.mfh_checkout_attempt(p_owner uuid,p_request jsonb,p_expired_operation uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare a public.mfh_checkout_attempts; customer text;
begin
 if p_request is null or jsonb_typeof(p_request)<>'object' or pg_column_size(p_request)>16384 then raise exception 'Invalid checkout request'; end if;
 insert into public.profiles(id) values(p_owner) on conflict(id) do nothing;
 select stripe_customer_id into customer from public.profiles where id=p_owner for update;
 select * into a from public.mfh_checkout_attempts where owner_id=p_owner for update;
 if found and p_expired_operation is not null and a.operation_id=p_expired_operation and a.session_id is not null then
  delete from public.mfh_checkout_attempts where owner_id=p_owner;
  a:=null;
 end if;
 if a.operation_id is null then
  insert into public.mfh_checkout_attempts(owner_id,request,customer_id) values(p_owner,p_request,customer) returning * into a;
 end if;
 if a.customer_id is distinct from customer then raise exception 'Checkout customer binding changed'; end if;
 return to_jsonb(a)||jsonb_build_object('matches',a.request=p_request);
end $$;

create function public.mfh_checkout_record(p_owner uuid,p_operation uuid,p_customer text,p_session text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare a public.mfh_checkout_attempts; customer text;
begin
 select stripe_customer_id into customer from public.profiles where id=p_owner for update;
 if not found then raise exception 'Checkout owner unavailable'; end if;
 select * into a from public.mfh_checkout_attempts where owner_id=p_owner for update;
 if not found or a.operation_id<>p_operation then raise exception 'Stale checkout operation'; end if;
 if p_customer is null or p_customer !~ '^cus_[A-Za-z0-9]+$' then raise exception 'Invalid checkout customer'; end if;
 if (customer is not null and customer<>p_customer) or (a.customer_id is not null and a.customer_id<>p_customer) then raise exception 'Checkout customer mismatch'; end if;
 if p_session is not null and (p_session !~ '^cs_[A-Za-z0-9_]+$' or (a.session_id is not null and a.session_id<>p_session)) then raise exception 'Checkout session mismatch'; end if;
 update public.profiles set stripe_customer_id=p_customer where id=p_owner and stripe_customer_id is null;
 update public.mfh_checkout_attempts set customer_id=p_customer,session_id=coalesce(session_id,p_session) where owner_id=p_owner returning * into a;
 return to_jsonb(a);
end $$;
revoke all on function public.mfh_checkout_attempt(uuid,jsonb,uuid), public.mfh_checkout_record(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.mfh_checkout_attempt(uuid,jsonb,uuid), public.mfh_checkout_record(uuid,uuid,text,text) to service_role;
commit;
