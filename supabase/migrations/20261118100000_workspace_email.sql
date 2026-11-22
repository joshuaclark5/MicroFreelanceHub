-- Additive, operator-applied only. No scheduler, trigger sends, or activation.
begin;
create table public.workspace_email_outbox (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id), operation_id uuid not null,
 template text not null check(template in ('team-invitation.v1','booking-reminder.v1')), aggregate_id uuid not null,
 workspace_id uuid references public.team_workspaces(id), recipient text not null check(length(recipient)<=254 and recipient=lower(recipient) and recipient ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+([.][A-Za-z0-9-]+)+$'),
 payload_hash text not null check(payload_hash ~ '^[0-9a-f]{64}$'), token_hash text, token_ciphertext text,
 consent_version text not null check(consent_version='transactional-email.v1'), consented_at timestamptz not null default clock_timestamp(),
 status text not null default 'queued' check(status in ('queued','leased','sending','retry','accepted','delivered','bounced','canceled','unknown','failed')),
 attempts integer not null default 0 check(attempts between 0 and 5), next_attempt_at timestamptz not null default clock_timestamp(), lease_id uuid, lease_until timestamptz,
 provider_id text unique, cancel_requested boolean not null default false, evidence_at timestamptz,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), version integer not null default 1,
 unique(actor_id,operation_id), unique(template,aggregate_id),
 check ((template='team-invitation.v1' and workspace_id is not null and token_hash ~ '^[0-9a-f]{64}$') or (template='booking-reminder.v1' and workspace_id is null and token_hash is null and token_ciphertext is null))
);
create index workspace_email_due on public.workspace_email_outbox(next_attempt_at) where status in ('queued','retry');
alter table public.workspace_email_outbox enable row level security;
alter table public.workspace_email_outbox force row level security;
revoke all on public.workspace_email_outbox from public,anon,authenticated;
-- No client table grants, even SELECT: ciphertext and provider identifiers stay server-only.
create function public.workspace_email_authorized(e public.workspace_email_outbox) returns boolean language sql volatile security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from auth.users u where u.id=e.actor_id and u.email_confirmed_at is not null) and case when e.template='team-invitation.v1' then exists(
 select 1 from public.team_invites i join public.team_members m on m.workspace_id=i.workspace_id and m.user_id=e.actor_id
 join public.team_members issuer on issuer.workspace_id=i.workspace_id and issuer.user_id=i.issued_by
 where i.id=e.aggregate_id and i.workspace_id=e.workspace_id and i.token_hash=e.token_hash and i.email=e.recipient
 and i.revoked_at is null and i.accepted_at is null and i.expires_at>clock_timestamp()
 and (m.role='owner' or m.role='admin' and i.role='member') and (issuer.role='owner' or issuer.role='admin' and i.role='member'))
 else exists(select 1 from public.workspace_scheduling_bookings b where b.id=e.aggregate_id and b.owner_id=e.actor_id and b.status='confirmed' and b.starts_at>clock_timestamp()) end
$$;
create function public.workspace_email_visible(e public.workspace_email_outbox) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select e.actor_id=auth.uid() and (e.workspace_id is null or exists(select 1 from public.team_members m where m.workspace_id=e.workspace_id and m.user_id=auth.uid() and (m.role='owner' or m.role='admin' and exists(select 1 from public.team_invites i where i.id=e.aggregate_id and i.role='member'))))
$$;
create function public.workspace_email_safe(e public.workspace_email_outbox) returns jsonb language sql immutable set search_path=pg_catalog,public as $$
 select jsonb_build_object('id',e.id,'template',e.template,'aggregateId',e.aggregate_id,'workspaceId',e.workspace_id,'recipient',e.recipient,'status',e.status,'attempts',e.attempts,'nextAttemptAt',e.next_attempt_at,'cancelRequested',e.cancel_requested,'createdAt',e.created_at,'version',e.version)
