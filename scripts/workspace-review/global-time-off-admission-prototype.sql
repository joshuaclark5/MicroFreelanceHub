-- LOCAL ONLY: durable admission and structured responses for the time-off prototype.
begin;
do $$ begin if current_database() !~ '^time_off_prototype_[0-9]+$' then raise exception 'Disposable time-off database required';end if;end $$;
create table public.prototype_time_off_limits (
 owner_id uuid primary key references auth.users(id), expires_at timestamptz not null,
 hits integer not null check(hits between 1 and 31)
);
alter table public.prototype_time_off_limits enable row level security;
alter table public.prototype_time_off_limits force row level security;
revoke all on public.prototype_time_off_limits from public,anon,authenticated,service_role;
create function public.prototype_time_off_request(payload jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set timezone='UTC' as $$
declare actor uuid:=auth.uid(); used integer; stamp timestamptz; result jsonb; action text; detail text; state text; first_day date; last_day date; first_instant timestamptz; after_last timestamptz;
begin
 if actor is null then return jsonb_build_object('ok',false,'code','invalid');end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 stamp:=clock_timestamp();
 insert into public.prototype_time_off_limits values(actor,stamp+interval '1 minute',1)
 on conflict(owner_id) do update set
 hits=case when prototype_time_off_limits.expires_at<=stamp then 1 else least(prototype_time_off_limits.hits+1,31) end,
 expires_at=case when prototype_time_off_limits.expires_at<=stamp then stamp+interval '1 minute' else prototype_time_off_limits.expires_at end
 returning hits into used;
 if used>30 then return jsonb_build_object('ok',false,'code','rate_limited');end if;
 -- Catch in a nested block: failed work rolls back, admission above survives.
 begin
  if jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>6000 then raise exception 'Invalid request';end if;
  if jsonb_typeof(payload->'expectedActorId') is distinct from 'string' or (payload->>'expectedActorId')::uuid is distinct from actor then raise exception 'Invalid actor';end if;
  action:=payload->>'action';
  if action in ('preview','list') then
   if (select count(*) from jsonb_object_keys(payload))<>5 or exists(select 1 from jsonb_object_keys(payload) k where k<>all(array['action','expectedActorId','startsOn','endsOn','timezone'])) then raise exception 'Invalid fields';end if;
   if jsonb_typeof(payload->'startsOn') is distinct from 'string' or jsonb_typeof(payload->'endsOn') is distinct from 'string' or jsonb_typeof(payload->'timezone') is distinct from 'string' or (payload->>'startsOn')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (payload->>'endsOn')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or length(payload->>'timezone') not between 1 and 80 then raise exception 'Invalid range';end if;
   if action='list' then
    first_day:=(payload->>'startsOn')::date;last_day:=(payload->>'endsOn')::date;
    if last_day<first_day or last_day-first_day>=366 then raise exception 'Invalid range';end if;
    first_instant:=public.prototype_day_boundary(first_day,payload->>'timezone');
    after_last:=public.prototype_day_boundary(last_day+1,payload->>'timezone');
    if after_last<=first_instant then raise exception 'Empty range';end if;
    select coalesce(jsonb_agg(to_jsonb(t) order by t.starts_at,t.id),'[]'::jsonb) into result
    from (select * from public.prototype_time_off where owner_id=actor and active and starts_at<after_last and ends_at>first_instant order by starts_at,id limit 101)t;
    return jsonb_build_object('ok',true,'actorId',actor,'startsOn',first_day,'endsOn',last_day,'timezone',payload->>'timezone','truncated',jsonb_array_length(result)>100,
     'records',(select coalesce(jsonb_agg(v order by n),'[]'::jsonb) from jsonb_array_elements(result) with ordinality as a(v,n) where n<=100));
   end if;
   result:=public.prototype_time_off_preview((payload->>'startsOn')::date,(payload->>'endsOn')::date,payload->>'timezone');
   return jsonb_build_object('ok',true,'actorId',actor,'preview',result);
  elsif action in ('create','remove') then
   result:=public.prototype_time_off_mutate(payload);
   return jsonb_build_object('ok',true,'actorId',actor)||result;
  else raise exception 'Invalid action';end if;
 exception when others then
  get stacked diagnostics state=returned_sqlstate,detail=message_text;
  return jsonb_build_object('ok',false,'code',case
   when state='P0001' and detail='Affected bookings changed; review again' then 'review_changed'
   when state='P0001' and detail in ('Operation changed','Unavailable time off or changed version') then 'conflict'
   when state in ('P0001','22007','22008','22023','22P02','23503','23505','23514') then 'invalid'
   else 'unavailable' end);
 end;
end $$;
revoke all on function public.prototype_time_off_request(jsonb) from public,anon,authenticated,service_role;
-- Authenticated can enter ONLY through the quota-enforcing wrapper in this clone.
grant execute on function public.prototype_time_off_request(jsonb) to authenticated;
commit;
