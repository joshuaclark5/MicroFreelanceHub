-- Run after client_timeline; edits preserve the original note and all revisions.
begin;
alter table public.workspace_clients add column phone text not null default '' check(length(phone)<=80);
create table public.workspace_client_note_edits (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 note_id uuid not null references public.workspace_client_notes(id),
 body text not null check(length(btrim(body)) between 1 and 2000 and length(body)<=2000),
 version integer not null check(version>1),
 author_id uuid not null references auth.users(id), author_name text not null,
 created_at timestamptz not null default clock_timestamp(),
 operation_id uuid not null, unique(owner_id,operation_id), unique(note_id,version)
);
alter table public.workspace_client_note_edits enable row level security;
alter table public.workspace_client_note_edits force row level security;
revoke all on public.workspace_client_note_edits from public,anon,authenticated;
grant select on public.workspace_client_note_edits to authenticated;
create policy owner_read on public.workspace_client_note_edits for select to authenticated using(owner_id=auth.uid());
create trigger workspace_note_edit_author before insert on public.workspace_client_note_edits for each row execute function public.workspace_activity_author();
create function public.workspace_client_note_edit(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); original public.workspace_client_notes; previous public.workspace_client_note_edits; current_version integer;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 if jsonb_typeof(payload) is distinct from 'object' or not(payload ?& array['clientId','noteId','body','expectedVersion','operationId','expectedActorId']) or (select count(*) from jsonb_object_keys(payload))<>6 then raise exception 'Invalid fields' using errcode='22023';end if;
 if payload->>'expectedActorId' is distinct from actor::text then raise exception 'Account changed' using errcode='40001';end if;
 if jsonb_typeof(payload->'body') is distinct from 'string' or length(btrim(payload->>'body')) not between 1 and 2000 or length(payload->>'body')>2000 or jsonb_typeof(payload->'expectedVersion') is distinct from 'number' or payload->>'expectedVersion' !~ '^[1-9][0-9]{0,8}$' or payload->>'operationId' is null then raise exception 'Invalid edit' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,736));
 select * into original from public.workspace_client_notes where id=(payload->>'noteId')::uuid and client_id=(payload->>'clientId')::uuid and owner_id=actor for update;
 if not found then raise exception 'Note unavailable' using errcode='P0002';end if;
 select * into previous from public.workspace_client_note_edits where owner_id=actor and operation_id=(payload->>'operationId')::uuid;
 if found then
 if previous.note_id<>original.id or previous.body<>payload->>'body' or previous.version<>(payload->>'expectedVersion')::integer+1 then raise exception 'Operation changed' using errcode='40001';end if;
 return to_jsonb(previous);end if;
 select coalesce(max(version),1) into current_version from public.workspace_client_note_edits where note_id=original.id and owner_id=actor;
 if current_version<>(payload->>'expectedVersion')::integer then raise exception 'Note changed; reload before editing' using errcode='40001';end if;
 insert into public.workspace_client_note_edits(owner_id,note_id,body,version,author_id,author_name,operation_id) values(actor,original.id,payload->>'body',current_version+1,actor,'',(payload->>'operationId')::uuid) returning * into previous;
 return to_jsonb(previous);
end $$;
revoke all on function public.workspace_client_note_edit(jsonb) from public,anon;
grant execute on function public.workspace_client_note_edit(jsonb) to authenticated;
create or replace function public.workspace_client_timeline(client uuid) returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 with entries as (
 select n.id,'client_note'::text source,'note'::text kind,coalesce(e.body,n.body) body,n.created_at,n.author_id,n.author_name,null::uuid opportunity_id,null::text title,coalesce(e.version,1) version,e.created_at edited_at,
 (select jsonb_agg(jsonb_build_object('body',h.body,'version',h.version,'created_at',h.created_at,'author_name',h.author_name) order by h.version desc) from (
 select n.body,1 version,n.created_at,n.author_name union all select body,version,created_at,author_name from public.workspace_client_note_edits where note_id=n.id and owner_id=auth.uid()) h) revisions
 from public.workspace_client_notes n left join lateral (select body,version,created_at from public.workspace_client_note_edits where note_id=n.id and owner_id=auth.uid() order by version desc limit 1)e on true where n.owner_id=auth.uid() and n.client_id=client
 union all
 select id,'opportunity',kind,body,created_at,author_id,author_name,opportunity_id,after_record->>'title',null::integer,null::timestamptz,null::jsonb from public.workspace_crm_activity where owner_id=auth.uid() and after_record->>'client_id'=client::text
 ), bounded as (select * from entries order by created_at desc,source,id limit 201)
 select jsonb_build_object('records',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc,source,id) from (select * from bounded order by created_at desc,source,id limit 200)e),'[]'::jsonb),'truncated',(select count(*)>200 from bounded));
$$;
commit;