$$;
create function public.workspace_email_snapshot(expected_actor_id uuid,after_id uuid default null) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare rows jsonb; more boolean;
begin
 if auth.uid() is null or expected_actor_id is distinct from auth.uid() then raise exception 'Denied' using errcode='42501';end if;
 select coalesce(jsonb_agg(public.workspace_email_safe(x) order by x.id),'[]') into rows from (select e.* from public.workspace_email_outbox e where public.workspace_email_visible(e) and (after_id is null or e.id>after_id) order by e.id limit 101)x;
 more:=jsonb_array_length(rows)>100;if more then rows:=rows-100;end if;
 return jsonb_build_object('actorId',auth.uid(),'records',rows,'hasMore',more,'nextCursor',case when more then rows->99->>'id' else null end);
end $$;
-- Called only from trusted server after getUser; actor is that verified identity, never request authority.
create function public.workspace_email_enqueue(p_actor uuid,p_operation uuid,p_template text,p_aggregate uuid,p_recipient text,p_token_hash text,p_ciphertext text,p_consent text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox; prior public.workspace_email_outbox; h text; i public.team_invites;
begin
 if p_actor is null or p_operation is null or p_aggregate is null or p_template is null or p_template not in ('team-invitation.v1','booking-reminder.v1') or p_consent is distinct from 'transactional-email.v1' then raise exception 'Invalid request' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('email-actor:'||p_actor::text,0));
 e.actor_id:=p_actor;e.operation_id:=p_operation;e.template:=p_template;e.aggregate_id:=p_aggregate;e.consent_version:=p_consent;
 if p_template='team-invitation.v1' then
  select * into i from public.team_invites where id=p_aggregate;
  perform 1 from public.team_workspaces where id=i.workspace_id for share;
  if i.id is null or p_token_hash is distinct from i.token_hash or p_ciphertext is null or p_ciphertext !~ '^v1[.][A-Za-z0-9_-]{1,40}[.][A-Za-z0-9_-]{16}[.][A-Za-z0-9_-]{58}[.][A-Za-z0-9_-]{22}$' then raise exception 'Invitation unavailable' using errcode='42501';end if;
  e.workspace_id:=i.workspace_id;e.recipient:=i.email;e.token_hash:=p_token_hash;e.token_ciphertext:=p_ciphertext;
 else
  perform 1 from public.workspace_scheduling_bookings where id=p_aggregate and owner_id=p_actor for share;
  e.recipient:=p_recipient;if p_token_hash is not null or p_ciphertext is not null then raise exception 'Invalid secret' using errcode='22023';end if;
 end if;
 if not public.workspace_email_authorized(e) then raise exception 'Denied' using errcode='42501';end if;
 h:=encode(sha256(convert_to(jsonb_build_array(p_template,p_aggregate,e.recipient,p_token_hash,p_consent)::text,'UTF8')),'hex');
 select * into prior from public.workspace_email_outbox where actor_id=p_actor and operation_id=p_operation;
 if found then if prior.payload_hash<>h then raise exception 'Operation conflict' using errcode='40001';end if;return public.workspace_email_safe(prior);end if;
 if (select count(*) from public.workspace_email_outbox where actor_id=p_actor and created_at>clock_timestamp()-interval '1 hour')>=20 then raise exception 'Rate limited' using errcode='54000';end if;
 insert into public.workspace_email_outbox(actor_id,operation_id,template,aggregate_id,workspace_id,recipient,payload_hash,token_hash,token_ciphertext,consent_version)
 values(p_actor,p_operation,p_template,p_aggregate,e.workspace_id,e.recipient,h,e.token_hash,e.token_ciphertext,p_consent) returning * into e;
 return public.workspace_email_safe(e);
