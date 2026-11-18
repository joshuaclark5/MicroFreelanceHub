-- REVIEW ONLY: query emits a rollback plan as text; it executes NO DDL.
-- Destructive rollback loses workspace records. Archive/export and explicitly authorize first.
-- Do not remove legacy sow_documents, auth users, legacy client fields, or payment records.
-- Reverse dependency order; no CASCADE, so unexpected dependencies fail closed.
-- Never execute this plan against production under the current task authorization.
begin read only;
select step, statement from (values
 (1, 'BEGIN;'),
 (2, 'DROP TABLE public.workspace_agreements;'),
 (3, 'DROP TABLE public.workspace_tasks;'),
 (4, 'DROP TABLE public.workspace_projects;'),
 (5, 'DROP TABLE public.workspace_stages;'),
 (6, 'DROP TABLE public.workspace_clients;'),
 (7, 'ALTER TABLE public.sow_documents DROP CONSTRAINT workspace_agreement_owner_key;'),
 (8, 'DROP FUNCTION public.guard_workspace_record();'),
 (9, 'ROLLBACK; -- rehearsal only; no commit is authorized')
) as plan(step,statement) order by step;
rollback;
