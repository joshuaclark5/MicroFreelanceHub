create table if not exists public.challenge_enrollments (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 name text not null check(length(name) between 1 and 80), email text not null unique,
 consent_version text not null default 'challenge-welcome-v1',
 email_status text not null default 'pending' check(email_status in ('pending','sending','sent','failed')),
 claimed_at timestamptz, first_attempt_at timestamptz, resend_id text, is_test boolean not null default false
);
create table if not exists public.challenge_signup_attempts (created_at timestamptz not null default now(), rate_key text not null);
create index if not exists challenge_attempt_time on public.challenge_signup_attempts(created_at);
alter table public.challenge_enrollments enable row level security;
alter table public.challenge_signup_attempts enable row level security;
revoke all on public.challenge_enrollments, public.challenge_signup_attempts from anon, authenticated;
grant select,insert,update,delete on public.challenge_enrollments, public.challenge_signup_attempts to service_role;
create or replace function public.claim_challenge_welcome(p_name text,p_email text,p_rate_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.challenge_enrollments%rowtype;
begin
 perform pg_advisory_xact_lock(721021);
 delete from public.challenge_signup_attempts where created_at < now()-interval '2 hours';
 if (select count(*) from public.challenge_signup_attempts where created_at>now()-interval '1 hour')>=100 or
 (select count(*) from public.challenge_signup_attempts where rate_key=p_rate_key and created_at>now()-interval '1 hour')>=5 then return jsonb_build_object('action','limited'); end if;
 insert into public.challenge_signup_attempts(rate_key) values(p_rate_key);
 insert into public.challenge_enrollments(name,email) values(p_name,p_email) on conflict(email) do nothing;
 select * into v from public.challenge_enrollments where email=p_email for update;
 if v.email_status='sent' then return jsonb_build_object('action','done'); end if;
 if v.claimed_at>now()-interval '2 minutes' then return jsonb_build_object('action','wait'); end if;
 -- Resend idempotency expires after 24h. Never automatically retry an uncertain old send.
 if v.first_attempt_at<now()-interval '23 hours' then return jsonb_build_object('action','held'); end if;
 update public.challenge_enrollments set email_status='sending',claimed_at=now(),first_attempt_at=coalesce(first_attempt_at,now()) where id=v.id;
 return jsonb_build_object('action','send','id',v.id,'name',v.name,'email',v.email);
end $$;
revoke all on function public.claim_challenge_welcome(text,text,text) from public,anon,authenticated;
grant execute on function public.claim_challenge_welcome(text,text,text) to service_role;
notify pgrst,'reload schema';
