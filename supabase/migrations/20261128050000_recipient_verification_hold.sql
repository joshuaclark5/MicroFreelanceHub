-- Fail closed for recipient access until explicit email ownership is proven.
-- Production auto-confirmed signup is not an email-ownership challenge.
-- Owner access, public system templates and existing immutable history remain.
begin;
create or replace function public.agreement_review_allowed(p_owner uuid,p_email text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null and auth.uid()=p_owner;
$$;
create or replace function public.accept_reviewed_agreement(p_document uuid,p_version bigint,p_actor uuid,p_name text,p_role text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare d public.sow_documents; u auth.users; receipt public.agreement_acceptances; terms jsonb; recipient text;
begin
 if p_role='client' then raise exception 'Explicit recipient email ownership verification required' using errcode='42501';end if;
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
