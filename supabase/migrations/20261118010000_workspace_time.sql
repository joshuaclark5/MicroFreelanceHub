-- Local candidate. Owner-only time; no invoicing, payroll or team approval.
begin;
create table public.workspace_time_entries (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 project_id uuid not null, description text not null check(length(description)<=2000),
 source text not null check(source in ('manual','timer')),
 started_at timestamptz not null, stopped_at timestamptz,
 seconds integer check(seconds between 1 and 2678400),
 billable boolean not null, rate_minor integer not null check(rate_minor between 0 and 100000000),
 currency text not null check(currency in ('USD','EUR','GBP','CAD','AUD','JPY','KWD')),
 review_status text not null default 'draft' check(review_status in ('draft','self_approved')),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(),
 unique(id,owner_id), foreign key(project_id,owner_id) references public.workspace_projects(id,owner_id) on delete restrict,
 check ((source='timer' and stopped_at is null and seconds is null) or (stopped_at is not null and stopped_at>started_at and seconds is not null)),
 check(stopped_at is null or stopped_at=started_at+seconds*interval '1 second')
);
create unique index workspace_time_one_running on public.workspace_time_entries(owner_id) where stopped_at is null;
create index workspace_time_filter on public.workspace_time_entries(owner_id,started_at,id);
create table public.workspace_time_audit (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), entry_id uuid not null,
 action text not null, before_record jsonb, after_record jsonb not null,
 created_at timestamptz not null default clock_timestamp(),
 foreign key(entry_id,owner_id) references public.workspace_time_entries(id,owner_id) on delete restrict
);
create table public.workspace_time_operations (
 owner_id uuid not null references auth.users(id), operation_id uuid not null,
 request jsonb not null, result jsonb not null, created_at timestamptz not null default clock_timestamp(),
 primary key(owner_id,operation_id)
);
do $$ declare t text; begin
 foreach t in array array['workspace_time_entries','workspace_time_audit','workspace_time_operations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using (owner_id=auth.uid())',t);
 end loop;
