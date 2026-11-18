-- Local additive candidate. No legacy invoice/payment objects are changed.
begin;
create table public.workspace_invoice_drafts (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 client_id uuid not null, project_id uuid, document jsonb not null, total_minor bigint not null check(total_minor between 0 and 100000000000),
 version integer not null default 1, status text not null default 'draft' check(status in ('draft','issued','void')),
 number bigint, snapshot jsonb, created_at timestamptz not null default now(),
 unique(id,owner_id), unique(owner_id,number),
 foreign key(client_id,owner_id) references public.workspace_clients(id,owner_id),
 foreign key(project_id,owner_id) references public.workspace_projects(id,owner_id),
 check ((status='draft' and number is null and snapshot is null) or (status<>'draft' and number is not null and snapshot is not null))
);
create table public.workspace_invoice_schedules (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), client_id uuid not null, project_id uuid,
 document jsonb not null, frequency text not null check(frequency in ('weekly','monthly')), anchor date not null,
 paused boolean not null default false, version integer not null default 1,
 unique(id,owner_id), foreign key(client_id,owner_id) references public.workspace_clients(id,owner_id), foreign key(project_id,owner_id) references public.workspace_projects(id,owner_id)
);
create table public.workspace_invoice_occurrences (
 owner_id uuid not null references auth.users(id), schedule_id uuid not null, occurrence date not null, invoice_id uuid not null,
 primary key(owner_id,schedule_id,occurrence), foreign key(schedule_id,owner_id) references public.workspace_invoice_schedules(id,owner_id), foreign key(invoice_id,owner_id) references public.workspace_invoice_drafts(id,owner_id)
);
create table public.workspace_invoice_audit (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), invoice_id uuid not null,
 action text not null check(action in ('issued','void')), reason text not null, created_at timestamptz not null default now(),
 foreign key(invoice_id,owner_id) references public.workspace_invoice_drafts(id,owner_id)
);
create table public.workspace_invoice_counters (owner_id uuid primary key references auth.users(id), last_number bigint not null default 0);
create table public.workspace_invoice_operations (owner_id uuid not null references auth.users(id), operation_id uuid not null, request jsonb not null, result jsonb not null, primary key(owner_id,operation_id));
-- An owner-wide manual allowance, not cash, prepaid funding or invoice settlement.
create table public.workspace_invoice_allowances (owner_id uuid not null references auth.users(id), currency text not null, balance_minor bigint not null default 0 check(balance_minor between 0 and 100000000000), primary key(owner_id,currency));
create table public.workspace_invoice_allowance_entries (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), currency text not null, amount_minor bigint not null,
 reason text not null check(length(btrim(reason)) between 1 and 500), created_at timestamptz not null default now(),
 foreign key(owner_id,currency) references public.workspace_invoice_allowances(owner_id,currency)
);
create function public.workspace_invoice_validate(d jsonb) returns bigint language plpgsql set search_path=public,pg_temp as $$
declare l jsonb; total bigint:=0; q bigint; rate bigint;
begin
 if jsonb_typeof(d)<>'object' or not(d ?& array['clientId','projectId','seller','currency','issueDate','dueDate','memo','lines']) or exists(select 1 from jsonb_each(d) where key<>'projectId' and value='null'::jsonb) or (d-array['clientId','projectId','seller','currency','issueDate','dueDate','memo','lines'])<>'{}'::jsonb then raise exception 'Invalid document'; end if;
 if jsonb_typeof(d->'seller')<>'string' or length(btrim(d->>'seller')) not between 1 and 1000 or jsonb_typeof(d->'memo')<>'string' or length(d->>'memo')>2000 or (d->>'currency') not in ('USD','EUR','GBP','CAD','AUD','JPY','KWD') then raise exception 'Invalid document'; end if;
 if (d->>'issueDate') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or (d->>'dueDate') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or (d->>'dueDate')::date<(d->>'issueDate')::date then raise exception 'Invalid dates'; end if;
 perform (d->>'clientId')::uuid; perform (d->>'projectId')::uuid;
 if jsonb_typeof(d->'lines')<>'array' or jsonb_array_length(d->'lines') not between 1 and 30 then raise exception 'Invalid lines'; end if;
 for l in select * from jsonb_array_elements(d->'lines') loop
 if jsonb_typeof(l)<>'object' or not(l ?& array['description','quantity','unitMinor']) or (l-array['description','quantity','unitMinor'])<>'{}'::jsonb or exists(select 1 from jsonb_each(l) where value='null'::jsonb) or jsonb_typeof(l->'description')<>'string' or length(btrim(l->>'description')) not between 1 and 300 or jsonb_typeof(l->'quantity')<>'number' or jsonb_typeof(l->'unitMinor')<>'number' or (l->>'quantity') !~ '^[0-9]+$' or (l->>'unitMinor') !~ '^[0-9]+$' then raise exception 'Invalid line'; end if;
 q:=(l->>'quantity')::bigint; rate:=(l->>'unitMinor')::bigint;
 if q not between 1 and 10000 or rate not between 0 and 100000000 then raise exception 'Invalid line bounds'; end if; total:=total+q*rate;
 end loop;
 if total>100000000000 then raise exception 'Total limit'; end if; return total;
