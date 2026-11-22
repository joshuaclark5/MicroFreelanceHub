-- Private solo-owner connector. Credentials never granted to browser roles.
begin;
create table public.workspace_calendar_connections (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 generation bigint not null default 1,
 status text not null default 'connecting' check(status in ('connecting','connected','reconnect','disconnected')),
 calendar_id text not null default 'primary' check(calendar_id='primary'),
 token_cipher text, token_version bigint not null default 0,
 lease_id uuid, lease_until timestamptz, refresh_inflight boolean not null default false,
 retry_at timestamptz, last_error text,
 synced_at timestamptz, window_start timestamptz, window_end timestamptz,
 revocation_pending boolean not null default false,
 updated_at timestamptz not null default clock_timestamp()
);
create table public.workspace_calendar_oauth (
 owner_id uuid primary key references public.workspace_calendar_connections(owner_id) on delete cascade,
 state_hash text not null unique check(state_hash ~ '^[a-f0-9]{64}$'),
 verifier_cipher text not null, origin text not null, generation bigint not null,
 expires_at timestamptz not null
);
create table public.workspace_calendar_busy (
 owner_id uuid not null references public.workspace_calendar_connections(owner_id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null, check(ends_at>starts_at),
 primary key(owner_id,starts_at,ends_at)
);
do $$ declare t text; begin foreach t in array array['connections','oauth','busy'] loop
 execute format('alter table public.workspace_calendar_%I enable row level security',t);
 execute format('alter table public.workspace_calendar_%I force row level security',t);
 execute format('revoke all on public.workspace_calendar_%I from public,anon,authenticated',t);
end loop; end $$;
-- Only the service role may mutate custody. This RPC is not granted to signed-in clients.
create function public.calendar_service(action text, actor uuid, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.workspace_calendar_connections; o public.workspace_calendar_oauth; b jsonb; lo timestamptz; hi timestamptz;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then raise exception 'Unauthorized' using errcode='42501'; end if;
 -- Same lock also used by booking guard; covers absent connection and first connect.
 perform pg_advisory_xact_lock(hashtextextended('calendar:'||actor::text,0));
 select * into c from public.workspace_calendar_connections where owner_id=actor for update;
 if action='begin' then
  if c.owner_id is not null and c.status<>'disconnected' then raise exception 'Disconnect before reconnecting' using errcode='40001'; end if;
  insert into public.workspace_calendar_connections(owner_id) values(actor) on conflict(owner_id) do update set generation=workspace_calendar_connections.generation+1,status='connecting',last_error=null,updated_at=clock_timestamp();
  select * into c from public.workspace_calendar_connections where owner_id=actor;
  if payload->>'stateHash' !~ '^[a-f0-9]{64}$' or length(payload->>'verifierCipher') not between 20 and 2000 or length(payload->>'origin') not between 8 and 2048 then raise exception 'Invalid state' using errcode='22023'; end if;
  insert into public.workspace_calendar_oauth values(actor,payload->>'stateHash',payload->>'verifierCipher',payload->>'origin',c.generation,clock_timestamp()+interval '10 minutes') on conflict(owner_id) do update set state_hash=excluded.state_hash,verifier_cipher=excluded.verifier_cipher,origin=excluded.origin,generation=excluded.generation,expires_at=excluded.expires_at;
  return jsonb_build_object('generation',c.generation);
 elsif action='consume' then
  delete from public.workspace_calendar_oauth where owner_id=actor and state_hash=payload->>'stateHash' and origin=payload->>'origin' and expires_at>clock_timestamp() and generation=c.generation returning * into o;
  if o.owner_id is null or c.status<>'connecting' then raise exception 'State unavailable' using errcode='40001'; end if;
  return jsonb_build_object('generation',o.generation,'verifierCipher',o.verifier_cipher);
 elsif action='disconnect' then
  delete from public.workspace_calendar_oauth where owner_id=actor;
  delete from public.workspace_calendar_busy where owner_id=actor;
  update public.workspace_calendar_connections set generation=generation+1,status='disconnected',token_cipher=null,token_version=token_version+1,lease_id=null,lease_until=null,refresh_inflight=false,synced_at=null,window_start=null,window_end=null,retry_at=null,last_error=null,revocation_pending=true,updated_at=clock_timestamp() where owner_id=actor;
  return jsonb_build_object('disconnected',true,'revocationPending',c.owner_id is not null);
 end if;
 if c.owner_id is null or c.generation is distinct from (payload->>'generation')::bigint or c.status='disconnected' then raise exception 'Connection changed' using errcode='40001'; end if;
 if action='connect' then
  if c.status<>'connecting' or exists(select 1 from public.workspace_calendar_oauth where owner_id=actor) then raise exception 'State not consumed' using errcode='40001'; end if;
  if coalesce(length(payload->>'tokenCipher'),0) not between 20 and 32768 then raise exception 'Invalid custody' using errcode='22023'; end if;
  update public.workspace_calendar_connections set token_cipher=payload->>'tokenCipher',token_version=token_version+1,status='connected',updated_at=clock_timestamp() where owner_id=actor;
 elsif action='claim' then
  if (payload->>'leaseId') is null then raise exception 'Lease required' using errcode='22023'; end if;
  if c.status<>'connected' or c.retry_at>clock_timestamp() or c.lease_until>clock_timestamp() then return jsonb_build_object('claimed',false); end if;
  -- An expired refresh lease may have rotated upstream. Never blindly repeat it.
  if c.refresh_inflight then
   update public.workspace_calendar_connections set status='reconnect',token_cipher=null,synced_at=null,last_error='refresh_uncertain',lease_id=null,lease_until=null,refresh_inflight=false where owner_id=actor;
   return jsonb_build_object('claimed',false);
  end if;
  update public.workspace_calendar_connections set lease_id=(payload->>'leaseId')::uuid,lease_until=clock_timestamp()+interval '90 seconds',refresh_inflight=false where owner_id=actor;
  return jsonb_build_object('claimed',true,'tokenCipher',c.token_cipher,'tokenVersion',c.token_version);
 else
  if c.lease_id is null or c.lease_until is null or c.lease_id is distinct from (payload->>'leaseId')::uuid or c.lease_until<=clock_timestamp() or c.token_version is distinct from (payload->>'tokenVersion')::bigint then raise exception 'Lease changed' using errcode='40001'; end if;
  if action='refresh_start' then
   if c.refresh_inflight then raise exception 'Refresh already started' using errcode='40001'; end if;
   update public.workspace_calendar_connections set refresh_inflight=true where owner_id=actor;
  elsif action='tokens' then
   if not c.refresh_inflight or coalesce(length(payload->>'tokenCipher'),0) not between 20 and 32768 then raise exception 'Invalid rotation' using errcode='40001'; end if;
   update public.workspace_calendar_connections set token_cipher=payload->>'tokenCipher',token_version=token_version+1,refresh_inflight=false where owner_id=actor;
   return jsonb_build_object('tokenVersion',c.token_version+1);
  elsif action='snapshot' then
   if c.refresh_inflight then raise exception 'Uncommitted rotation' using errcode='40001'; end if;
   lo:=(payload->>'start')::timestamptz; hi:=(payload->>'end')::timestamptz;
   if lo is null or hi is null or hi<=lo or hi-lo>interval '31 days' or lo<clock_timestamp()-interval '2 minutes' or lo>clock_timestamp()+interval '1 minute' or jsonb_typeof(payload->'busy') is distinct from 'array' or jsonb_array_length(payload->'busy')>2000 then raise exception 'Invalid snapshot' using errcode='22023'; end if;
   delete from public.workspace_calendar_busy where owner_id=actor;
   for b in select value from jsonb_array_elements(payload->'busy') loop
    if (b->>'start')::timestamptz<lo or (b->>'end')::timestamptz>hi or (b->>'end')::timestamptz<=(b->>'start')::timestamptz then raise exception 'Invalid busy interval' using errcode='22023'; end if;
    insert into public.workspace_calendar_busy values(actor,(b->>'start')::timestamptz,(b->>'end')::timestamptz) on conflict do nothing;
   end loop;
   update public.workspace_calendar_connections set synced_at=clock_timestamp(),window_start=lo,window_end=hi,last_error=null,retry_at=clock_timestamp()+interval '30 seconds',lease_id=null,lease_until=null,updated_at=clock_timestamp() where owner_id=actor;
  elsif action='fail' then
   update public.workspace_calendar_connections set status=case when refresh_inflight or payload->>'code' in ('reconnect','scope_mismatch','credential_unavailable','provider_wait_review') then 'reconnect' else status end,
    token_cipher=case when refresh_inflight or payload->>'code' in ('reconnect','scope_mismatch','credential_unavailable','provider_wait_review') then null else token_cipher end,
    synced_at=null,last_error=case when payload->>'code' in ('reconnect','scope_mismatch','credential_unavailable','rate_limited','provider_uncertain','provider_unavailable','provider_invalid','incomplete_snapshot','provider_wait_review') then payload->>'code' else 'sync_failed' end,
    retry_at=clock_timestamp()+make_interval(secs=>greatest(60,least(86400,coalesce((payload->>'retryAfter')::int,60)))),lease_id=null,lease_until=null,refresh_inflight=false,updated_at=clock_timestamp() where owner_id=actor;
  else raise exception 'Unknown operation' using errcode='22023'; end if;
 end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.calendar_service(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.calendar_service(text,uuid,jsonb) to service_role;
create function public.calendar_status(expected_actor_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.workspace_calendar_connections;
begin
 if auth.uid() is null then raise exception 'Unauthorized' using errcode='42501'; end if;
 if auth.uid() is distinct from expected_actor_id then raise exception 'Account changed' using errcode='40001'; end if;
 select * into c from public.workspace_calendar_connections where owner_id=auth.uid();
 if not found then return null; end if;
 return jsonb_build_object('status',c.status,'calendar','primary','generation',c.generation,'syncedAt',c.synced_at,'windowStart',c.window_start,'windowEnd',c.window_end,'fresh',c.status='connected' and c.synced_at>clock_timestamp()-interval '5 minutes','retryAt',c.retry_at,'lastError',c.last_error,'revocationPending',c.revocation_pending);
end $$;
revoke all on function public.calendar_status(uuid) from public,anon;
grant execute on function public.calendar_status(uuid) to authenticated;
-- Additive booking enforcement; no API caller can bypass freshness via old RPC.
create function public.calendar_booking_guard() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.workspace_calendar_connections;
begin
 if new.status<>'confirmed' then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('calendar:'||new.owner_id::text,0));
 select * into c from public.workspace_calendar_connections where owner_id=new.owner_id for update;
 if c.owner_id is null or c.status='disconnected' then return new; end if;
 if c.status<>'connected' or c.synced_at is null or c.synced_at<clock_timestamp()-interval '5 minutes' or c.window_start is null or c.window_end is null or c.window_start>new.blocked_start or c.window_end<new.blocked_end then raise exception 'Calendar unavailable or stale' using errcode='P0001'; end if;
 if exists(select 1 from public.workspace_calendar_busy where owner_id=new.owner_id and starts_at<new.blocked_end and ends_at>new.blocked_start) then raise exception 'Calendar busy' using errcode='P0001'; end if;
 return new;
end $$;
revoke all on function public.calendar_booking_guard() from public,anon,authenticated;
create trigger calendar_booking_guard before insert or update on public.workspace_scheduling_bookings for each row execute function public.calendar_booking_guard();
commit;
