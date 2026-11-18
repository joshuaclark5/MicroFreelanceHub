-- Bounded solo CRM. No provider sends, conversion, forecasts or revenue recognition.
begin;
create table public.workspace_crm_opportunities (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),client_id uuid not null,
 title text not null check(length(title) between 1 and 160 and title=btrim(title)),
 stage text not null check(stage in ('lead','discovery','proposal','won','lost')),
 amount_minor bigint check(amount_minor between 0 and 100000000000),currency text not null check(currency in ('USD','EUR','GBP','CAD','AUD','JPY','KWD')),
 expected_close date check(expected_close between '2000-01-01' and '2099-12-31'),follow_up date check(follow_up between '2000-01-01' and '2099-12-31'),
 reason text not null check(length(reason)<=1000 and (stage not in ('won','lost') or length(btrim(reason))>0)),
 version integer not null default 1 check(version>0),created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 unique(id,owner_id),foreign key(client_id,owner_id) references public.workspace_clients(id,owner_id) on delete restrict
);
create index workspace_crm_owner_list on public.workspace_crm_opportunities(owner_id,id);
create index workspace_crm_follow_up on public.workspace_crm_opportunities(owner_id,follow_up);
create table public.workspace_crm_activity (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),opportunity_id uuid not null,
 kind text not null check(kind in ('create','edit','note','import')),body text not null check(length(body)<=2000),
 before_record jsonb,after_record jsonb not null,created_at timestamptz not null default clock_timestamp(),
 foreign key(opportunity_id,owner_id) references public.workspace_crm_opportunities(id,owner_id) on delete restrict
);
create index workspace_crm_activity_list on public.workspace_crm_activity(owner_id,opportunity_id,created_at,id);
create table public.workspace_crm_operations(owner_id uuid not null references auth.users(id),operation_id uuid not null,request jsonb not null,result jsonb not null,created_at timestamptz not null default clock_timestamp(),primary key(owner_id,operation_id));
-- Full normalized JSON, not a collision-prone digest. Identical imported rows remain skipped after edits.
create table public.workspace_crm_import_rows(owner_id uuid not null references auth.users(id),record jsonb not null,opportunity_id uuid not null,primary key(owner_id,record),foreign key(opportunity_id,owner_id) references public.workspace_crm_opportunities(id,owner_id));
do $$declare t text;begin
 foreach t in array array['workspace_crm_opportunities','workspace_crm_activity','workspace_crm_operations','workspace_crm_import_rows'] loop
 execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
 end loop;
end $$;
create function public.workspace_crm_validate_record(r jsonb) returns void language plpgsql set search_path=pg_catalog,public as $$
declare k text; d text;
begin
 if jsonb_typeof(r) is distinct from 'object' then raise exception 'Invalid record' using errcode='22023';end if;
 if not(r ?& array['clientId','title','stage','amountMinor','currency','expectedClose','followUp','reason']) or (select count(*) from jsonb_object_keys(r))<>8 then raise exception 'Invalid fields' using errcode='22023';end if;
 foreach k in array array['clientId','title','stage','currency','reason'] loop
 if jsonb_typeof(r->k) is distinct from 'string' then raise exception 'String required' using errcode='22023';end if;end loop;
 if (r->>'clientId')!~*'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' or length(r->>'title') not between 1 and 160 or btrim(r->>'title')<>r->>'title' or length(btrim(r->>'title'))=0 or r->>'stage' not in ('lead','discovery','proposal','won','lost') or r->>'currency' not in ('USD','EUR','GBP','CAD','AUD','JPY','KWD') or length(r->>'reason')>1000 or (r->>'stage' in ('won','lost') and length(btrim(r->>'reason'))=0) then raise exception 'Invalid details' using errcode='22023';end if;
 if r->'amountMinor'<>'null'::jsonb and (jsonb_typeof(r->'amountMinor')<>'number' or (r->>'amountMinor')!~'^[0-9]+$' or (r->>'amountMinor')::numeric not between 0 and 100000000000) then raise exception 'Invalid amount' using errcode='22023';end if;
 foreach k in array array['expectedClose','followUp'] loop
 if r->k<>'null'::jsonb then d:=r->>k;if jsonb_typeof(r->k)<>'string' or d!~'^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or to_char(d::date,'YYYY-MM-DD')<>d then raise exception 'Invalid date' using errcode='22023';end if;end if;
 end loop;
