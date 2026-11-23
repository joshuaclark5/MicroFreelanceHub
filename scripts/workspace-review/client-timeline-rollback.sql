-- REHEARSAL ONLY on an isolated restored database.
-- Intentionally ends in ROLLBACK; never remove it or run a destructive live rollback.
-- For an application rollback, keep additive schema/history and disable the new UI.
begin;
drop function public.workspace_client_timeline(uuid);
drop function public.workspace_client_note(jsonb);
drop trigger workspace_client_note_author on public.workspace_client_notes;
drop table public.workspace_client_notes;
drop trigger workspace_crm_capture_author on public.workspace_crm_activity;
drop function public.workspace_activity_author();
alter table public.workspace_crm_activity drop column author_id, drop column author_name;
rollback;
