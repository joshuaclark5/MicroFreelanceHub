-- Separate shared planning only. No foreign keys to solo business records.
begin;
create table public.workspace_resource_projects(
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.team_workspaces(id),
 name text not null check(length(name) between 1 and 120 and name=btrim(name) and length(btrim(name))>0),version integer not null default 1 check(version>0),unique(workspace_id,id)
);
create table public.workspace_resource_capacity(
 workspace_id uuid not null,user_id uuid not null,week date not null check(week between '2000-01-01' and '2099-12-31' and extract(isodow from week)=1),
 minutes integer not null check(minutes between 0 and 10080),version integer not null default 1 check(version>0),primary key(workspace_id,user_id,week),
 foreign key(workspace_id,user_id) references public.team_members(workspace_id,user_id) on delete cascade
);
create table public.workspace_resource_assignments(
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null,project_id uuid not null,user_id uuid,
 week date not null check(week between '2000-01-01' and '2099-12-31' and extract(isodow from week)=1),minutes integer not null check(minutes between 1 and 10080),version integer not null default 1 check(version>0),
 foreign key(workspace_id,project_id) references public.workspace_resource_projects(workspace_id,id),
 foreign key(workspace_id,user_id) references public.team_members(workspace_id,user_id) on delete no action
);
create index resource_assignment_week on public.workspace_resource_assignments(workspace_id,week);
create table public.workspace_resource_operations(workspace_id uuid not null references public.team_workspaces(id),actor_id uuid not null references auth.users(id),operation_id uuid not null,request jsonb not null,result jsonb not null,primary key(workspace_id,actor_id,operation_id));
-- The membership mutator already holds this workspace row lock. Also lock for any privileged membership deletion.
-- Preserve work, detach only the removed person, and invalidate stale assignment editors.
create function public.resource_member_removed() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 perform 1 from public.team_workspaces where id=old.workspace_id for update;
 update public.workspace_resource_assignments set user_id=null,version=version+1 where workspace_id=old.workspace_id and user_id=old.user_id;
 return old;
end $$;
revoke all on function public.resource_member_removed() from public,anon,authenticated;
create trigger resource_member_removed before delete on public.team_members for each row execute function public.resource_member_removed();
do $$declare t text;begin
 foreach t in array array['workspace_resource_projects','workspace_resource_capacity','workspace_resource_assignments','workspace_resource_operations'] loop
 execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 if t='workspace_resource_operations' then execute format('create policy resource_read on public.%I for select to authenticated using(actor_id=auth.uid() and public.team_role(workspace_id) in (''owner'',''admin''))',t);
 else execute format('create policy resource_read on public.%I for select to authenticated using(public.team_role(workspace_id) is not null)',t);end if;
 end loop;
end $$;
create function public.workspace_resources_snapshot(expected_actor_id uuid,selected_workspace_id uuid,selected_week date) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();r text;w public.team_workspaces;ps jsonb;cs jsonb;ass jsonb;ms jsonb;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 if expected_actor_id is distinct from actor then raise exception 'Account changed' using errcode='40001';end if;
 if selected_week is null or selected_week not between '2000-01-01' and '2099-12-31' or extract(isodow from selected_week)<>1 then raise exception 'Monday required' using errcode='22023';end if;
 select * into w from public.team_workspaces where id=selected_workspace_id for share;
 r:=public.team_role(selected_workspace_id);if r is null then raise exception 'Membership required' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]') into ps from (select * from public.workspace_resource_projects where workspace_id=selected_workspace_id order by id limit 501)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.user_id),'[]') into cs from (select * from public.workspace_resource_capacity where workspace_id=selected_workspace_id and week=selected_week limit 1001)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]') into ass from (select * from public.workspace_resource_assignments where workspace_id=selected_workspace_id and week=selected_week order by id limit 2001)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.user_id),'[]') into ms from (select user_id,role from public.team_members where workspace_id=selected_workspace_id limit 1001)x;
 if jsonb_array_length(ps)>500 or jsonb_array_length(cs)>1000 or jsonb_array_length(ass)>2000 or jsonb_array_length(ms)>1000 then raise exception 'Planning view limit exceeded' using errcode='54000';end if;
 return jsonb_build_object('actorId',actor,'workspaceId',selected_workspace_id,'name',w.name,'role',r,'week',selected_week,'projects',ps,'capacities',cs,'assignments',ass,'members',ms);
