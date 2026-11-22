-- Local candidate: owner-managed MFH bookings only. No provider writes/tokens/public endpoints.
begin;
create table public.workspace_scheduling_availability (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 100), timezone text not null,
 weekday integer not null check(weekday between 0 and 6), start_minute integer not null check(start_minute between 0 and 1439),
 end_minute integer not null check(end_minute between 1 and 1440), duration integer not null check(duration between 15 and 240),
 buffer integer not null check(buffer between 0 and 120), notice_hours integer not null check(notice_hours between 0 and 720),
 horizon_days integer not null check(horizon_days between 1 and 180), daily_cap integer not null check(daily_cap between 1 and 50),
 active boolean not null default true, version integer not null default 1,
 created_at timestamptz not null default now(), unique(id,owner_id), check(end_minute-start_minute>=duration)
);
create table public.workspace_scheduling_intakes (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 100), consent text not null check(length(btrim(consent)) between 1 and 2000),
 fields jsonb not null, version integer not null check(version>0), created_at timestamptz not null default now(),
 unique(id,owner_id), unique(owner_id,version)
);
create table public.workspace_scheduling_bookings (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), availability_id uuid not null, intake_id uuid not null,
 attendee text not null check(length(btrim(attendee)) between 1 and 160), answers jsonb not null,
 consented_at timestamptz not null default now(), starts_at timestamptz not null, ends_at timestamptz not null,
 blocked_start timestamptz not null, blocked_end timestamptz not null, timezone text not null,
 status text not null default 'confirmed' check(status in ('confirmed','canceled')), version integer not null default 1,
 created_at timestamptz not null default now(), canceled_at timestamptz,
 foreign key(availability_id,owner_id) references public.workspace_scheduling_availability(id,owner_id),
 foreign key(intake_id,owner_id) references public.workspace_scheduling_intakes(id,owner_id),
 check(ends_at>starts_at and blocked_start<=starts_at and blocked_end>=ends_at)
);
create index on public.workspace_scheduling_bookings(owner_id,blocked_start,blocked_end) where status='confirmed';
create table public.workspace_scheduling_operations (
 owner_id uuid not null references auth.users(id), operation_id uuid not null, request_hash text not null, result jsonb not null,
 created_at timestamptz not null default now(), primary key(owner_id,operation_id)
);
do $$ declare t text; begin
 foreach t in array array['availability','intakes','bookings','operations'] loop
 execute format('alter table public.workspace_scheduling_%I enable row level security',t);
 execute format('alter table public.workspace_scheduling_%I force row level security',t);
 execute format('revoke all on public.workspace_scheduling_%I from public,anon,authenticated',t);
 execute format('grant select on public.workspace_scheduling_%I to authenticated',t);
 execute format('create policy owner_read on public.workspace_scheduling_%I for select to authenticated using(owner_id=auth.uid())',t);
 end loop;
end $$;
-- Independent guard: even privileged accidental updates cannot rewrite published history.
create function public.workspace_scheduling_guard() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_table_name='workspace_scheduling_intakes' or tg_table_name='workspace_scheduling_operations' then raise exception 'Immutable history'; end if;
 if tg_op='DELETE' then raise exception 'History cannot be deleted'; end if;
 if tg_table_name='workspace_scheduling_availability' then
  if (to_jsonb(new)-'active'-'version') is distinct from (to_jsonb(old)-'active'-'version') or new.version<>old.version+1 then raise exception 'Immutable availability; create replacement'; end if;
 else
  if (to_jsonb(new)-'status'-'version'-'canceled_at') is distinct from (to_jsonb(old)-'status'-'version'-'canceled_at') or old.status<>'confirmed' or new.status<>'canceled' or new.version<>old.version+1 or new.canceled_at is null then raise exception 'Immutable booking'; end if;
 end if;return new;
end $$;
do $$ declare t text; begin foreach t in array array['availability','intakes','bookings','operations'] loop
 execute format('create trigger scheduling_guard before update or delete on public.workspace_scheduling_%I for each row execute function public.workspace_scheduling_guard()',t);