end $$;
create function public.workspace_email_cancel(expected_actor_id uuid,email_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox;
begin
 if auth.uid() is null or expected_actor_id is distinct from auth.uid() then raise exception 'Denied' using errcode='42501';end if;
 select * into e from public.workspace_email_outbox where id=email_id for update;
 if e.id is null or not public.workspace_email_visible(e) then raise exception 'Denied' using errcode='42501';end if;
 if e.cancel_requested then return public.workspace_email_safe(e);end if;
 update public.workspace_email_outbox set cancel_requested=true,status=case when status in ('queued','retry','leased','failed') then 'canceled' else status end,token_ciphertext=null,version=version+1,updated_at=clock_timestamp() where id=e.id returning * into e;
 return public.workspace_email_safe(e);
end $$;
-- One global slot/second and at most five attempts. Sending crash is UNKNOWN, never resend.
create table public.workspace_email_rate (id boolean primary key default true check(id),next_at timestamptz not null default clock_timestamp());
insert into public.workspace_email_rate values(true,clock_timestamp());
alter table public.workspace_email_rate enable row level security;alter table public.workspace_email_rate force row level security;
revoke all on public.workspace_email_rate from public,anon,authenticated;
create function public.workspace_email_claim() returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox; rate_at timestamptz;
begin
 select next_at into rate_at from public.workspace_email_rate where id=true for update;
 update public.workspace_email_outbox set status='unknown',token_ciphertext=null,version=version+1,updated_at=clock_timestamp() where status='sending' and lease_until<clock_timestamp();
 update public.workspace_email_outbox set status='retry',lease_id=null,lease_until=null,version=version+1,updated_at=clock_timestamp() where status='leased' and lease_until<clock_timestamp();
 update public.workspace_email_outbox pending set status='canceled',token_ciphertext=null,version=version+1,updated_at=clock_timestamp() where status in ('queued','retry','leased') and (cancel_requested or not public.workspace_email_authorized(pending));
 if rate_at>clock_timestamp() then return null;end if;
 select * into e from public.workspace_email_outbox where status in ('queued','retry') and next_attempt_at<=clock_timestamp() and attempts<5 order by next_attempt_at,id limit 1 for update skip locked;
 if not found then return null;end if;
 update public.workspace_email_rate set next_at=clock_timestamp()+interval '1 second' where id=true;
 update public.workspace_email_outbox set status='leased',lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '60 seconds',version=version+1,updated_at=clock_timestamp() where id=e.id returning * into e;
 return to_jsonb(e);
end $$;
create function public.workspace_email_begin(email_id uuid,claim_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox; b public.workspace_scheduling_bookings;
begin
 select * into e from public.workspace_email_outbox where id=email_id for update;
 if e.id is null or e.status<>'leased' or e.lease_id is distinct from claim_id or e.lease_until<=clock_timestamp() then return null;end if;
 if e.workspace_id is not null then perform 1 from public.team_workspaces where id=e.workspace_id for share;else select * into b from public.workspace_scheduling_bookings where id=e.aggregate_id for share;end if;
 if e.lease_until<=clock_timestamp() then return null;end if;
 if e.cancel_requested or not public.workspace_email_authorized(e) then
 update public.workspace_email_outbox set status='canceled',token_ciphertext=null,version=version+1,updated_at=clock_timestamp() where id=e.id;return null;end if;
 update public.workspace_email_outbox set status='sending',attempts=attempts+1,lease_until=clock_timestamp()+interval '60 seconds',version=version+1,updated_at=clock_timestamp() where id=e.id returning * into e;
 return to_jsonb(e)||jsonb_build_object('starts_at',b.starts_at,'timezone',b.timezone);
end $$;
create function public.workspace_email_finish(email_id uuid,claim_id uuid,outcome text,provider_email_id text default null,retry_seconds integer default 60) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox;
begin
 select * into e from public.workspace_email_outbox where id=email_id for update;
 if e.id is null or e.status<>'sending' or e.lease_id is distinct from claim_id then raise exception 'Lease conflict' using errcode='40001';end if;
 if outcome is null or outcome not in ('accepted','retry','unknown','failed') or (outcome='accepted' and (provider_email_id is null or provider_email_id !~ '^[A-Za-z0-9_-]{1,100}$')) then raise exception 'Invalid outcome' using errcode='22023';end if;
 update public.workspace_email_outbox set status=case when outcome='retry' and cancel_requested then 'canceled' when outcome='retry' and attempts>=5 then 'failed' else outcome end,
 provider_id=case when outcome='accepted' then provider_email_id else null end,
 next_attempt_at=clock_timestamp()+make_interval(secs=>greatest(60,least(86400,coalesce(retry_seconds,60)),(60*power(2,attempts))::integer)+floor(random()*30)::integer),
 token_ciphertext=case when outcome='retry' and attempts<5 and not cancel_requested then token_ciphertext else null end,
 lease_id=null,lease_until=null,version=version+1,updated_at=clock_timestamp() where id=e.id returning * into e;return public.workspace_email_safe(e);
end $$;
-- Fenced pre-send quarantine: never retries poison custody and never changes sending/unknown.
create function public.workspace_email_quarantine(email_id uuid,claim_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox;
begin
 select * into e from public.workspace_email_outbox where id=email_id for update;
 if e.id is null or e.status<>'leased' or e.lease_id is distinct from claim_id or e.lease_until<=clock_timestamp() then raise exception 'Lease conflict' using errcode='40001';end if;
 update public.workspace_email_outbox set status='failed',token_ciphertext=null,lease_id=null,lease_until=null,updated_at=clock_timestamp(),version=version+1 where id=e.id returning * into e;
 return public.workspace_email_safe(e);
end $$;
revoke all on function public.workspace_email_quarantine(uuid,uuid) from public,anon,authenticated;
grant execute on function public.workspace_email_quarantine(uuid,uuid) to service_role;
-- Evidence only from trusted adapter fetching the recorded provider ID. No browser evidence input.
create function public.workspace_email_reconcile(email_id uuid,provider_email_id text,provider_event text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox;
begin
 select * into e from public.workspace_email_outbox where id=email_id for update;
 if e.id is null or e.provider_id is null or e.provider_id is distinct from provider_email_id or e.status not in ('accepted','unknown','delivered','bounced') or provider_event is null or provider_event not in ('delivered','bounced') then raise exception 'Evidence unavailable' using errcode='40001';end if;
 if e.status in ('delivered','bounced') then return public.workspace_email_safe(e);end if;
 update public.workspace_email_outbox set status=provider_event,evidence_at=clock_timestamp(),version=version+1,updated_at=clock_timestamp() where id=e.id returning * into e;return public.workspace_email_safe(e);
end $$;
-- Explicit grants: service role required only for privileged trusted-server seams.
revoke all on function public.workspace_email_authorized(public.workspace_email_outbox),public.workspace_email_visible(public.workspace_email_outbox),public.workspace_email_safe(public.workspace_email_outbox),public.workspace_email_snapshot(uuid,uuid),public.workspace_email_cancel(uuid,uuid),public.workspace_email_enqueue(uuid,uuid,text,uuid,text,text,text,text),public.workspace_email_claim(),public.workspace_email_begin(uuid,uuid),public.workspace_email_finish(uuid,uuid,text,text,integer),public.workspace_email_reconcile(uuid,text,text) from public,anon,authenticated;
grant execute on function public.workspace_email_snapshot(uuid,uuid),public.workspace_email_cancel(uuid,uuid) to authenticated;
grant execute on function public.workspace_email_enqueue(uuid,uuid,text,uuid,text,text,text,text),public.workspace_email_claim(),public.workspace_email_begin(uuid,uuid),public.workspace_email_finish(uuid,uuid,text,text,integer),public.workspace_email_reconcile(uuid,text,text) to service_role;
commit;
