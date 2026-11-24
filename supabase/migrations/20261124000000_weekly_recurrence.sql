-- Additive candidate. Rehearse on an isolated restored baseline before hosted application.
begin;
do $$ begin
 if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='workspace_scheduling_mutate' and md5(btrim(replace(prosrc,E'\r\n',E'\n'),E' \t\r\n'))='f0e56718278e83ed753dc6935e60a42b') or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='public_booking_service' and md5(btrim(replace(prosrc,E'\r\n',E'\n'),E' \t\r\n'))='e543074c74ec0ad2c73d71910c005e53') then raise exception 'Scheduling baseline changed; review before migration'; end if;
end $$;
create function public.workspace_recurrence_valid(r jsonb) returns boolean language plpgsql immutable set search_path=pg_catalog,public as $$
declare item jsonb; start_day date; end_day date;
begin
 if r is null then return true;end if;
 if jsonb_typeof(r) is distinct from 'object' or not(r ?& array['weekdays','intervalWeeks','startDate','endDate','excludedDates']) or (select count(*) from jsonb_object_keys(r))<>5 then return false;end if;
 if jsonb_typeof(r->'weekdays') is distinct from 'array' or jsonb_array_length(r->'weekdays') not between 1 and 7 or jsonb_typeof(r->'excludedDates') is distinct from 'array' or jsonb_array_length(r->'excludedDates')>366 then return false;end if;
 if r->'intervalWeeks' not in ('1'::jsonb,'2'::jsonb) then return false;end if;
 if jsonb_typeof(r->'startDate') is distinct from 'string' or (r->>'startDate')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false;end if;
 start_day:=(r->>'startDate')::date;if start_day::text<>r->>'startDate' then return false;end if;
 if r->'endDate'<>'null'::jsonb then
  if jsonb_typeof(r->'endDate') is distinct from 'string' or (r->>'endDate')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false;end if;
  end_day:=(r->>'endDate')::date;if end_day::text<>r->>'endDate' or end_day<start_day then return false;end if;
 end if;
 for item in select value from jsonb_array_elements(r->'weekdays') loop
  if jsonb_typeof(item) is distinct from 'number' or item::text!~'^[0-6]$' then return false;end if;
 end loop;
 if (select count(distinct value) from jsonb_array_elements(r->'weekdays'))<>jsonb_array_length(r->'weekdays') then return false;end if;
 for item in select value from jsonb_array_elements(r->'excludedDates') loop
  if jsonb_typeof(item) is distinct from 'string' or (item#>>'{}')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (item#>>'{}')::date::text<>item#>>'{}' or (item#>>'{}')::date<start_day or (end_day is not null and (item#>>'{}')::date>end_day) then return false;end if;
 end loop;
 if (select count(distinct value) from jsonb_array_elements(r->'excludedDates'))<>jsonb_array_length(r->'excludedDates') then return false;end if;
 return true;
exception when others then return false;
end $$;
create function public.workspace_availability_matches(legacy_weekday integer,r jsonb,day date) returns boolean language sql immutable set search_path=pg_catalog,public as $$
 select case when r is null then extract(dow from day)::int=legacy_weekday else
  day>=(r->>'startDate')::date and (r->'endDate'='null'::jsonb or day<=(r->>'endDate')::date)
  and exists(select 1 from jsonb_array_elements(r->'weekdays') x where x.value=to_jsonb(extract(dow from day)::int))
  and ((day-date_trunc('week',(r->>'startDate')::date::timestamp)::date)/7)%(r->>'intervalWeeks')::int=0
  and not(r->'excludedDates' @> jsonb_build_array(day::text)) end
$$;
alter table public.workspace_scheduling_availability add column recurrence jsonb;
alter table public.workspace_scheduling_availability add constraint scheduling_recurrence_valid check(public.workspace_recurrence_valid(recurrence));
alter function public.workspace_recurrence_valid(jsonb) owner to postgres;
alter function public.workspace_availability_matches(integer,jsonb,date) owner to postgres;
revoke all on function public.workspace_recurrence_valid(jsonb) from public,anon,authenticated;
revoke all on function public.workspace_availability_matches(integer,jsonb,date) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.workspace_scheduling_mutate(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
 if action='availability' and payload ? 'recurrence' then keys:=keys||array['recurrence'];end if;
 if action not in ('availability','toggle','publish','book','cancel') or (select count(*) from jsonb_object_keys(payload))<>cardinality(keys) or exists(select 1 from jsonb_object_keys(payload) k where not(k=any(keys))) or exists(select 1 from unnest(keys) k where payload->k='null'::jsonb) then raise exception 'Closed payload required';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 digest:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 select * into previous from public.workspace_scheduling_operations where owner_id=actor and operation_id=op;
 if found then if previous.request_hash<>digest then raise exception 'Operation reused with different request';end if;return previous.result;end if;
 if action='availability' then
  if payload ? 'recurrence' and (payload->'recurrence'='null'::jsonb or not public.workspace_recurrence_valid(payload->'recurrence')) then raise exception 'Invalid recurrence';end if;
  if jsonb_typeof(payload->'title')<>'string' or jsonb_typeof(payload->'timezone')<>'string' or not exists(select 1 from pg_timezone_names where name=payload->>'timezone') then raise exception 'Invalid timezone/title';end if;
  foreach answer_key in array array['weekday','startMinute','endMinute','duration','buffer','noticeHours','horizonDays','dailyCap'] loop
   if jsonb_typeof(payload->answer_key)<>'number' or (payload->>answer_key)!~'^[0-9]+$' then raise exception 'Integer required';end if;
  end loop;
  insert into public.workspace_scheduling_availability(owner_id,title,timezone,weekday,start_minute,end_minute,duration,buffer,notice_hours,horizon_days,daily_cap,recurrence)
  values(actor,payload->>'title',payload->>'timezone',(payload->>'weekday')::int,(payload->>'startMinute')::int,(payload->>'endMinute')::int,(payload->>'duration')::int,(payload->>'buffer')::int,(payload->>'noticeHours')::int,(payload->>'horizonDays')::int,(payload->>'dailyCap')::int,payload->'recurrence') returning to_jsonb(workspace_scheduling_availability) into result;
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
  if start_at<now()+make_interval(hours=>rule.notice_hours) or start_at>now()+make_interval(days=>rule.horizon_days) or not public.workspace_availability_matches(rule.weekday,rule.recurrence,local_start::date) or m<rule.start_minute or m+rule.duration>rule.end_minute or (m-rule.start_minute)%rule.duration<>0 or local_end<>local_start+make_interval(mins=>rule.duration) then raise exception 'Outside availability';end if;
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
end $function$

;
CREATE OR REPLACE FUNCTION public.public_booking_service(handle text, payload jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
   and public.workspace_availability_matches(r.weekday,r.recurrence,local_start::date)
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
end $function$

;
commit;
