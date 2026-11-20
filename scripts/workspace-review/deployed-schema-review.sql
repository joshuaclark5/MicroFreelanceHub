-- READ-ONLY REVIEW AID. Not executed against production in this task.
-- Authorized operator: inspect catalog only; do not select customer row contents.
begin read only;
select table_schema,table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='public'
and table_name in ('sow_documents','expenses','profiles','invoices','workspace_clients','workspace_stages','workspace_projects','workspace_tasks','workspace_agreements')
order by table_name,ordinal_position;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and (tablename like 'workspace_%' or tablename in ('sow_documents','profiles','expenses'));
select table_schema,table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and (table_name like 'workspace_%' or table_name in ('sow_documents','profiles','expenses')) order by table_name,grantee;
select c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and (c.relname like 'workspace_%' or c.relname='sow_documents');
select conrelid::regclass as table_name,conname,pg_get_constraintdef(oid) as definition from pg_constraint where connamespace='public'::regnamespace and (conrelid::regclass::text like '%workspace_%' or conrelid='public.sow_documents'::regclass);
select event_object_table,trigger_name,action_timing,event_manipulation,action_statement from information_schema.triggers where event_object_schema='public' and (event_object_table like 'workspace_%' or event_object_table='sow_documents');
rollback;
