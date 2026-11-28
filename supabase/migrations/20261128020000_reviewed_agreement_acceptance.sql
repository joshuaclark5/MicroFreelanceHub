-- Preserve signed terms and bind new acceptance to authenticated recipient/version.
begin;
alter table public.sow_documents add column document_version bigint not null default 1;

create function public.agreement_review_allowed(p_owner uuid,p_email text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null and (auth.uid()=p_owner or exists(
  select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
   and nullif(lower(btrim(p_email)),'')=lower(u.email)
 ));
$$;
revoke all on function public.agreement_review_allowed(uuid,text) from public;
grant execute on function public.agreement_review_allowed(uuid,text) to anon,authenticated,service_role;

-- These permissive legacy policies exposed customer documents to unrelated accounts.
drop policy if exists "Allow Public Read Access" on public.sow_documents;
drop policy if exists "Public Read Access SOW" on public.sow_documents;
drop policy if exists "Allow Public Signing" on public.sow_documents;
create policy "Verified agreement recipient can review" on public.sow_documents for select to authenticated
 using(public.agreement_review_allowed(user_id,coalesce(nullif(btrim(client_data->>'email'),''),email)));
-- Existing owner policies and public system-template (user_id IS NULL) reads remain.

create function public.agreement_review_terms(p_doc jsonb) returns jsonb
language sql immutable set search_path=pg_catalog,public as $$
 select p_doc - array['signed_by','provider_sign','status','payment_received_cents','last_payment_date','updated_at','document_version','dunning_enabled','last_reminder_sent','reminder_count','dunning_emails_sent','dunning_last_error'];
$$;
create function public.guard_signed_agreement_history() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op='DELETE' then
  if nullif(old.signed_by,'') is not null or nullif(old.provider_sign,'') is not null then
   raise exception 'Signed agreements must be retained. Use a separate change order.' using errcode='42501';
  end if;
  return old;
 elsif tg_op='INSERT' then new.document_version:=1;return new;
 end if;
 if nullif(old.signed_by,'') is not null or nullif(old.provider_sign,'') is not null then
  if current_user in ('anon','authenticated') and new.status is distinct from old.status then
   raise exception 'Verified status action required' using errcode='42501';
  end if;
  if public.agreement_review_terms(to_jsonb(new)) is distinct from public.agreement_review_terms(to_jsonb(old))
   or (nullif(old.signed_by,'') is not null and new.signed_by is distinct from old.signed_by)
   or (nullif(old.provider_sign,'') is not null and new.provider_sign is distinct from old.provider_sign) then
   raise exception 'Signed terms and existing signatures cannot be replaced. Use a separate change order.' using errcode='42501';
  end if;
 end if;
 new.document_version:=old.document_version + case when public.agreement_review_terms(to_jsonb(new)) is distinct from public.agreement_review_terms(to_jsonb(old)) then 1 else 0 end;
 return new;
end;
$$;
create trigger guard_signed_agreement_history before insert or update or delete on public.sow_documents
 for each row execute function public.guard_signed_agreement_history();

create table public.agreement_acceptances (
 document_id uuid not null references public.sow_documents(id),
 document_version bigint not null,
 signing_role text not null check(signing_role in ('provider','client')),
 actor_id uuid not null references auth.users(id),
 verified_email text not null,
 signer_name text not null,
 signed_at timestamptz not null default clock_timestamp(),
 reviewed_terms jsonb not null,
 terms_sha256 text not null,
 primary key(document_id,document_version,signing_role)
);
alter table public.agreement_acceptances enable row level security;
alter table public.agreement_acceptances force row level security;
revoke all on public.agreement_acceptances from public,anon,authenticated;
grant select on public.agreement_acceptances to authenticated;
create policy "Authorized parties can retrieve acceptance evidence" on public.agreement_acceptances for select to authenticated
 using(exists(select 1 from public.sow_documents d where d.id=document_id and public.agreement_review_allowed(d.user_id,coalesce(nullif(btrim(d.client_data->>'email'),''),d.email))));
create function public.guard_acceptance_evidence() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin raise exception 'Acceptance evidence is immutable' using errcode='42501';end;
$$;
create trigger guard_acceptance_evidence before update or delete on public.agreement_acceptances for each row execute function public.guard_acceptance_evidence();

create function public.accept_reviewed_agreement(p_document uuid,p_version bigint,p_actor uuid,p_name text,p_role text)
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
revoke all on function public.accept_reviewed_agreement(uuid,bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.accept_reviewed_agreement(uuid,bigint,uuid,text,text) to service_role;
commit;
