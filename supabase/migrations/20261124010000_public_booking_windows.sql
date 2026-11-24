-- Additive bounded date browsing; apply only after weekly recurrence migration.
begin;
do $$ begin if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='public_booking_service' and md5(btrim(replace(prosrc,E'\r\n',E'\n'),E' \t\r\n'))='ec980696303b49d1029ec424645092ca') then raise exception 'Public booking recurrence baseline changed';end if;end $$;
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
  if jsonb_typeof(payload->'startsAt') is distinct from 'string' or (payload->>'startsAt')::timestamptz>now()+interval '180 days' then raise exception 'Outside public window';end if;
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
CREATE OR REPLACE FUNCTION public.public_booking_window(handle text, starts_on date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare p public.workspace_public_booking; r public.workspace_scheduling_availability; i public.workspace_scheduling_intakes;
 c public.workspace_calendar_connections; result jsonb; prior public.workspace_public_booking_receipts;
 original_sub text; request_hash text; op uuid; slots jsonb; window_day date; today_host date; max_day date; next_day date;
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
 perform pg_advisory_xact_lock(hashtextextended('calendar:'||p.owner_id::text,0));
 select * into c from public.workspace_calendar_connections where owner_id=p.owner_id;
 today_host:=(now() at time zone r.timezone)::date;max_day:=((now()+make_interval(days=>r.horizon_days)) at time zone r.timezone)::date;window_day:=coalesce(starts_on,today_host);
 if window_day<today_host or window_day>max_day then raise exception 'Outside booking horizon';end if;
 -- At most seven local dates and 100 instants; no busy intervals,
 -- owner UUID, calendar metadata, other rule or booking details ever leave this function.
 select coalesce(jsonb_agg(to_char(s at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS".000Z"')),'[]'::jsonb) into slots from (
  select s from generate_series(greatest(date_trunc('minute',now())+interval '1 minute',window_day::timestamp at time zone r.timezone),((window_day+7)::timestamp at time zone r.timezone)-interval '1 minute',interval '1 minute') s
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
 next_day:=case when jsonb_array_length(slots)=100 then ((slots->>99)::timestamptz at time zone r.timezone)::date else window_day+7 end;
 return jsonb_build_object('windowStart',window_day,'windowEnd',least(window_day+6,max_day),'minDate',today_host,'maxDate',max_day,'previousStart',case when window_day>today_host then greatest(today_host,window_day-7) else null end,'nextStart',case when next_day>window_day and next_day<=max_day then next_day else null end,'title',r.title,'timezone',r.timezone,'duration',r.duration,'consent',i.consent,'fields',i.fields,'slots',slots,'portalVersion',p.version);
end $function$

;

alter function public.public_booking_window(text,date) owner to postgres;
revoke all on function public.public_booking_window(text,date) from public,anon,authenticated;
grant execute on function public.public_booking_window(text,date) to service_role;
commit;