end $$;
revoke all on function public.workspace_resources_snapshot(uuid,uuid,date) from public,anon;grant execute on function public.workspace_resources_snapshot(uuid,uuid,date) to authenticated;
create function public.workspace_resources_mutate(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();w uuid;op uuid;a text;k text;allowed text[];saved public.workspace_resource_operations;result jsonb;v integer;n integer;u uuid;d date;oldp public.workspace_resource_projects;olda public.workspace_resource_assignments;oldc public.workspace_resource_capacity;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 if jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>4096 then raise exception 'Invalid input' using errcode='22023';end if;
 if payload->>'expectedActorId' is distinct from actor::text then raise exception 'Account changed' using errcode='40001';end if;
 a:=payload->>'action';allowed:=array['action','operationId','expectedActorId','workspaceId'];
 case a when 'project' then allowed:=allowed||array['name'];when 'rename' then allowed:=allowed||array['id','expectedVersion','name'];when 'capacity' then allowed:=allowed||array['userId','week','minutes','expectedVersion'];when 'assign' then allowed:=allowed||array['projectId','userId','week','minutes'];when 'reassign' then allowed:=allowed||array['id','expectedVersion','userId','minutes'];when 'removeAssignment' then allowed:=allowed||array['id','expectedVersion'];else raise exception 'Invalid action' using errcode='22023';end case;
 if not(payload ?& allowed) or exists(select 1 from jsonb_object_keys(payload) as keys(key) where not(key=any(allowed))) then raise exception 'Invalid fields' using errcode='22023';end if;
 foreach k in array array['workspaceId','operationId','id','projectId','userId'] loop
 if payload ? k and not(k='userId' and payload->k='null'::jsonb and a<>'capacity') then
 if jsonb_typeof(payload->k) is distinct from 'string' or payload->>k !~*'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then raise exception 'Invalid identifier' using errcode='22023';end if;end if;end loop;
 w:=(payload->>'workspaceId')::uuid;op:=(payload->>'operationId')::uuid;
 -- Same lock as team_mutate. Authorization is checked AFTER waiting and BEFORE receipt replay.
 perform 1 from public.team_workspaces where id=w for update;
 if public.team_role(w) is null or public.team_role(w) not in ('owner','admin') then raise exception 'Planning editor required' using errcode='42501';end if;
 select * into saved from public.workspace_resource_operations where workspace_id=w and actor_id=actor and operation_id=op;
 if found then if saved.request<>payload then raise exception 'Operation changed' using errcode='40001';end if;return saved.result;end if;
 if payload ? 'expectedVersion' then if jsonb_typeof(payload->'expectedVersion') is distinct from 'number' or payload->>'expectedVersion' !~'^[0-9]+$' or (payload->>'expectedVersion')::numeric not between (case when a='capacity' then 0 else 1 end) and 2147483647 then raise exception 'Invalid version' using errcode='22023';end if;v:=(payload->>'expectedVersion')::integer;end if;
 if payload ? 'minutes' then if jsonb_typeof(payload->'minutes') is distinct from 'number' or payload->>'minutes' !~'^[0-9]+$' or (payload->>'minutes')::numeric not between (case when a='capacity' then 0 else 1 end) and 10080 then raise exception 'Invalid minutes' using errcode='22023';end if;n:=(payload->>'minutes')::integer;end if;
 if payload ? 'name' and (jsonb_typeof(payload->'name') is distinct from 'string' or length(payload->>'name') not between 1 and 120 or btrim(payload->>'name')<>payload->>'name' or length(btrim(payload->>'name'))=0) then raise exception 'Invalid name' using errcode='22023';end if;
 if payload ? 'week' then if jsonb_typeof(payload->'week') is distinct from 'string' or payload->>'week' !~'^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid week' using errcode='22023';end if;d:=(payload->>'week')::date;if to_char(d,'YYYY-MM-DD')<>payload->>'week' or extract(isodow from d)<>1 then raise exception 'Monday required' using errcode='22023';end if;end if;
 if payload ? 'userId' then u:=(payload->>'userId')::uuid;if u is not null then perform 1 from public.team_members where workspace_id=w and user_id=u for key share;if not found then raise exception 'Current member required' using errcode='23503';end if;end if;end if;
 if a='project' then
 if (select count(*) from public.workspace_resource_projects where workspace_id=w)>=500 then raise exception 'Project limit' using errcode='22023';end if;
 insert into public.workspace_resource_projects(workspace_id,name) values(w,payload->>'name') returning to_jsonb(workspace_resource_projects.*) into result;
 elsif a='rename' then
 select * into oldp from public.workspace_resource_projects where workspace_id=w and id=(payload->>'id')::uuid;if not found then raise exception 'Not found' using errcode='P0002';end if;if oldp.version<>v then raise exception 'Stale project' using errcode='40001';end if;
 update public.workspace_resource_projects set name=payload->>'name',version=version+1 where id=oldp.id returning to_jsonb(workspace_resource_projects.*) into result;
 elsif a='capacity' then
 select * into oldc from public.workspace_resource_capacity where workspace_id=w and user_id=u and week=d;
 if coalesce(oldc.version,0)<>v then raise exception 'Stale capacity' using errcode='40001';end if;
 insert into public.workspace_resource_capacity(workspace_id,user_id,week,minutes) values(w,u,d,n) on conflict(workspace_id,user_id,week) do update set minutes=excluded.minutes,version=workspace_resource_capacity.version+1 returning to_jsonb(workspace_resource_capacity.*) into result;
 elsif a='assign' then
 if (select count(*) from public.workspace_resource_assignments where workspace_id=w and week=d)>=2000 then raise exception 'Assignment limit' using errcode='22023';end if;
 insert into public.workspace_resource_assignments(workspace_id,project_id,user_id,week,minutes) values(w,(payload->>'projectId')::uuid,u,d,n) returning to_jsonb(workspace_resource_assignments.*) into result;
 else
 select * into olda from public.workspace_resource_assignments where workspace_id=w and id=(payload->>'id')::uuid;if not found then raise exception 'Not found' using errcode='P0002';end if;if olda.version<>v then raise exception 'Stale assignment' using errcode='40001';end if;
 if a='removeAssignment' then delete from public.workspace_resource_assignments where id=olda.id;result:=jsonb_build_object('id',olda.id,'removed',true);
 else update public.workspace_resource_assignments set user_id=u,minutes=n,version=version+1 where id=olda.id returning to_jsonb(workspace_resource_assignments.*) into result;end if;
 end if;
 insert into public.workspace_resource_operations(workspace_id,actor_id,operation_id,request,result) values(w,actor,op,payload,result);return result;
end $$;
revoke all on function public.workspace_resources_mutate(jsonb) from public,anon;grant execute on function public.workspace_resources_mutate(jsonb) to authenticated;
commit;
