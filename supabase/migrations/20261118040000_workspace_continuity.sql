-- Local additive candidate. Existing relationship keys and owner policies are unchanged.
begin;
do $$ declare t text; begin
 foreach t in array array['workspace_clients','workspace_stages','workspace_projects','workspace_tasks','workspace_agreements'] loop
  execute format('alter table public.%I add column version integer not null default 1 check(version > 0)',t);
  execute format('create index %I on public.%I(owner_id,id)',t || '_owner_cursor',t);
 end loop;
end $$;
-- Shared guard also advances versions for other authorized writers (e.g. CRM),
-- so a stale foundation editor cannot silently overwrite their changes.
create or replace function public.guard_workspace_record() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' then
  if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
   raise exception 'Workspace identity is immutable';
  end if;
  if new.version is distinct from old.version then raise exception 'Workspace version is server managed'; end if;
  new.version=old.version+1;
 else
  if new.version <> 1 then raise exception 'Workspace version must start at one'; end if;
 end if;
 new.updated_at=clock_timestamp();
 return new;
end $$;
revoke all on function public.guard_workspace_record() from public;
commit;
