-- Additive owner-only client notes. Existing opportunity audit rows stay intact.
begin;
alter table public.workspace_crm_activity add column author_id uuid references auth.users(id), add column author_name text;
-- The original CRM was owner-only. Historical names were not recorded.
update public.workspace_crm_activity set author_id=owner_id;
create function public.workspace_activity_author() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or auth.uid()<>new.owner_id then raise exception 'Owner required' using errcode='42501';end if;
 new.author_id:=auth.uid();
 select left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''),nullif(btrim(raw_user_meta_data->>'name'),''),email,'Account owner'),160) into new.author_name from auth.users where id=auth.uid();
 return new;
end $$;
revoke all on function public.workspace_activity_author() from public,anon,authenticated;
create trigger workspace_crm_capture_author before insert on public.workspace_crm_activity for each row execute function public.workspace_activity_author();
create table public.workspace_client_notes(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 client_id uuid not null,
 body text not null check(length(btrim(body)) between 1 and 2000 and length(body)<=2000),
 author_id uuid not null references auth.users(id),
 author_name text not null,
 created_at timestamptz not null default clock_timestamp(),
 operation_id uuid not null,
 unique(owner_id,operation_id),
 foreign key(client_id,owner_id) references public.workspace_clients(id,owner_id) on delete restrict
);
create index workspace_client_notes_list on public.workspace_client_notes(owner_id,client_id,created_at,id);
alter table public.workspace_client_notes enable row level security;
alter table public.workspace_client_notes force row level security;
revoke all on public.workspace_client_notes from public,anon,authenticated;
grant select on public.workspace_client_notes to authenticated;
create policy owner_read on public.workspace_client_notes for select to authenticated using(owner_id=auth.uid());
create trigger workspace_client_note_author before insert on public.workspace_client_notes for each row execute function public.workspace_activity_author();
create function public.workspace_client_note(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); rowdata public.workspace_client_notes; client uuid; op uuid;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 if jsonb_typeof(payload) is distinct from 'object' or not(payload ?& array['clientId','body','operationId','expectedActorId']) or (select count(*) from jsonb_object_keys(payload))<>4 then raise exception 'Invalid fields' using errcode='22023';end if;
 if payload->>'expectedActorId' is distinct from actor::text then raise exception 'Account changed' using errcode='40001';end if;
 if jsonb_typeof(payload->'clientId') is distinct from 'string' or jsonb_typeof(payload->'operationId') is distinct from 'string' or payload->>'clientId'!~*'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' or payload->>'operationId'!~*'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' or jsonb_typeof(payload->'body') is distinct from 'string' or length(btrim(payload->>'body')) not between 1 and 2000 or length(payload->>'body')>2000 then raise exception 'Invalid note' using errcode='22023';end if;
 client:=(payload->>'clientId')::uuid;op:=(payload->>'operationId')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,736));
 select * into rowdata from public.workspace_client_notes where owner_id=actor and operation_id=op;
 if found then
 if rowdata.client_id<>client or rowdata.body<>payload->>'body' then raise exception 'Operation changed' using errcode='40001';end if;
 return to_jsonb(rowdata);end if;
 perform 1 from public.workspace_clients where id=client and owner_id=actor for key share;
 if not found then raise exception 'Client unavailable' using errcode='P0002';end if;
 insert into public.workspace_client_notes(owner_id,client_id,body,author_id,author_name,operation_id) values(actor,client,payload->>'body',actor,'',op) returning * into rowdata;
 return to_jsonb(rowdata);
end $$;
revoke all on function public.workspace_client_note(jsonb) from public,anon;
grant execute on function public.workspace_client_note(jsonb) to authenticated;
-- Invoker rights plus explicit owner constraints. Historical opportunity association
-- comes from each audit snapshot, not the opportunity's mutable current client.
create function public.workspace_client_timeline(client uuid) returns jsonb language sql stable security invoker set search_path=pg_catalog,public as $$
 with entries as (
 select id,'client_note'::text source,'note'::text kind,body,created_at,author_id,author_name,null::uuid opportunity_id,null::text title from public.workspace_client_notes where owner_id=auth.uid() and client_id=client
 union all
 select id,'opportunity'::text,kind,body,created_at,author_id,author_name,opportunity_id,after_record->>'title' from public.workspace_crm_activity where owner_id=auth.uid() and after_record->>'client_id'=client::text
 ), bounded as (select * from entries order by created_at desc,source,id limit 201)
 select jsonb_build_object('records',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc,source,id) from (select * from bounded order by created_at desc,source,id limit 200)e),'[]'::jsonb),'truncated',(select count(*)>200 from bounded));
$$;
revoke all on function public.workspace_client_timeline(uuid) from public,anon;
grant execute on function public.workspace_client_timeline(uuid) to authenticated;
commit;