end loop;end $$;
-- All writes serialize on owner. Explicit interval check under this transaction lock protects
-- overlap across every rule without btree_gist dependency. Direct DML is revoked, including upsert.
create function public.workspace_scheduling_mutate(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 actor uuid:=auth.uid(); op uuid; action text; keys text[]; digest text; previous public.workspace_scheduling_operations;
 result jsonb; rule public.workspace_scheduling_availability; intake public.workspace_scheduling_intakes; booking public.workspace_scheduling_bookings;
 start_at timestamptz; end_at timestamptz; local_start timestamp; local_end timestamp; m integer; f jsonb; answer_key text; answer_value jsonb;
begin
 if actor is null or jsonb_typeof(payload)<>'object' or length(payload::text)>24000 then raise exception 'Invalid authenticated request'; end if;
 if (payload->>'expectedActorId')::uuid is distinct from actor then raise exception 'Actor changed'; end if;
 op:=(payload->>'operationId')::uuid;if op is null then raise exception 'Operation required';end if;
 action:=payload->>'action';
 keys:=array['action','operationId','expectedActorId']||case action
 when 'availability' then array['title','timezone','weekday','startMinute','endMinute','duration','buffer','noticeHours','horizonDays','dailyCap']
 when 'toggle' then array['id','expectedVersion','active']
 when 'publish' then array['title','consent','fields']
 when 'book' then array['availabilityId','expectedVersion','intakeId','startsAt','attendee','answers','consented']
 when 'cancel' then array['id','expectedVersion'] else array[]::text[] end;
 if action not in ('availability','toggle','publish','book','cancel') or (select count(*) from jsonb_object_keys(payload))<>cardinality(keys) or exists(select 1 from jsonb_object_keys(payload) k where not(k=any(keys))) or exists(select 1 from unnest(keys) k where payload->k='null'::jsonb) then raise exception 'Closed payload required';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 digest:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 select * into previous from public.workspace_scheduling_operations where owner_id=actor and operation_id=op;
 if found then if previous.request_hash<>digest then raise exception 'Operation reused with different request';end if;return previous.result;end if;
 if action='availability' then
  if jsonb_typeof(payload->'title')<>'string' or jsonb_typeof(payload->'timezone')<>'string' or not exists(select 1 from pg_timezone_names where name=payload->>'timezone') then raise exception 'Invalid timezone/title';end if;
  foreach answer_key in array array['weekday','startMinute','endMinute','duration','buffer','noticeHours','horizonDays','dailyCap'] loop
   if jsonb_typeof(payload->answer_key)<>'number' or (payload->>answer_key)!~'^[0-9]+$' then raise exception 'Integer required';end if;
  end loop;
  insert into public.workspace_scheduling_availability(owner_id,title,timezone,weekday,start_minute,end_minute,duration,buffer,notice_hours,horizon_days,daily_cap)
  values(actor,payload->>'title',payload->>'timezone',(payload->>'weekday')::int,(payload->>'startMinute')::int,(payload->>'endMinute')::int,(payload->>'duration')::int,(payload->>'buffer')::int,(payload->>'noticeHours')::int,(payload->>'horizonDays')::int,(payload->>'dailyCap')::int) returning to_jsonb(workspace_scheduling_availability) into result;
 elsif action='toggle' then
  if jsonb_typeof(payload->'active')<>'boolean' then raise exception 'Boolean required';end if;
  update public.workspace_scheduling_availability set active=(payload->>'active')::boolean,version=version+1 where id=(payload->>'id')::uuid and owner_id=actor and version=(payload->>'expectedVersion')::int returning to_jsonb(workspace_scheduling_availability) into result;
  if result is null then raise exception 'Rule version unavailable';end if;
 elsif action='publish' then
  if jsonb_typeof(payload->'title')<>'string' or jsonb_typeof(payload->'consent')<>'string' or jsonb_typeof(payload->'fields')<>'array' or jsonb_array_length(payload->'fields') not between 1 and 8 then raise exception 'Invalid intake';end if;
  for f in select value from jsonb_array_elements(payload->'fields') loop
   if jsonb_typeof(f)<>'object' or (select count(*) from jsonb_object_keys(f))<>3 or not(f ?& array['id','label','required']) or jsonb_typeof(f->'id')<>'string' or (f->>'id')!~'^q[1-8]$' or jsonb_typeof(f->'label')<>'string' or length(btrim(f->>'label')) not between 1 and 160 or jsonb_typeof(f->'required')<>'boolean' then raise exception 'Invalid text question';end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(payload->'fields'))<>jsonb_array_length(payload->'fields') then raise exception 'Duplicate question';end if;
  insert into public.workspace_scheduling_intakes(owner_id,title,consent,fields,version) values(actor,payload->>'title',payload->>'consent',payload->'fields',(select coalesce(max(version),0)+1 from public.workspace_scheduling_intakes where owner_id=actor)) returning to_jsonb(workspace_scheduling_intakes) into result;
 elsif action='book' then
  select * into rule from public.workspace_scheduling_availability where id=(payload->>'availabilityId')::uuid and owner_id=actor and active and version=(payload->>'expectedVersion')::int;
  if not found then raise exception 'Rule unavailable';end if;
  select * into intake from public.workspace_scheduling_intakes where id=(payload->>'intakeId')::uuid and owner_id=actor;
  if not found then raise exception 'Intake unavailable';end if;
  if payload->'consented'<>'true'::jsonb or jsonb_typeof(payload->'attendee')<>'string' or jsonb_typeof(payload->'answers')<>'object' or (payload->>'startsAt')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:00[.]000Z$' then raise exception 'Invalid submission';end if;
  for answer_key,answer_value in select * from jsonb_each(payload->'answers') loop
   if jsonb_typeof(answer_value)<>'string' or length(answer_value#>>'{}')>2000 or not exists(select 1 from jsonb_array_elements(intake.fields) x where x->>'id'=answer_key) then raise exception 'Invalid answer';end if;
  end loop;
  for f in select value from jsonb_array_elements(intake.fields) loop
   if (f->>'required')::boolean and coalesce(length(btrim(payload->'answers'->>(f->>'id'))),0)=0 then raise exception 'Required answer';end if;
  end loop;
  start_at:=(payload->>'startsAt')::timestamptz;end_at:=start_at+make_interval(mins=>rule.duration);
  local_start:=start_at at time zone rule.timezone;local_end:=end_at at time zone rule.timezone;
  m:=extract(hour from local_start)::int*60+extract(minute from local_start)::int;
  -- Crossing an offset transition is deliberately excluded; the repeated start itself is explicit UTC.
  if start_at<now()+make_interval(hours=>rule.notice_hours) or start_at>now()+make_interval(days=>rule.horizon_days) or extract(dow from local_start)::int<>rule.weekday or m<rule.start_minute or m+rule.duration>rule.end_minute or (m-rule.start_minute)%rule.duration<>0 or local_end<>local_start+make_interval(mins=>rule.duration) then raise exception 'Outside availability';end if;
  if exists(select 1 from public.workspace_scheduling_bookings b where owner_id=actor and status='confirmed' and b.blocked_start<end_at+make_interval(mins=>rule.buffer) and b.blocked_end>start_at-make_interval(mins=>rule.buffer)) then raise exception 'Slot conflict';end if;
  if (select count(*) from public.workspace_scheduling_bookings where owner_id=actor and status='confirmed' and (starts_at at time zone rule.timezone)::date=local_start::date)>=rule.daily_cap then raise exception 'Daily cap';end if;
  insert into public.workspace_scheduling_bookings(owner_id,availability_id,intake_id,attendee,answers,starts_at,ends_at,blocked_start,blocked_end,timezone)
  values(actor,rule.id,intake.id,payload->>'attendee',payload->'answers',start_at,end_at,start_at-make_interval(mins=>rule.buffer),end_at+make_interval(mins=>rule.buffer),rule.timezone) returning to_jsonb(workspace_scheduling_bookings) into result;
 else
  update public.workspace_scheduling_bookings set status='canceled',canceled_at=now(),version=version+1 where id=(payload->>'id')::uuid and owner_id=actor and status='confirmed' and version=(payload->>'expectedVersion')::int returning to_jsonb(workspace_scheduling_bookings) into result;
  if result is null then raise exception 'Booking version unavailable';end if;
 end if;
 insert into public.workspace_scheduling_operations(owner_id,operation_id,request_hash,result) values(actor,op,digest,result);
 return result;
end $$;
revoke all on function public.workspace_scheduling_mutate(jsonb) from public,anon,authenticated;
grant execute on function public.workspace_scheduling_mutate(jsonb) to authenticated;
revoke all on function public.workspace_scheduling_guard() from public,anon,authenticated;
commit;
