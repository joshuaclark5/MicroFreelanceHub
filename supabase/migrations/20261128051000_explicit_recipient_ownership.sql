-- Email ownership is explicit, document/version and authenticated-session scoped.
begin;
create table public.agreement_recipient_challenges (
 id uuid primary key, document_id uuid not null references public.sow_documents(id) on delete cascade,
 document_version bigint not null, actor_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null, recipient text not null, token_hash text not null check(length(token_hash)=64),
 created_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null default (clock_timestamp()+interval '15 minutes'),
 verified_at timestamptz, access_until timestamptz, attempts integer not null default 0
);
create index agreement_recipient_actor_time on public.agreement_recipient_challenges(actor_id,created_at);
create index agreement_recipient_document_time on public.agreement_recipient_challenges(document_id,created_at);
alter table public.agreement_recipient_challenges enable row level security;
alter table public.agreement_recipient_challenges force row level security;
revoke all on public.agreement_recipient_challenges from public,anon,authenticated;
grant all on public.agreement_recipient_challenges to service_role;
create function public.recipient_session_verified(p_document uuid,p_version bigint,p_actor uuid,p_session uuid,p_email text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.agreement_recipient_challenges c where c.document_id=p_document
 and c.document_version=p_version and c.actor_id=p_actor and c.session_id=p_session
 and c.recipient=lower(btrim(p_email)) and c.verified_at is not null and c.access_until>now());
$$;
revoke all on function public.recipient_session_verified(uuid,bigint,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.recipient_session_verified(uuid,bigint,uuid,uuid,text) to service_role;
create function public.agreement_session_review_allowed(p_document uuid,p_version bigint,p_owner uuid,p_email text,p_status text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null and (auth.uid()=p_owner or (
 coalesce(p_status,'') not in ('Cancelled','Canceled') and exists(select 1 from auth.users u
 where u.id=auth.uid() and lower(u.email)=lower(btrim(p_email))
 and public.recipient_session_verified(p_document,p_version,u.id,nullif(auth.jwt()->>'session_id','')::uuid,u.email))));
$$;
revoke all on function public.agreement_session_review_allowed(uuid,bigint,uuid,text,text) from public;
grant execute on function public.agreement_session_review_allowed(uuid,bigint,uuid,text,text) to authenticated,service_role;
drop policy "Verified agreement recipient can review" on public.sow_documents;
create policy "Verified agreement recipient can review" on public.sow_documents for select to authenticated
 using(public.agreement_session_review_allowed(id,document_version,user_id,coalesce(nullif(btrim(client_data->>'email'),''),email),status));
drop policy "Authorized parties can retrieve acceptance evidence" on public.agreement_acceptances;
create policy "Authorized parties can retrieve acceptance evidence" on public.agreement_acceptances for select to authenticated
 using(exists(select 1 from public.sow_documents d where d.id=document_id and public.agreement_session_review_allowed(d.id,d.document_version,d.user_id,coalesce(nullif(btrim(d.client_data->>'email'),''),d.email),d.status)));
create function public.start_recipient_challenge(p_id uuid,p_document uuid,p_actor uuid,p_session uuid,p_hash text)
returns text language plpgsql security definer set search_path=pg_catalog,public as $$
declare d public.sow_documents; email_address text; recipient text;
begin
 if p_session is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request' using errcode='22023';end if;
 -- Serialize limits even for concurrent requests and alternate sessions.
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,11));
 select * into d from public.sow_documents where id=p_document for update;
 select lower(email) into email_address from auth.users where id=p_actor;
 recipient:=lower(coalesce(nullif(btrim(d.client_data->>'email'),''),nullif(btrim(d.email),'')));
 if d.id is null or d.user_id is null or d.user_id=p_actor or email_address is null or recipient is null or recipient<>email_address or d.status in ('Cancelled','Canceled') then
 raise exception 'Verification unavailable' using errcode='42501';end if;
 if (select count(*) from public.agreement_recipient_challenges where actor_id=p_actor and created_at>now()-interval '1 hour')>=3
 or (select count(*) from public.agreement_recipient_challenges where document_id=p_document and created_at>now()-interval '1 hour')>=3 then
 raise exception 'Wait before requesting another code' using errcode='54000';end if;
 insert into public.agreement_recipient_challenges(id,document_id,document_version,actor_id,session_id,recipient,token_hash)
 values(p_id,p_document,d.document_version,p_actor,p_session,recipient,p_hash);
 return recipient;
