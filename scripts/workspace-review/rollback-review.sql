-- REVIEW ONLY: query emits a rollback plan as text; it executes NO DDL.
-- Destructive rollback loses workspace records. Archive/export and explicitly authorize first.
-- Do not remove legacy sow_documents, auth users, legacy client fields, or payment records.
-- Reverse dependency order; no CASCADE, so unexpected dependencies fail closed.
-- Never execute this plan against production under the current task authorization.
begin read only;
select step, statement from (values
 (1, 'BEGIN;'),
 (2, 'DROP FUNCTION public.workspace_time_mutate(jsonb);'),
 (3, 'DROP TABLE public.workspace_time_operations;'),
 (4, 'DROP TABLE public.workspace_time_audit;'),
 (5, 'DROP TABLE public.workspace_time_entries;'),
 (6, 'DROP TABLE public.workspace_agreements;'),
 (7, 'DROP TABLE public.workspace_tasks;'),
 (8, 'DROP TABLE public.workspace_projects;'),
 (9, 'DROP TABLE public.workspace_stages;'),
 (10, 'DROP TABLE public.workspace_clients;'),
 (11, 'ALTER TABLE public.sow_documents DROP CONSTRAINT workspace_agreement_owner_key;'),
 (12, 'DROP FUNCTION public.guard_workspace_record();'),
 (13, 'ROLLBACK; -- rehearsal only; no commit is authorized')
) as plan(step,statement) order by step;
rollback;
