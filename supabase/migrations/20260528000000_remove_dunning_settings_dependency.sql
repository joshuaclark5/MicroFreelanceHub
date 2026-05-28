-- Make the dunning sweep runnable in production without custom database GUCs.
-- The dunning-email Edge Function has verify_jwt=false, so the cron can call it
-- directly without storing a service role key in database settings.

create or replace function public.process_daily_dunning()
returns void
language plpgsql
as $$
declare
  v_record record;
  v_days_overdue int;
  v_function_url text := 'https://rjgttmwrbyjqifodjnqm.supabase.co/functions/v1/dunning-email';
  v_response_id bigint;
  v_milestones int[] := array[3, 5, 10, 15, 30];
  v_milestone int;
  v_target_milestone int;
begin
  for v_record in
    select
      id,
      client_name,
      coalesce(client_data->>'email', email) as client_email,
      price,
      title,
      due_date,
      coalesce(dunning_emails_sent, '[]'::jsonb) as dunning_emails_sent
    from public.sow_documents
    where coalesce(dunning_enabled, true) is true
      and due_date is not null
      and due_date::date < current_date
      and coalesce(price, 0) > 0
      and coalesce(client_data->>'email', email) is not null
      and lower(coalesce(status, '')) not in ('paid', 'canceled', 'cancelled')
  loop
    v_days_overdue := current_date - v_record.due_date::date;
    v_target_milestone := null;

    foreach v_milestone in array v_milestones loop
      if v_days_overdue >= v_milestone
        and not (v_record.dunning_emails_sent @> jsonb_build_array(v_milestone))
      then
        v_target_milestone := v_milestone;
      end if;
    end loop;

    -- Send at most one reminder per document per sweep. If an old overdue
    -- document is picked up late, send the current severity instead of
    -- blasting every missed reminder at once.
    if v_target_milestone is not null then
      select net.http_post(
        url := v_function_url,
        body := jsonb_build_object(
          'invoice_id', v_record.id,
          'client_email', v_record.client_email,
          'client_name', coalesce(nullif(v_record.client_name, ''), 'there'),
          'days_overdue', v_target_milestone,
          'amount_due', v_record.price,
          'project_name', coalesce(nullif(v_record.title, ''), 'your project')
        ),
        headers := jsonb_build_object('Content-Type', 'application/json')
      )
      into v_response_id;

      update public.sow_documents
      set
        dunning_emails_sent = coalesce(dunning_emails_sent, '[]'::jsonb) || to_jsonb(v_target_milestone),
        dunning_last_error = null
      where id = v_record.id;
    end if;
  end loop;

exception when others then
  raise warning 'Error in process_daily_dunning: %', sqlerrm;
end;
$$;

comment on function public.process_daily_dunning() is 'Sweeps overdue sow_documents daily and triggers one dunning email at 3, 5, 10, 15, and 30 day milestones';