end $$;
create function public.workspace_invoice_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_table_name in ('workspace_invoice_drafts','workspace_invoice_schedules') then
 if new.project_id is not null and not exists(select 1 from public.workspace_projects where id=new.project_id and owner_id=new.owner_id and client_id=new.client_id) then raise exception 'Project/client mismatch'; end if;
 if (new.document->>'clientId')::uuid is distinct from new.client_id or (new.document->>'projectId')::uuid is distinct from new.project_id then raise exception 'Document relation mismatch'; end if;
 perform public.workspace_invoice_validate(new.document);
 if tg_table_name='workspace_invoice_drafts' then if new.total_minor<>public.workspace_invoice_validate(new.document) then raise exception 'Total mismatch'; end if; end if;
 end if;
 if tg_op='UPDATE' then
 if new.id<>old.id or new.owner_id<>old.owner_id then raise exception 'Immutable identity'; end if;
 if tg_table_name='workspace_invoice_drafts' then
 if old.status<>'draft' and (new.document is distinct from old.document or new.snapshot is distinct from old.snapshot or new.number is distinct from old.number or new.total_minor<>old.total_minor or new.client_id<>old.client_id or new.project_id is distinct from old.project_id or new.created_at<>old.created_at or new.status<>'void' or old.status='void') then raise exception 'Issued snapshot immutable'; end if; end if;
 end if; return new;
end $$;
create trigger workspace_invoice_guard before insert or update on public.workspace_invoice_drafts for each row execute function public.workspace_invoice_guard();
create trigger workspace_invoice_schedule_guard before insert or update on public.workspace_invoice_schedules for each row execute function public.workspace_invoice_guard();
-- Prevent foundation project reassignment from silently breaking invoice relations.
create function public.workspace_invoice_project_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin
 if new.client_id is distinct from old.client_id and (exists(select 1 from public.workspace_invoice_drafts where project_id=old.id and owner_id=old.owner_id) or exists(select 1 from public.workspace_invoice_schedules where project_id=old.id and owner_id=old.owner_id)) then raise exception 'Project has invoice relations'; end if; return new; end $$;
