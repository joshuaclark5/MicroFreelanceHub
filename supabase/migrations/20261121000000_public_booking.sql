-- Additive, explicit opt-in. No rows are created for existing owners.
begin;
create table public.workspace_public_booking (
 owner_id uuid primary key references auth.users(id),
 token text not null unique default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),
 availability_id uuid not null, intake_id uuid not null,
 enabled boolean not null default false, version integer not null default 1,
 foreign key(availability_id,owner_id) references public.workspace_scheduling_availability(id,owner_id),
 foreign key(intake_id,owner_id) references public.workspace_scheduling_intakes(id,owner_id)
);
create table public.workspace_public_booking_receipts (
 token text not null, operation_id uuid not null, request_hash text not null, result jsonb not null,
 primary key(token,operation_id)
);
create table public.workspace_public_booking_limits (
 key text primary key, expires_at timestamptz not null, hits integer not null
);
do $$ declare t text; begin foreach t in array array['workspace_public_booking','workspace_public_booking_receipts','workspace_public_booking_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
end loop; end $$;
grant select on public.workspace_public_booking to authenticated;
create policy owner_read on public.workspace_public_booking for select to authenticated using(owner_id=auth.uid());

create function public.public_booking_config(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); p public.workspace_public_booking; v integer;
begin
 if actor is null or jsonb_typeof(payload) is distinct from 'object' or not(payload ?& array['expectedActorId','expectedVersion','availabilityId','intakeId','enabled','rotate']) or (select count(*) from jsonb_object_keys(payload))<>6 then raise exception 'Invalid request'; end if;
 if (payload->>'expectedActorId')::uuid is distinct from actor then raise exception 'Actor changed';end if;
 if jsonb_typeof(payload->'enabled') is distinct from 'boolean' or jsonb_typeof(payload->'rotate') is distinct from 'boolean' or jsonb_typeof(payload->'expectedVersion') is distinct from 'number' or (payload->>'expectedVersion')!~'^[0-9]+$' then raise exception 'Invalid version';end if;
 v:=(payload->>'expectedVersion')::integer;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 select * into p from public.workspace_public_booking where owner_id=actor;
 if coalesce(p.version,0)<>v then raise exception 'Changed' using errcode='40001';end if;
 if not exists(select 1 from public.workspace_scheduling_availability where owner_id=actor and id=(payload->>'availabilityId')::uuid) or not exists(select 1 from public.workspace_scheduling_intakes where owner_id=actor and id=(payload->>'intakeId')::uuid) then raise exception 'Invalid selection';end if;
 insert into public.workspace_public_booking(owner_id,availability_id,intake_id,enabled)
 values(actor,(payload->>'availabilityId')::uuid,(payload->>'intakeId')::uuid,(payload->>'enabled')::boolean)
 on conflict(owner_id) do update set availability_id=excluded.availability_id,intake_id=excluded.intake_id,enabled=excluded.enabled,
 token=case when (payload->>'rotate')::boolean then replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','') else workspace_public_booking.token end,
 version=workspace_public_booking.version+1
 returning * into p;
 return to_jsonb(p)-'owner_id';
end $$;
revoke all on function public.public_booking_config(jsonb) from public,anon;
grant execute on function public.public_booking_config(jsonb) to authenticated;

-- Commit this RPC separately from booking: failed booking transactions cannot undo abuse counters.
-- Token-wide caps remain effective even if an attacker changes network identity.
create function public.public_booking_throttle(handle text, identity_hash text, writing boolean) returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare k text; n integer; cap integer; until_at timestamptz; prefix text;
begin
 if handle is null or handle!~'^[a-f0-9]{64}$' or identity_hash is null or identity_hash!~'^[a-f0-9]{64}$' or writing is null then return false;end if;
 if not exists(select 1 from public.workspace_public_booking where token=handle and enabled) then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended('public-rate:'||handle,0));
 delete from public.workspace_public_booking_limits where expires_at<clock_timestamp();
 prefix:=handle||case when writing then ':write:' else ':read:' end;
 until_at:=clock_timestamp()+case when writing then interval '1 hour' else interval '1 minute' end;
 foreach k in array array[prefix||'all',prefix||identity_hash] loop
 cap:=case when writing then case when k=prefix||'all' then 30 else 5 end else case when k=prefix||'all' then 120 else 30 end end;
 insert into public.workspace_public_booking_limits values(k,until_at,1)
 on conflict(key) do update set hits=workspace_public_booking_limits.hits+1 returning hits into n;
 if n>cap then return false;end if;
 end loop;
 return true;
end $$;
revoke all on function public.public_booking_throttle(text,text,boolean) from public,anon,authenticated;
grant execute on function public.public_booking_throttle(text,text,boolean) to service_role;

-- Service-only façade; never grant anonymous/authenticated roles the ability to set owner identity.
create function public.public_booking_service(handle text, payload jsonb default null) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.workspace_public_booking; r public.workspace_scheduling_availability; i public.workspace_scheduling_intakes;
 c public.workspace_calendar_connections; result jsonb; prior public.workspace_public_booking_receipts;
 original_sub text; request_hash text; op uuid; slots jsonb;