end $$;
revoke all on function public.workspace_crm_validate_record(jsonb) from public,anon,authenticated;
create function public.workspace_crm_mutate(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();op uuid;a text;allowed text[];saved public.workspace_crm_operations;oldrow public.workspace_crm_opportunities;rowdata public.workspace_crm_opportunities;r jsonb;records jsonb;result jsonb;created integer:=0;skipped integer:=0;ids jsonb:='[]';
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid input' using errcode='22023';end if;
 if payload->>'expectedActorId' is distinct from actor::text then raise exception 'Account changed' using errcode='40001';end if;
 a:=payload->>'action';allowed:=array['action','operationId','expectedActorId'];
 if a='create' then allowed:=allowed||array['record'];elsif a='edit' then allowed:=allowed||array['id','expectedVersion','record'];elsif a='note' then allowed:=allowed||array['id','expectedVersion','body'];elsif a='import' then allowed:=allowed||array['records','duplicatePolicy'];else raise exception 'Invalid action' using errcode='22023';end if;
 if not(payload ?& allowed) or exists(select 1 from jsonb_object_keys(payload) k where not(k=any(allowed))) then raise exception 'Invalid fields' using errcode='22023';end if;
 if jsonb_typeof(payload->'operationId') is distinct from 'string' or payload->>'operationId' !~*'^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then raise exception 'Operation required' using errcode='22023';end if;op:=(payload->>'operationId')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,735));
 select * into saved from public.workspace_crm_operations where owner_id=actor and operation_id=op;
 if found then if saved.request<>payload then raise exception 'Operation changed' using errcode='40001';end if;return saved.result;end if;
 if a in ('edit','note') then
 if jsonb_typeof(payload->'expectedVersion') is distinct from 'number' or (payload->>'expectedVersion')!~'^[1-9][0-9]*$' or (payload->>'expectedVersion')::numeric>2147483647 or jsonb_typeof(payload->'id') is distinct from 'string' then raise exception 'Version and id required' using errcode='22023';end if;
 select * into oldrow from public.workspace_crm_opportunities where id=(payload->>'id')::uuid and owner_id=actor for update;
 if not found then raise exception 'Not found' using errcode='P0002';end if;
 if oldrow.version<>(payload->>'expectedVersion')::integer then raise exception 'Reload changed record' using errcode='40001';end if;
 end if;
 if a='note' then
 if jsonb_typeof(payload->'body') is distinct from 'string' or length(btrim(payload->>'body')) not between 1 and 2000 or length(payload->>'body')>2000 then raise exception 'Invalid note' using errcode='22023';end if;
 update public.workspace_crm_opportunities set version=version+1,updated_at=clock_timestamp() where id=oldrow.id returning * into rowdata;
 insert into public.workspace_crm_activity(owner_id,opportunity_id,kind,body,before_record,after_record) values(actor,rowdata.id,a,payload->>'body',to_jsonb(oldrow),to_jsonb(rowdata));result:=to_jsonb(rowdata);
 else
 if a='import' then
 if payload->>'duplicatePolicy' is distinct from 'skip-exact' or jsonb_typeof(payload->'records') is distinct from 'array' then raise exception 'Invalid import' using errcode='22023';end if;
 records:=payload->'records';if jsonb_array_length(records) not between 1 and 200 then raise exception 'Import limit' using errcode='22023';end if;
 else records:=jsonb_build_array(payload->'record');end if;
 for r in select value from jsonb_array_elements(records) loop
 perform public.workspace_crm_validate_record(r);
 perform 1 from public.workspace_clients where id=(r->>'clientId')::uuid and owner_id=actor for key share;
 if not found then raise exception 'Owned client required' using errcode='23503';end if;
 if a='import' and (exists(select 1 from public.workspace_crm_import_rows where owner_id=actor and record=r) or exists(select 1 from public.workspace_crm_opportunities o where o.owner_id=actor and o.client_id=(r->>'clientId')::uuid and o.title=r->>'title' and o.stage=r->>'stage' and o.amount_minor is not distinct from (r->>'amountMinor')::bigint and o.currency=r->>'currency' and o.expected_close is not distinct from (r->>'expectedClose')::date and o.follow_up is not distinct from (r->>'followUp')::date and o.reason=r->>'reason')) then skipped:=skipped+1;continue;end if;
 if a='edit' then
 update public.workspace_crm_opportunities set client_id=(r->>'clientId')::uuid,title=r->>'title',stage=r->>'stage',amount_minor=(r->>'amountMinor')::bigint,currency=r->>'currency',expected_close=(r->>'expectedClose')::date,follow_up=(r->>'followUp')::date,reason=r->>'reason',version=version+1,updated_at=clock_timestamp() where id=oldrow.id returning * into rowdata;
 else
 insert into public.workspace_crm_opportunities(owner_id,client_id,title,stage,amount_minor,currency,expected_close,follow_up,reason) values(actor,(r->>'clientId')::uuid,r->>'title',r->>'stage',(r->>'amountMinor')::bigint,r->>'currency',(r->>'expectedClose')::date,(r->>'followUp')::date,r->>'reason') returning * into rowdata;
 end if;
 insert into public.workspace_crm_activity(owner_id,opportunity_id,kind,body,before_record,after_record) values(actor,rowdata.id,a,'',case when a='edit' then to_jsonb(oldrow) else null end,to_jsonb(rowdata));
 if a='import' then insert into public.workspace_crm_import_rows(owner_id,record,opportunity_id) values(actor,r,rowdata.id);end if;
 created:=created+1;ids:=ids||jsonb_build_array(rowdata.id);
 end loop;
 result:=case when a='import' then jsonb_build_object('created',created,'skipped',skipped,'ids',ids) else to_jsonb(rowdata) end;
 end if;
 insert into public.workspace_crm_operations(owner_id,operation_id,request,result) values(actor,op,payload,result);return result;
end $$;
revoke all on function public.workspace_crm_mutate(jsonb) from public,anon;grant execute on function public.workspace_crm_mutate(jsonb) to authenticated;
commit;
