-- Make helper privileges independent of hosted default privileges.
-- Invoked by postgres-owned security-definer functions, not client roles.
begin;
do $$ begin
 if not exists(select 1 from pg_proc where oid='public.workspace_recurrence_valid(jsonb)'::regprocedure and md5(prosrc)='8a4db1fa1c9cdd131e866b4de089862f') or not exists(select 1 from pg_proc where oid='public.workspace_availability_matches(integer,jsonb,date)'::regprocedure and md5(prosrc)='3dcd22acbb1b53bca59ea88c83d9a628') then raise exception 'Recurrence helper source changed; review grants';end if;
end $$;
revoke all on function public.workspace_recurrence_valid(jsonb) from public,anon,authenticated,service_role;
revoke all on function public.workspace_availability_matches(integer,jsonb,date) from public,anon,authenticated,service_role;
commit;
