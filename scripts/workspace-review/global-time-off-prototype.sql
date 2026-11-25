-- LOCAL PROTOTYPE ONLY. Not a migration. No hosted application or production use.
-- The runner creates a network-isolated clone before executing this file.
begin;
do $$ begin
 if current_database() !~ '^time_off_prototype_[0-9]+$' then raise exception 'Disposable time-off prototype database required';end if;
end $$;
create function public.prototype_day_boundary(d date,z text) returns timestamptz language plpgsql set search_path=pg_catalog,public as $$
declare candidate timestamptz; result timestamptz;
begin
 if d is null or d<'1900-01-01' or d>'2200-01-01' or z is null or length(z)>80 or not exists(select 1 from pg_timezone_names where name=z) then raise exception 'Invalid day or timezone';end if;
 candidate:=d::timestamp at time zone z;
 -- A deliberately slow reference algorithm: second-resolution exhaustive envelope.
 -- It handles midnight folds/gaps and skipped civil dates. Optimize only with parity proof.
 select min(s) into result from generate_series(candidate-interval '26 hours',candidate+interval '26 hours',interval '1 second') s where (s at time zone z)::date>=d;
 if result is null or ((result-interval '1 second') at time zone z)::date>=d then raise exception 'Unproved civil-day boundary';end if;
 return result;
end $$;
create table public.prototype_time_off (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),
 starts_on date not null,ends_on date not null,timezone text not null,starts_at timestamptz not null,ends_at timestamptz not null,
 check(ends_on>=starts_on and ends_on-starts_on<366),check(ends_at>starts_at)
);
alter table public.prototype_time_off enable row level security;
alter table public.prototype_time_off force row level security;
revoke all on public.prototype_time_off from public,anon,authenticated,service_role;
create function public.prototype_time_off_create(first_day date,last_day date,z text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); first_instant timestamptz; after_last timestamptz; saved public.prototype_time_off; affected bigint;
begin
 if actor is null or first_day is null or last_day is null or last_day<first_day or last_day-first_day>=366 then raise exception 'Invalid authenticated time-off range';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,73118));
 first_instant:=public.prototype_day_boundary(first_day,z);after_last:=public.prototype_day_boundary(last_day+1,z);
 if after_last<=first_instant then raise exception 'This range contains no real local time';end if;
 insert into public.prototype_time_off(owner_id,starts_on,ends_on,timezone,starts_at,ends_at) values(actor,first_day,last_day,z,first_instant,after_last) returning * into saved;
 select count(*) into affected from public.workspace_scheduling_bookings where owner_id=actor and status='confirmed' and blocked_start<after_last and blocked_end>first_instant;
 return to_jsonb(saved)||jsonb_build_object('existingBookings',affected);
end $$;
create function public.prototype_time_off_guard() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,73118));
 if new.status='confirmed' and exists(select 1 from public.prototype_time_off t where t.owner_id=new.owner_id and new.blocked_start<t.ends_at and new.blocked_end>t.starts_at) then raise exception 'Prototype owner-wide time off';end if;
 return new;
end $$;
create trigger prototype_owner_time_off before insert on public.workspace_scheduling_bookings for each row execute function public.prototype_time_off_guard();
revoke all on function public.prototype_day_boundary(date,text),public.prototype_time_off_create(date,date,text),public.prototype_time_off_guard() from public,anon,authenticated,service_role;
-- Trusted definer-only read path: no browser/service direct table access.
grant select on public.prototype_time_off to postgres;
create policy prototype_time_off_internal_read on public.prototype_time_off for select to postgres using(true);
-- Patch only the disposable clone's two existing preview functions. A production
-- migration needs exact source-baseline guards and independent ACL/readback review.
do $$
declare signature text; definition text; needle text:='   and not exists(select 1 from public.workspace_scheduling_bookings b where b.owner_id=p.owner_id';
 insertion text:='   and not exists(select 1 from public.prototype_time_off t where t.owner_id=p.owner_id and s-make_interval(mins=>r.buffer)<t.ends_at and s+make_interval(mins=>r.duration+r.buffer)>t.starts_at)'||E'\n';
begin
 foreach signature in array array['public.public_booking_service(text,jsonb)','public.public_booking_window(text,date,timestamptz)'] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 or position('prototype_time_off' in definition)>0 then raise exception 'Unexpected prototype preview baseline';end if;
  execute replace(definition,needle,insertion||needle);
 end loop;
end $$;
-- Deliberately incomplete: idempotent time-off receipts, owner UI/API grants,
-- removal/version workflow, preview details or release migration.

commit;