end;$$;
create function public.finish_recipient_challenge(p_document uuid,p_actor uuid,p_session uuid,p_hash text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare d public.sow_documents; c public.agreement_recipient_challenges; email_address text;
begin
 select * into d from public.sow_documents where id=p_document for update;
 select lower(email) into email_address from auth.users where id=p_actor;
 if d.id is null or d.status in ('Cancelled','Canceled') or email_address is null
 or email_address is distinct from lower(coalesce(nullif(btrim(d.client_data->>'email'),''),nullif(btrim(d.email),''))) then return false;end if;
 select * into c from public.agreement_recipient_challenges where document_id=p_document and actor_id=p_actor and session_id=p_session
 and document_version=d.document_version and recipient=email_address and verified_at is null
 order by created_at desc limit 1 for update;
 if not found or c.expires_at<=now() or c.attempts>=5 then return false;end if;
 update public.agreement_recipient_challenges set attempts=attempts+1 where id=c.id;
 if p_hash is null or c.token_hash<>p_hash then return false;end if;
 update public.agreement_recipient_challenges set verified_at=clock_timestamp(),access_until=clock_timestamp()+interval '24 hours' where id=c.id;
 return true;
end;$$;
revoke all on function public.start_recipient_challenge(uuid,uuid,uuid,uuid,text),public.finish_recipient_challenge(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.start_recipient_challenge(uuid,uuid,uuid,uuid,text),public.finish_recipient_challenge(uuid,uuid,uuid,text) to service_role;
create or replace function public.accept_session_reviewed_agreement(p_document uuid,p_version bigint,p_actor uuid,p_name text,p_role text,p_session uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare d public.sow_documents; u auth.users; receipt public.agreement_acceptances; terms jsonb; recipient text;
begin

 if p_role is null or p_role not in ('client','provider') or p_version is null or p_version<1 or p_name is null or length(btrim(p_name)) not between 2 and 160 then raise exception 'Invalid acceptance' using errcode='22023';end if;
 select * into u from auth.users where id=p_actor;
 if not found or u.email_confirmed_at is null or nullif(btrim(u.email),'') is null then raise exception 'Verified sign-in required' using errcode='42501';end if;
 select * into d from public.sow_documents where id=p_document for update;
 if not found or d.user_id is null then raise exception 'Agreement unavailable' using errcode='42501';end if;
 recipient:=lower(coalesce(nullif(btrim(d.client_data->>'email'),''),nullif(btrim(d.email),'')));
 if (p_role='provider' and d.user_id<>p_actor) or (p_role='client' and (d.user_id=p_actor or recipient is null or recipient<>lower(u.email))) then raise exception 'Intended signer required' using errcode='42501';end if;
 if p_role='client' and not public.recipient_session_verified(p_document,p_version,p_actor,p_session,u.email) then raise exception 'Recipient session verification required' using errcode='42501';end if;
 if d.document_version<>p_version then raise exception 'Agreement changed. Reload and review before signing.' using errcode='40001';end if;
 if d.status in ('Cancelled','Canceled') then raise exception 'Agreement is no longer available for acceptance' using errcode='42501';end if;
 select * into receipt from public.agreement_acceptances where document_id=p_document and document_version=p_version and signing_role=p_role;
 if found then
  if receipt.actor_id<>p_actor or receipt.signer_name<>btrim(p_name) then raise exception 'Signature already recorded' using errcode='40001';end if;
  return jsonb_build_object('version',p_version,'role',p_role,'signedAt',receipt.signed_at,'alreadyRecorded',true);
 end if;
 if (p_role='client' and nullif(d.signed_by,'') is not null) or (p_role='provider' and nullif(d.provider_sign,'') is not null) or d.status='Paid' then raise exception 'Signature already recorded; original evidence retained' using errcode='40001';end if;
 terms:=public.agreement_review_terms(to_jsonb(d));
 insert into public.agreement_acceptances(document_id,document_version,signing_role,actor_id,verified_email,signer_name,reviewed_terms,terms_sha256)
 values(p_document,p_version,p_role,p_actor,lower(u.email),btrim(p_name),terms,encode(sha256(convert_to(terms::text,'UTF8')),'hex')) returning * into receipt;
 update public.sow_documents set signed_by=case when p_role='client' then btrim(p_name) else signed_by end,
  provider_sign=case when p_role='provider' then btrim(p_name) else provider_sign end,
  status=case when p_role='client' then 'Signed' else status end where id=p_document;
 return jsonb_build_object('version',p_version,'role',p_role,'signedAt',receipt.signed_at,'alreadyRecorded',false);
end;
$$;
revoke all on function public.accept_session_reviewed_agreement(uuid,bigint,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.accept_session_reviewed_agreement(uuid,bigint,uuid,text,text,uuid) to service_role;
commit;
