-- Operator-applied additive worker prerequisite; no activation or external calls.
-- Kept with worker library for parent integration into the migration release.
begin;
create index if not exists workspace_email_evidence_due
 on public.workspace_email_outbox(updated_at,id)
 where status in ('accepted','unknown') and provider_id is not null;

create function public.workspace_email_evidence_next() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare e public.workspace_email_outbox;
begin
 -- Rotate even unconfirmed evidence; concurrent invocations cannot repeatedly
 -- poll the same record within a minute. No send or delivery state mutation.
 select * into e from public.workspace_email_outbox
 where status in ('accepted','unknown') and provider_id is not null
 and updated_at<clock_timestamp()-interval '1 minute'
 order by updated_at,id limit 1 for update skip locked;
 if not found then return null;end if;
 update public.workspace_email_outbox set updated_at=clock_timestamp() where id=e.id;
 return jsonb_build_object('id',e.id,'provider_id',e.provider_id,'recipient',e.recipient);
end $$;
revoke all on function public.workspace_email_evidence_next() from public,anon,authenticated;
grant execute on function public.workspace_email_evidence_next() to service_role;
commit;
