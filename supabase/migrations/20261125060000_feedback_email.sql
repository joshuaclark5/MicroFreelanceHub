-- Reports are private operational records, not a customer-visible inbox.
create table public.feedback_reports (
 id uuid primary key,
 payload_hash text not null,
 rate_key text not null,
 message text not null check (char_length(message) between 1 and 2000),
 email text not null default '' check (char_length(email) <= 254),
 status text not null default 'sending' check (status in ('sending','accepted','failed','unknown')),
 provider_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.feedback_reports enable row level security;
revoke all on public.feedback_reports from anon, authenticated;
grant select, insert, update, delete on public.feedback_reports to service_role;
create index feedback_reports_rate_created on public.feedback_reports(rate_key, created_at);
create index feedback_reports_created on public.feedback_reports(created_at);

create function public.claim_feedback_report(p_id uuid,p_hash text,p_rate_key text,p_message text,p_email text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare existing public.feedback_reports;
begin
 -- Serialize small bounded public intake, including concurrent new IDs/IPs.
 perform pg_advisory_xact_lock(726251125);
 select * into existing from public.feedback_reports where id=p_id;
 if found then
   if existing.payload_hash<>p_hash then return jsonb_build_object('action','conflict'); end if;
   -- Even after process termination we never send this report a second time.
   return jsonb_build_object('action',existing.status);
 end if;
 if (select count(*) from public.feedback_reports where rate_key=p_rate_key and created_at>now()-interval '1 hour')>=5
 or (select count(*) from public.feedback_reports where created_at>now()-interval '1 hour')>=100 then
   return jsonb_build_object('action','limited');
 end if;
 insert into public.feedback_reports(id,payload_hash,rate_key,message,email) values(p_id,p_hash,p_rate_key,p_message,p_email);
 return jsonb_build_object('action','send');
end $$;
revoke all on function public.claim_feedback_report(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_feedback_report(uuid,text,text,text,text) to service_role;
