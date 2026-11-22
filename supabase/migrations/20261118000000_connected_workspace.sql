-- LOCAL CANDIDATE ONLY. Review deployed schema/grants before any authorized rollout.
begin;
create table public.workspace_clients (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check(length(btrim(name)) between 1 and 160),
 email text not null default '' check(length(email)<=254), notes text not null default '' check(length(notes)<=4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,owner_id)
);
create table public.workspace_stages (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check(length(btrim(name)) between 1 and 80),
 position integer not null default 0 check(position between 0 and 999),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,owner_id), unique(owner_id,name)
);
create table public.workspace_projects (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 client_id uuid not null, stage_id uuid not null,
 name text not null check(length(btrim(name)) between 1 and 160),
 notes text not null default '' check(length(notes)<=4000),
 status text not null default 'active' check(status in ('active','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,owner_id),
 foreign key(client_id,owner_id) references public.workspace_clients(id,owner_id) on delete restrict,
 foreign key(stage_id,owner_id) references public.workspace_stages(id,owner_id) on delete restrict
);
create table public.workspace_tasks (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), project_id uuid not null,
 title text not null check(length(btrim(title)) between 1 and 160),
 notes text not null default '' check(length(notes)<=4000), due_date date,
 status text not null default 'open' check(status in ('open','done')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(project_id,owner_id) references public.workspace_projects(id,owner_id) on delete restrict
);
-- A separate mapping preserves every existing agreement column and all legacy clients.
-- Composite FK prevents linking a foreign agreement even if its public signing page is readable.
alter table public.sow_documents add constraint workspace_agreement_owner_key unique(id,user_id);
create table public.workspace_agreements (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), project_id uuid not null,
 agreement_id uuid not null unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(project_id,owner_id) references public.workspace_projects(id,owner_id) on delete restrict,
 foreign key(agreement_id,owner_id) references public.sow_documents(id,user_id) on delete cascade
);
create index on public.workspace_clients(owner_id,created_at);
create index on public.workspace_stages(owner_id,position);
create index on public.workspace_projects(owner_id,client_id);
create index on public.workspace_projects(owner_id,stage_id);
create index on public.workspace_tasks(owner_id,project_id,due_date);
create index on public.workspace_agreements(owner_id,project_id);
create function public.guard_workspace_record() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and (new.owner_id is distinct from old.owner_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at) then
   raise exception 'Workspace identity is immutable';
 end if;
 new.updated_at=clock_timestamp();
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['workspace_clients','workspace_stages','workspace_projects','workspace_tasks','workspace_agreements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy owner_only on public.%I for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid())',t);
 execute format('create trigger workspace_record_guard before insert or update on public.%I for each row execute function public.guard_workspace_record()',t);
 end loop;
end $$;
revoke all on function public.guard_workspace_record() from public;
commit;