create trigger workspace_invoice_project_guard before update on public.workspace_projects for each row execute function public.workspace_invoice_project_guard();
create function public.workspace_invoice_mutate(p jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); op uuid; a text:=p->>'action'; allowed text[]; prior public.workspace_invoice_operations; inv public.workspace_invoice_drafts; sched public.workspace_invoice_schedules; d jsonb; t bigint; n bigint; result jsonb; v_occurrence date; target date; v_currency text; amount bigint;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if (p->>'expectedActorId')::uuid is distinct from actor then raise exception 'Actor changed' using errcode='40001'; end if;
 allowed:=case a when 'create' then array['document'] when 'edit' then array['id','version','document'] when 'delete' then array['id','version'] when 'issue' then array['id','version','reviewedTotalMinor'] when 'void' then array['id','version','reason'] when 'schedule' then array['document','frequency','anchor'] when 'generate' then array['id','occurrence'] when 'pause' then array['id','version'] when 'resume' then array['id','version'] when 'allowance' then array['currency','amountMinor','reason'] else null end;
 if allowed is null or jsonb_typeof(p)<>'object' then raise exception 'Invalid action'; end if;
 allowed:=allowed||array['action','operationId','expectedActorId'];
 if not(p ?& allowed) or (p-allowed)<>'{}'::jsonb or exists(select 1 from jsonb_each(p) where value='null'::jsonb) then raise exception 'Invalid action fields'; end if;
 op:=(p->>'operationId')::uuid;
 -- One owner lock serializes numbers, allowance debits, dedupe and occurrence allocation.
 insert into public.workspace_invoice_counters(owner_id) values(actor) on conflict do nothing;
 perform 1 from public.workspace_invoice_counters where owner_id=actor for update;
 select * into prior from public.workspace_invoice_operations where owner_id=actor and operation_id=op;
 if found then if prior.request<>p then raise exception 'Operation reused with different request' using errcode='40001'; end if; return prior.result; end if;
 if p ? 'document' then d:=p->'document'; t:=public.workspace_invoice_validate(d); end if;
 if a in ('create','schedule') then
 if a='create' then insert into public.workspace_invoice_drafts(owner_id,client_id,project_id,document,total_minor) values(actor,(d->>'clientId')::uuid,(d->>'projectId')::uuid,d,t) returning * into inv;result:=to_jsonb(inv);
 else
 if (p->>'anchor') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid anchor'; end if;
 insert into public.workspace_invoice_schedules(owner_id,client_id,project_id,document,frequency,anchor) values(actor,(d->>'clientId')::uuid,(d->>'projectId')::uuid,d,p->>'frequency',(p->>'anchor')::date) returning * into sched; result:=to_jsonb(sched);end if;
 elsif a in ('edit','delete','issue','void') then
 select * into inv from public.workspace_invoice_drafts where owner_id=actor and id=(p->>'id')::uuid for update;
 if not found then raise exception 'Not found' using errcode='P0002'; end if;
 if (p->>'version') !~ '^[1-9][0-9]*$' or inv.version<>(p->>'version')::integer then raise exception 'Version conflict' using errcode='40001'; end if;
 if a in ('edit','delete','issue') and inv.status<>'draft' then raise exception 'Draft required' using errcode='40001'; end if;
 if a='edit' then update public.workspace_invoice_drafts set document=d,total_minor=t,client_id=(d->>'clientId')::uuid,project_id=(d->>'projectId')::uuid,version=version+1 where id=inv.id returning * into inv;
 elsif a='delete' then delete from public.workspace_invoice_drafts where id=inv.id;
 elsif a='issue' then
 if (p->>'reviewedTotalMinor') !~ '^[0-9]+$' or (p->>'reviewedTotalMinor')::bigint<>inv.total_minor then raise exception 'Review changed total' using errcode='40001'; end if;
 update public.workspace_invoice_counters set last_number=last_number+1 where owner_id=actor returning last_number into n;
 select inv.document || jsonb_build_object('clientSnapshot',jsonb_build_object('name',c.name,'email',c.email),'totalMinor',inv.total_minor,'number',n,'issuedAt',now()) into d from public.workspace_clients c where c.id=inv.client_id and c.owner_id=actor;
 update public.workspace_invoice_drafts set status='issued',snapshot=d,number=n,version=version+1 where id=inv.id returning * into inv;
 insert into public.workspace_invoice_audit(owner_id,invoice_id,action,reason) values(actor,inv.id,'issued','Owner reviewed exact minor-unit total');
 else
 if inv.status<>'issued' or jsonb_typeof(p->'reason')<>'string' or length(btrim(p->>'reason')) not between 1 and 500 then raise exception 'Issued invoice and void reason required'; end if;
 update public.workspace_invoice_drafts set status='void',version=version+1 where id=inv.id returning * into inv;
 insert into public.workspace_invoice_audit(owner_id,invoice_id,action,reason) values(actor,inv.id,'void',p->>'reason');
 end if; result:=to_jsonb(inv);
 elsif a in ('pause','resume','generate') then
 select * into sched from public.workspace_invoice_schedules where id=(p->>'id')::uuid and owner_id=actor for update;
 if not found then raise exception 'Not found' using errcode='P0002'; end if;
 if a<>'generate' then
 if (p->>'version') !~ '^[1-9][0-9]*$' or sched.version<>(p->>'version')::integer then raise exception 'Version conflict' using errcode='40001'; end if;
 update public.workspace_invoice_schedules set paused=(a='pause'),version=version+1 where id=sched.id returning * into sched;result:=to_jsonb(sched);
 else
 if (p->>'occurrence') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid occurrence'; end if; v_occurrence:=(p->>'occurrence')::date;
 select i.* into inv from public.workspace_invoice_occurrences o join public.workspace_invoice_drafts i on i.id=o.invoice_id and i.owner_id=o.owner_id where o.owner_id=actor and o.schedule_id=sched.id and o.occurrence=v_occurrence;
 if not found then
 if sched.paused or v_occurrence<sched.anchor then raise exception 'Schedule paused or occurrence before anchor'; end if;
 if sched.frequency='weekly' then if (v_occurrence-sched.anchor)%7<>0 then raise exception 'Not a weekly occurrence'; end if;
 else target:=(date_trunc('month',v_occurrence)+ (least(extract(day from sched.anchor)::int,extract(day from date_trunc('month',v_occurrence)+interval '1 month - 1 day')::int)-1)*interval '1 day')::date; if target<>v_occurrence then raise exception 'Not a monthly occurrence'; end if;end if;
 d:=sched.document||jsonb_build_object('issueDate',v_occurrence::text,'dueDate',(v_occurrence+((sched.document->>'dueDate')::date-(sched.document->>'issueDate')::date))::text);t:=public.workspace_invoice_validate(d);
 insert into public.workspace_invoice_drafts(owner_id,client_id,project_id,document,total_minor) values(actor,sched.client_id,sched.project_id,d,t) returning * into inv;
 insert into public.workspace_invoice_occurrences values(actor,sched.id,v_occurrence,inv.id);
 end if;result:=to_jsonb(inv);end if;
 elsif a='allowance' then
 v_currency:=p->>'currency'; if v_currency not in ('USD','EUR','GBP','CAD','AUD','JPY','KWD') or jsonb_typeof(p->'amountMinor')<>'number' or (p->>'amountMinor') !~ '^-?[0-9]+$' or jsonb_typeof(p->'reason')<>'string' or length(btrim(p->>'reason')) not between 1 and 500 then raise exception 'Invalid allowance'; end if;
 amount:=(p->>'amountMinor')::bigint;if amount=0 or abs(amount)>100000000 then raise exception 'Invalid amount'; end if;
 insert into public.workspace_invoice_allowances(owner_id,currency) values(actor,v_currency) on conflict do nothing;
 update public.workspace_invoice_allowances set balance_minor=balance_minor+amount where owner_id=actor and workspace_invoice_allowances.currency=v_currency returning balance_minor into n;
 insert into public.workspace_invoice_allowance_entries(owner_id,currency,amount_minor,reason) values(actor,v_currency,amount,p->>'reason');result:=jsonb_build_object('currency',v_currency,'balance_minor',n);
 end if;
 insert into public.workspace_invoice_operations values(actor,op,p,result);return result;
end $$;
do $$ declare t text;begin
 foreach t in array array['workspace_invoice_drafts','workspace_invoice_schedules','workspace_invoice_occurrences','workspace_invoice_audit','workspace_invoice_counters','workspace_invoice_operations','workspace_invoice_allowances','workspace_invoice_allowance_entries'] loop
 execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
 end loop;end $$;
revoke all on function public.workspace_invoice_validate(jsonb),public.workspace_invoice_guard(),public.workspace_invoice_project_guard(),public.workspace_invoice_mutate(jsonb) from public,anon,authenticated;
grant execute on function public.workspace_invoice_mutate(jsonb) to authenticated;
commit;