end $$;
-- Only this fixed-path, closed-input transaction may mutate protected records.
create function public.workspace_time_mutate(payload jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 actor uuid:=auth.uid(); op uuid; action text; allowed text[]; oldrow public.workspace_time_entries;
 rowdata public.workspace_time_entries; saved public.workspace_time_operations;
 project uuid; duration integer; anchor timestamptz; result jsonb;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid input' using errcode='22023'; end if;
 if payload->>'expectedActorId' is distinct from actor::text then raise exception 'Account changed' using errcode='40001'; end if;
 action:=payload->>'action';
 if action in ('manual','start') then
 allowed:=array['action','operationId','expectedActorId','projectId','description','billable','rateMinor','currency'];
 if action='manual' then allowed:=allowed||array['startedAt','seconds']; end if;
 elsif action='edit' then allowed:=array['action','operationId','expectedActorId','id','expectedVersion','description','startedAt','seconds','billable'];
 elsif action in ('stop','approve') then allowed:=array['action','operationId','expectedActorId','id','expectedVersion'];
 else raise exception 'Invalid action' using errcode='22023'; end if;
 if exists(select 1 from jsonb_object_keys(payload) k where not(k=any(allowed))) or not(payload ?& allowed) then
 raise exception 'Unsupported or missing fields' using errcode='22023'; end if;
 if jsonb_typeof(payload->'operationId') is distinct from 'string' then raise exception 'Operation required' using errcode='22023'; end if;
 op:=(payload->>'operationId')::uuid;
 if op is null then raise exception 'Operation required' using errcode='22023'; end if;
 -- Serializes owner mutations, duplicate delivery, start/stop and optimistic edits.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,731));
 select * into saved from public.workspace_time_operations where owner_id=actor and operation_id=op;
 if found then
 if saved.request<>payload then raise exception 'Operation reused with different details' using errcode='40001'; end if;
 return saved.result;
 end if;
 if action in ('manual','start','edit') then
 if jsonb_typeof(payload->'description') is distinct from 'string' or length(payload->>'description')>2000 or jsonb_typeof(payload->'billable') is distinct from 'boolean' then raise exception 'Invalid details' using errcode='22023'; end if;
 end if;
 if action in ('manual','edit') then
 if jsonb_typeof(payload->'seconds') is distinct from 'number' or (payload->>'seconds')!~'^[0-9]+$' or (payload->>'seconds')::numeric not between 1 and 2678400 then raise exception 'Duration must be 1 second to 31 days' using errcode='22023'; end if;
 duration:=(payload->>'seconds')::integer;
 if jsonb_typeof(payload->'startedAt') is distinct from 'string' or (payload->>'startedAt')!~'^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' then raise exception 'UTC whole-second date required' using errcode='22023'; end if;
 anchor:=(payload->>'startedAt')::timestamptz;
 if anchor+duration*interval '1 second'>clock_timestamp() then raise exception 'Completed time cannot end in future' using errcode='22023'; end if;
 end if;
 if action in ('manual','start') then
 if jsonb_typeof(payload->'rateMinor') is distinct from 'number' or (payload->>'rateMinor')!~'^[0-9]+$' or (payload->>'rateMinor')::numeric not between 0 and 100000000 or jsonb_typeof(payload->'currency') is distinct from 'string' or (payload->>'currency') not in ('USD','EUR','GBP','CAD','AUD','JPY','KWD') then raise exception 'Invalid rate snapshot' using errcode='22023'; end if;
 project:=(payload->>'projectId')::uuid;
 perform 1 from public.workspace_projects where id=project and owner_id=actor and status='active' for share;
 if not found then raise exception 'Active owned project required' using errcode='23503'; end if;
 if action='start' then anchor:=date_trunc('second',clock_timestamp()); end if;
 insert into public.workspace_time_entries(owner_id,project_id,description,source,started_at,stopped_at,seconds,billable,rate_minor,currency)
 values(actor,project,payload->>'description',case when action='start' then 'timer' else 'manual' end,anchor,
 case when action='manual' then anchor+duration*interval '1 second' else null end,duration,(payload->>'billable')::boolean,(payload->>'rateMinor')::integer,payload->>'currency') returning * into rowdata;
 else
 if jsonb_typeof(payload->'expectedVersion') is distinct from 'number' or (payload->>'expectedVersion')!~'^[1-9][0-9]*$' then raise exception 'Version required' using errcode='22023'; end if;
 select * into oldrow from public.workspace_time_entries where id=(payload->>'id')::uuid and owner_id=actor for update;
 if not found then raise exception 'Entry not found' using errcode='P0002'; end if;
 if action='stop' and oldrow.source='timer' and oldrow.stopped_at is not null then
 rowdata:=oldrow; -- semantic idempotency, even with a new stop operation
 else
 if oldrow.version<>(payload->>'expectedVersion')::numeric then raise exception 'Entry changed; reload' using errcode='40001'; end if;
 if action='stop' then
 if oldrow.source<>'timer' then raise exception 'Not a timer' using errcode='22023'; end if;
 -- Cap abandoned timers at the documented 31-day bound; preserve the server start.
 duration:=least(2678400,greatest(1,floor(extract(epoch from clock_timestamp()-oldrow.started_at))))::integer;
 update public.workspace_time_entries set seconds=duration,stopped_at=started_at+duration*interval '1 second',version=version+1,updated_at=clock_timestamp() where id=oldrow.id returning * into rowdata;
 elsif action='edit' then
 -- Rate, currency, source, owner and project are immutable snapshots. Editing reopens review.
 if oldrow.stopped_at is null then raise exception 'Stop timer before editing' using errcode='22023'; end if;
 update public.workspace_time_entries set description=payload->>'description',started_at=anchor,seconds=duration,stopped_at=anchor+duration*interval '1 second',billable=(payload->>'billable')::boolean,review_status='draft',version=version+1,updated_at=clock_timestamp() where id=oldrow.id returning * into rowdata;
 else
 if oldrow.stopped_at is null then raise exception 'Stop timer before approval' using errcode='22023'; end if;
 update public.workspace_time_entries set review_status='self_approved',version=version+1,updated_at=clock_timestamp() where id=oldrow.id returning * into rowdata;
 end if;
 end if;
 end if;
 result:=to_jsonb(rowdata);
 if oldrow.id is null or oldrow.version<>rowdata.version then
 insert into public.workspace_time_audit(owner_id,entry_id,action,before_record,after_record) values(actor,rowdata.id,action,case when oldrow.id is null then null else to_jsonb(oldrow) end,result);
 end if;
 insert into public.workspace_time_operations(owner_id,operation_id,request,result) values(actor,op,payload,result);
 return result;
end $$;
revoke all on function public.workspace_time_mutate(jsonb) from public,anon;
grant execute on function public.workspace_time_mutate(jsonb) to authenticated;
commit;
