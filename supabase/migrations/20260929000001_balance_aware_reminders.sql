-- Reminders quote the remaining balance, never money already received.
create or replace function public.process_daily_dunning()
returns void
language plpgsql
as $$
declare
  v_record record;
  v_days_overdue int;
  v_response_id bigint;
  v_milestone int;
  v_target_milestone int;
begin
  for v_record in
    select id, client_name, coalesce(client_data->>'email', email) as client_email,
      greatest(round(price * 100) - payment_received_cents, 0) / 100.0 as balance,
      title, due_date, coalesce(dunning_emails_sent, '[]'::jsonb) as sent
    from public.sow_documents
    where coalesce(dunning_enabled, true) is true
      and due_date::date < current_date
      and round(coalesce(price, 0) * 100) > payment_received_cents
      and coalesce(client_data->>'email', email) is not null
      and nullif(trim(signed_by), '') is not null
      and nullif(trim(provider_sign), '') is not null
      and lower(coalesce(status, '')) not in ('draft', 'paid', 'canceled', 'cancelled')
  loop
    v_days_overdue := current_date - v_record.due_date::date;
    v_target_milestone := null;
    foreach v_milestone in array array[3, 5, 10, 15, 30] loop
      if v_days_overdue >= v_milestone then
        v_target_milestone := v_milestone;
      end if;
    end loop;
    if v_target_milestone is not null
      and not (v_record.sent @> jsonb_build_array(v_target_milestone)) then
      select net.http_post(
        url := 'https://rjgttmwrbyjqifodjnqm.supabase.co/functions/v1/dunning-email',
        body := jsonb_build_object(
          'invoice_id', v_record.id,
          'client_email', v_record.client_email,
          'client_name', coalesce(nullif(v_record.client_name, ''), 'there'),
          'days_overdue', v_target_milestone,
          'amount_due', v_record.balance,
          'project_name', coalesce(nullif(v_record.title, ''), 'your project')),
        headers := jsonb_build_object('Content-Type', 'application/json')
      ) into v_response_id;
      update public.sow_documents
      set dunning_emails_sent = coalesce(dunning_emails_sent, '[]'::jsonb) || to_jsonb(v_target_milestone),
          dunning_last_error = null
      where id = v_record.id;
    end if;
  end loop;
exception when others then
  raise warning 'Error in process_daily_dunning: %', sqlerrm;
end;
$$;
