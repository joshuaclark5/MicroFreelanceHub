-- LOCAL lifecycle candidate only; requires the guarded base prototype, not a migration.
begin;
do $$ begin if current_database() !~ '^time_off_prototype_[0-9]+$' then raise exception 'Disposable time-off database required';end if;end $$;
alter table public.prototype_time_off add column active boolean not null default true,add column version integer not null default 1 check(version>0);
create index prototype_time_off_owner_active on public.prototype_time_off(owner_id,starts_at,ends_at) where active;
create table public.prototype_time_off_operations(owner_id uuid not null references auth.users(id),operation_id uuid not null,request_hash text not null,result jsonb not null,primary key(owner_id,operation_id));
alter table public.prototype_time_off_operations enable row level security;
alter table public.prototype_time_off_operations force row level security;
revoke all on public.prototype_time_off_operations from public,anon,authenticated,service_role;
create function public.prototype_time_off_immutable() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op='DELETE' then raise exception 'Time-off history is retained';end if;
 if (to_jsonb(new)-array['active','version']) is distinct from (to_jsonb(old)-array['active','version']) or not old.active or new.active or new.version<>old.version+1 then raise exception 'Only versioned removal is supported';end if;
 return new;
end $$;
create trigger prototype_time_off_history before update or delete on public.prototype_time_off for each row execute function public.prototype_time_off_immutable();
create function public.prototype_time_off_preview(first_day date,last_day date,z text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public set timezone='UTC' as $$
declare actor uuid:=auth.uid();first_instant timestamptz;after_last timestamptz;affected jsonb;review jsonb;
begin
 if actor is null or first_day is null or last_day is null or last_day<first_day or last_day-first_day>=366 then raise exception 'Invalid authenticated time-off range';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 first_instant:=public.prototype_day_boundary(first_day,z);after_last:=public.prototype_day_boundary(last_day+1,z);
 if after_last<=first_instant then raise exception 'This range contains no real local time';end if;
 select coalesce(jsonb_agg(to_jsonb(b) order by b.id),'[]'::jsonb) into affected from (select id,version,attendee,timezone,starts_at,ends_at,blocked_start,blocked_end from public.workspace_scheduling_bookings where owner_id=actor and status='confirmed' and blocked_start<after_last and blocked_end>first_instant order by id limit 501)b;
 if jsonb_array_length(affected)>500 then raise exception 'Too many affected bookings for complete review';end if;
 review:=jsonb_build_object('owner',actor,'first',first_day,'last',last_day,'timezone',z,'startsAt',first_instant,'endsAt',after_last,'affected',affected);
 return jsonb_build_object('startsAt',first_instant,'endsAt',after_last,'affectedBookings',affected,'reviewToken',encode(sha256(convert_to(review::text,'UTF8')),'hex'));
end $$;
create function public.prototype_time_off_mutate(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public set timezone='UTC' as $$
declare actor uuid:=auth.uid();action text;keys text[];op uuid;digest text;prior public.prototype_time_off_operations;result jsonb;review jsonb;first_day date;last_day date;
begin
 if actor is null or jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>6000 then raise exception 'Invalid authenticated request';end if;
 action:=payload->>'action';keys:=array['action','expectedActorId','operationId']||case action when 'create' then array['startsOn','endsOn','timezone','expectedReviewToken'] when 'remove' then array['id','expectedVersion'] else array[]::text[] end;
 if action not in ('create','remove') or action is null or (select count(*) from jsonb_object_keys(payload))<>cardinality(keys) or exists(select 1 from jsonb_object_keys(payload) k where not(k=any(keys))) or exists(select 1 from unnest(keys) k where not(payload ? k) or payload->k='null'::jsonb) then raise exception 'Closed payload required';end if;
 if jsonb_typeof(payload->'expectedActorId')<>'string' or (payload->>'expectedActorId')::uuid is distinct from actor then raise exception 'Actor changed';end if;
 if jsonb_typeof(payload->'operationId')<>'string' or (payload->>'operationId')!~'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then raise exception 'Valid operation required';end if;
 op:=(payload->>'operationId')::uuid;digest:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 select * into prior from public.prototype_time_off_operations where owner_id=actor and operation_id=op;
 if found then if prior.request_hash<>digest then raise exception 'Operation changed';end if;return jsonb_build_object('record',prior.result,'replayed',true);end if;
 if action='create' then
  if jsonb_typeof(payload->'startsOn')<>'string' or jsonb_typeof(payload->'endsOn')<>'string' or jsonb_typeof(payload->'timezone')<>'string' or jsonb_typeof(payload->'expectedReviewToken')<>'string' or (payload->>'startsOn')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (payload->>'endsOn')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (payload->>'expectedReviewToken')!~'^[a-f0-9]{64}$' then raise exception 'Valid range and review required';end if;
  first_day:=(payload->>'startsOn')::date;last_day:=(payload->>'endsOn')::date;
  review:=public.prototype_time_off_preview(first_day,last_day,payload->>'timezone');
  if review->>'reviewToken' is distinct from payload->>'expectedReviewToken' then raise exception 'Affected bookings changed; review again';end if;
  result:=public.prototype_time_off_create(first_day,last_day,payload->>'timezone');
 else
  if jsonb_typeof(payload->'id')<>'string' or jsonb_typeof(payload->'expectedVersion')<>'number' or (payload->>'expectedVersion')!~'^[1-9][0-9]{0,8}$' then raise exception 'Valid record and version required';end if;
  update public.prototype_time_off set active=false,version=version+1 where id=(payload->>'id')::uuid and owner_id=actor and active and version=(payload->>'expectedVersion')::int returning to_jsonb(prototype_time_off) into result;
  if result is null then raise exception 'Unavailable time off or changed version';end if;
 end if;
 insert into public.prototype_time_off_operations values(actor,op,digest,result);
 return jsonb_build_object('record',result,'replayed',false);
end $$;
revoke all on function public.prototype_time_off_immutable(),public.prototype_time_off_preview(date,date,text),public.prototype_time_off_mutate(jsonb) from public,anon,authenticated,service_role;
-- Active intervals alone affect future booking saves and both public preview paths.
do $$ declare signature text;definition text;needle text:='where t.owner_id=';begin
 foreach signature in array array['public.prototype_time_off_guard()','public.public_booking_service(text,jsonb)','public.public_booking_window(text,date,timestamptz)'] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then raise exception 'Unexpected lifecycle baseline';end if;
  execute replace(definition,needle,'where t.active and t.owner_id=');
 end loop;
end $$;
commit;