begin
 if handle is null or handle!~'^[a-f0-9]{64}$' then raise exception 'Unavailable';end if;
 select * into p from public.workspace_public_booking where token=handle and enabled;
 if not found then raise exception 'Unavailable';end if;
 -- Same owner lock as private scheduling and configuration; re-read after waiting.
 perform pg_advisory_xact_lock(hashtextextended(p.owner_id::text,73118));
 select * into p from public.workspace_public_booking where token=handle and enabled;
 if not found then raise exception 'Unavailable';end if;
 select * into r from public.workspace_scheduling_availability where id=p.availability_id and owner_id=p.owner_id and active;
 if not found then raise exception 'Unavailable';end if;
 select * into i from public.workspace_scheduling_intakes where id=p.intake_id and owner_id=p.owner_id;
 if payload is not null then
  if jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>22000 or not(payload ?& array['operationId','startsAt','attendee','answers','consented','portalVersion']) or (select count(*) from jsonb_object_keys(payload))<>6 then raise exception 'Invalid request';end if;
  if jsonb_typeof(payload->'portalVersion') is distinct from 'number' or (payload->>'portalVersion')!~'^[0-9]+$' or (payload->>'portalVersion')::int<>p.version then raise exception 'Changed';end if;
  if jsonb_typeof(payload->'operationId') is distinct from 'string' or (payload->>'operationId')!~'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then raise exception 'Invalid operation';end if;
  op:=(payload->>'operationId')::uuid;
  request_hash:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
  select * into prior from public.workspace_public_booking_receipts where token=handle and operation_id=op;
  if found then
   if prior.request_hash<>request_hash then raise exception 'Operation changed';end if;
   return prior.result;
  end if;
  if jsonb_typeof(payload->'startsAt') is distinct from 'string' or (payload->>'startsAt')::timestamptz>now()+interval '7 days' then raise exception 'Outside public window';end if;
  -- Existing mutation validates exact UTC slot, intake types/required answers, buffers,
  -- notice, horizon, DST, daily cap and cross-rule overlap under this same lock.
  -- Existing calendar trigger independently enforces mirror coverage and freshness.
  original_sub:=current_setting('request.jwt.claim.sub',true);
  perform set_config('request.jwt.claim.sub',p.owner_id::text,true);
  result:=public.workspace_scheduling_mutate(jsonb_build_object(
   'action','book','operationId',op,'expectedActorId',p.owner_id,
   'availabilityId',r.id,'expectedVersion',r.version,'intakeId',i.id,
   'startsAt',payload->'startsAt','attendee',payload->'attendee','answers',payload->'answers','consented',payload->'consented'));
  perform set_config('request.jwt.claim.sub',coalesce(original_sub,''),true);
  result:=jsonb_build_object('confirmed',true,'startsAt',result->'starts_at','endsAt',result->'ends_at','timezone',r.timezone);
  insert into public.workspace_public_booking_receipts values(handle,op,request_hash,result);
  return result;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('calendar:'||p.owner_id::text,0));
 select * into c from public.workspace_calendar_connections where owner_id=p.owner_id;
 -- Only the next seven days and at most 100 available instants; no busy intervals,
 -- owner UUID, calendar metadata, other rule or booking details ever leave this function.
 select coalesce(jsonb_agg(to_char(s at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS".000Z"')),'[]'::jsonb) into slots from (
  select s from generate_series(date_trunc('minute',now())+interval '1 minute',now()+interval '7 days',interval '1 minute') s
  cross join lateral (select s at time zone r.timezone as local_start,(s+make_interval(mins=>r.duration)) at time zone r.timezone as local_end) local
  where s>=now()+make_interval(hours=>r.notice_hours) and s<=now()+make_interval(days=>r.horizon_days)
   and extract(dow from local_start)::int=r.weekday
   and extract(hour from local_start)::int*60+extract(minute from local_start)::int>=r.start_minute
   and extract(hour from local_start)::int*60+extract(minute from local_start)::int+r.duration<=r.end_minute
   and (extract(hour from local_start)::int*60+extract(minute from local_start)::int-r.start_minute)%r.duration=0
   and local_end=local_start+make_interval(mins=>r.duration)
   and not exists(select 1 from public.workspace_scheduling_bookings b where b.owner_id=p.owner_id and b.status='confirmed' and b.blocked_start<s+make_interval(mins=>r.duration+r.buffer) and b.blocked_end>s-make_interval(mins=>r.buffer))
   and (select count(*) from public.workspace_scheduling_bookings b where b.owner_id=p.owner_id and b.status='confirmed' and (b.starts_at at time zone r.timezone)::date=local_start::date)<r.daily_cap
   and (c.owner_id is null or c.status='disconnected' or (
    c.status='connected' and c.synced_at>=clock_timestamp()-interval '5 minutes'
    and c.window_start<=s-make_interval(mins=>r.buffer) and c.window_end>=s+make_interval(mins=>r.duration+r.buffer)
    and not exists(select 1 from public.workspace_calendar_busy b where b.owner_id=p.owner_id and b.starts_at<s+make_interval(mins=>r.duration+r.buffer) and b.ends_at>s-make_interval(mins=>r.buffer))))
  order by s limit 100
 ) available;
 return jsonb_build_object('title',r.title,'timezone',r.timezone,'duration',r.duration,'consent',i.consent,'fields',i.fields,'slots',slots,'portalVersion',p.version);
end $$;
revoke all on function public.public_booking_service(text,jsonb) from public,anon,authenticated;
grant execute on function public.public_booking_service(text,jsonb) to service_role;
commit;
