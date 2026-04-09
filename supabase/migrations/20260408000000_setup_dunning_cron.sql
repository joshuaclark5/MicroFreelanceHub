-- Enable required extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Add dunning_emails_sent column to track which dunning emails have been sent
-- This prevents duplicate email sends across multiple cron job executions
alter table if exists invoices
  add column if not exists dunning_emails_sent jsonb default '[]'::jsonb;

-- Create the process_daily_dunning function
-- This function sweeps the database for unpaid invoices and triggers dunning emails
create or replace function process_daily_dunning()
returns void
language plpgsql
as $$
declare
  v_record record;
  v_days_overdue int;
  v_api_response json;
  v_dunning_milestones int[] := array[3, 5, 10, 15, 30];
  v_milestone int;
begin
  -- Iterate through all unpaid invoices
  for v_record in
    select
      id as invoice_id,
      (client_data->>'email') as client_email,
      (client_data->>'name') as client_name,
      amount,
      (project_data->>'project_name') as project_name,
      due_date,
      dunning_emails_sent
    from invoices
    where status = 'unpaid'
      and due_date is not null
  loop
    -- Calculate days overdue (current date - due date)
    v_days_overdue := (current_date - v_record.due_date);

    -- Check each dunning milestone
    foreach v_milestone in array v_dunning_milestones
    loop
      -- Only trigger emails for the specific overdue milestones
      -- AND only if we haven't already sent that specific email
      if v_days_overdue >= v_milestone
        and not (v_record.dunning_emails_sent::text ilike '%' || v_milestone::text || '%')
      then
        -- Make a POST request to the dunning-email Edge Function via pg_net
        -- Pass in the Supabase Service Role key for authentication
        select into v_api_response
          net.http_post(
            'https://' || current_setting('app.supabase_project_id') || '.supabase.co/functions/v1/dunning-email',
            jsonb_build_object(
              'invoice_id', v_record.invoice_id,
              'client_email', v_record.client_email,
              'client_name', v_record.client_name,
              'days_overdue', v_days_overdue,
              'amount_due', v_record.amount,
              'project_name', v_record.project_name
            ),
            jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
            )
          );

        -- Mark this milestone as sent in the dunning_emails_sent array
        update invoices
        set dunning_emails_sent = jsonb_insert(
          dunning_emails_sent,
          '{-1}',
          to_jsonb(v_milestone)
        )
        where id = v_record.invoice_id;
      end if;
    end loop;
  end loop;

exception when others then
  -- Log any errors (in production, consider logging to a dedicated table)
  raise notice 'Error in process_daily_dunning: %', sqlerrm;
end;
$$;

-- Schedule the function to run every day at midnight (00:00 UTC)
-- First, try to remove any existing schedule to prevent duplicates
do $$
begin
  perform cron.unschedule('daily-dunning-sweep');
exception when others then
  -- Job doesn't exist yet, which is fine
  null;
end $$;

-- Create the cron job (runs daily at midnight UTC)
select cron.schedule(
  'daily-dunning-sweep',
  '0 0 * * *',
  'select process_daily_dunning()'
);

-- Optional: Add a comment for documentation
comment on function process_daily_dunning() is 'Sweeps unpaid invoices daily and triggers dunning emails at 3, 5, 10, 15, and 30 day milestones';
