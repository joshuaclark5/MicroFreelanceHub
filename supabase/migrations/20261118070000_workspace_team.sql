-- Isolated team model. No solo tables or policies are altered.
create table public.team_workspaces (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100 and name=btrim(name)), created_at timestamptz not null default now(),
 transfer_id uuid, transfer_user_id uuid references auth.users(id) on delete restrict, transfer_expires_at timestamptz,
 check ((transfer_id is null) = (transfer_user_id is null) and (transfer_user_id is null) = (transfer_expires_at is null))
);
create table public.team_members (
 workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete restrict,
 role text not null check(role in ('owner','admin','member')), joined_at timestamptz not null default now(), primary key(workspace_id,user_id)
);
-- Exactly one owner can exist. RPCs never delete/demote the last owner except
-- within the explicit transfer transaction; account deletion is restricted.
create unique index team_one_owner on public.team_members(workspace_id) where role='owner';
create index team_members_user on public.team_members(user_id,workspace_id);
create table public.team_invites (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
 email text not null, recipient_id uuid references auth.users(id) on delete restrict,
 role text not null check(role in ('admin','member')), token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 issued_by uuid not null references auth.users(id) on delete restrict,
 expires_at timestamptz not null default now()+interval '7 days', revoked_at timestamptz, accepted_at timestamptz,
 created_at timestamptz not null default now()
);
create index team_invites_workspace on public.team_invites(workspace_id);
create table public.team_operations (
 actor_id uuid not null references auth.users(id) on delete restrict, operation_id uuid not null,
 workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
 request jsonb not null, result jsonb not null, created_at timestamptz not null default now(), primary key(actor_id,operation_id)
);
create function public.team_role(workspace uuid) returns text language sql stable security definer set search_path=pg_catalog,public as $$
 select m.role from public.team_members m where m.workspace_id=workspace and m.user_id=auth.uid()
$$;
revoke all on function public.team_role(uuid) from public,anon;
grant execute on function public.team_role(uuid) to authenticated;

alter table public.team_workspaces enable row level security;
alter table public.team_workspaces force row level security;
alter table public.team_members enable row level security;
alter table public.team_members force row level security;
alter table public.team_invites enable row level security;
alter table public.team_invites force row level security;
alter table public.team_operations enable row level security;
alter table public.team_operations force row level security;
revoke all on public.team_workspaces,public.team_members,public.team_invites,public.team_operations from public,anon,authenticated;
grant select on public.team_workspaces,public.team_members to authenticated;
create policy team_workspace_read on public.team_workspaces for select to authenticated using(public.team_role(id) is not null);
create policy team_member_read on public.team_members for select to authenticated using(public.team_role(workspace_id) is not null);
-- Invitations and receipts deliberately have no direct SELECT grants: hashes,
-- recipient bindings and replay internals must not leave the definer boundary.
create function public.team_snapshot(expected_actor_id uuid,selected_workspace_id uuid default null) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare a uuid:=auth.uid(); r text; ws jsonb; ms jsonb:='[]'; inv jsonb:='[]'; pending jsonb:=null;
begin
 if a is null or expected_actor_id is distinct from a then raise exception 'Access denied' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at,x.id),'[]') into ws from (select w.id,w.name,m.role,w.created_at from public.team_workspaces w join public.team_members m on m.workspace_id=w.id where m.user_id=a order by w.created_at,w.id limit 101)x;
 if jsonb_array_length(ws)>100 then raise exception 'Workspace list exceeds limit' using errcode='54000'; end if;
 if selected_workspace_id is not null then
  -- Lock against concurrent membership changes while gathering this snapshot.
  perform 1 from public.team_workspaces where id=selected_workspace_id for share;
  r:=public.team_role(selected_workspace_id);
  if r is null then raise exception 'Access denied' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.joined_at,x.user_id),'[]') into ms from (select user_id,role,joined_at from public.team_members where workspace_id=selected_workspace_id order by joined_at,user_id limit 1001)x;
  if r in ('owner','admin') then
   select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at,x.id),'[]') into inv from (select id,email,role,expires_at,revoked_at,accepted_at,created_at from public.team_invites where workspace_id=selected_workspace_id and revoked_at is null and accepted_at is null and expires_at>clock_timestamp() and (r='owner' or role='member') order by created_at,id limit 1001)x;
  end if;
  select jsonb_build_object('transferId',w.transfer_id,'userId',w.transfer_user_id,'expiresAt',w.transfer_expires_at) into pending from public.team_workspaces w where w.id=selected_workspace_id and w.transfer_expires_at>clock_timestamp() and exists(select 1 from public.team_members m where m.workspace_id=w.id and m.user_id=w.transfer_user_id and m.role<>'owner');
  if jsonb_array_length(ms)>1000 or jsonb_array_length(inv)>1000 then raise exception 'Team list exceeds limit' using errcode='54000'; end if;
 end if;
 return jsonb_build_object('actorId',a,'workspaces',ws,'workspaceId',selected_workspace_id,'members',ms,'invites',inv,'transfer',pending);
end $$;
revoke all on function public.team_snapshot(uuid,uuid) from public,anon;
grant execute on function public.team_snapshot(uuid,uuid) to authenticated;

create function public.team_mutate(payload jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare a uuid:=auth.uid(); act text; op uuid; w uuid; target uuid; r text; target_role text; keys text[]; k text;
 prior public.team_operations%rowtype; invitation public.team_invites%rowtype; result jsonb; safe_request jsonb; recipient uuid; pending_id uuid; pending_user uuid; pending_expiry timestamptz;
begin
 if a is null then raise exception 'Access denied' using errcode='42501'; end if;
 if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid request' using errcode='22023'; end if;
 act:=payload->>'action';
 keys:=case act when 'create' then array['name'] when 'invite' then array['workspaceId','email','role','tokenHash'] when 'accept' then array['workspaceId','tokenHash'] when 'revoke' then array['workspaceId','inviteId'] when 'role' then array['workspaceId','userId','role'] when 'remove' then array['workspaceId','userId'] when 'transfer' then array['workspaceId','userId'] when 'acceptTransfer' then array['workspaceId','transferId'] when 'cancelTransfer' then array['workspaceId','transferId'] else null end;
 if keys is null then raise exception 'Invalid action' using errcode='22023'; end if;
 keys:=keys||array['action','operationId','expectedActorId'];
 if not (payload ?& keys) or (select count(*) from jsonb_object_keys(payload))<>cardinality(keys) then raise exception 'Invalid fields' using errcode='22023'; end if;
 foreach k in array keys loop
  if jsonb_typeof(payload->k) is distinct from 'string' then raise exception 'Invalid field' using errcode='22023'; end if;
 end loop;
 if (payload->>'expectedActorId')::uuid is distinct from a then raise exception 'Access denied' using errcode='42501'; end if;
 op:=(payload->>'operationId')::uuid;
 if payload ? 'transferId' then pending_id:=(payload->>'transferId')::uuid; end if;
 if payload ? 'role' and payload->>'role' not in ('admin','member') then raise exception 'Invalid role' using errcode='22023'; end if;
 if payload ? 'tokenHash' and payload->>'tokenHash' !~ '^[0-9a-f]{64}$' then raise exception 'Invalid token' using errcode='22023'; end if;
 if act='create' and (length(payload->>'name') not between 1 and 100 or payload->>'name'<>btrim(payload->>'name')) then raise exception 'Invalid name' using errcode='22023'; end if;
 if act='invite' and (length(payload->>'email')>254 or payload->>'email'<>lower(payload->>'email') or payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'Invalid email' using errcode='22023'; end if;
 -- Same actor/operation serialized even across workspaces; no raw token reaches SQL.
 perform pg_advisory_xact_lock(hashtextextended(a::text||':'||op::text,0));
 -- Acquire per-user admission lock before any workspace lock on create/join.
 -- Shared namespace serializes different operation IDs and different workspaces.
 if act in ('create','accept') then perform pg_advisory_xact_lock(hashtextextended('team-membership:'||a::text,0)); end if;
 safe_request:=payload;
 select * into prior from public.team_operations where actor_id=a and operation_id=op;
 if act='create' then
  if not exists(select 1 from auth.users u where u.id=a and u.email_confirmed_at is not null) then raise exception 'Verified owner required' using errcode='42501'; end if;
  if prior.operation_id is not null then
   if prior.request<>safe_request then raise exception 'Operation conflict' using errcode='40001'; end if;
   perform 1 from public.team_workspaces where id=prior.workspace_id for update;
   if public.team_role(prior.workspace_id) is null then raise exception 'Access denied' using errcode='42501'; end if;
   return prior.result;
  end if;
  if (select count(*) from public.team_members where user_id=a)>=100 then raise exception 'Workspace membership limit reached' using errcode='54000'; end if;
  insert into public.team_workspaces(name) values(payload->>'name') returning id into w;
  insert into public.team_members(workspace_id,user_id,role) values(w,a,'owner');
  result:=jsonb_build_object('workspaceId',w,'name',payload->>'name');
 else
  w:=(payload->>'workspaceId')::uuid;
  select transfer_id,transfer_user_id,transfer_expires_at into pending_id,pending_user,pending_expiry from public.team_workspaces where id=w for update;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  r:=public.team_role(w);
  if act<>'accept' and r is null then raise exception 'Access denied' using errcode='42501'; end if;
  if act in ('invite','revoke') and r not in ('owner','admin') then raise exception 'Access denied' using errcode='42501'; end if;
  if act in ('role','transfer','cancelTransfer') and r<>'owner' then raise exception 'Access denied' using errcode='42501'; end if;
  if act='invite' and r='admin' and payload->>'role'<>'member' then raise exception 'Access denied' using errcode='42501'; end if;
  if prior.operation_id is not null then
   if prior.request<>safe_request or prior.workspace_id<>w then raise exception 'Operation conflict' using errcode='40001'; end if;
   -- Invite tokens are deliberately not recoverable through operation replay.
   if act='invite' then raise exception 'Revoke and recreate invitation' using errcode='40001'; end if;
   if r is null then raise exception 'Access denied' using errcode='42501'; end if;
   -- Ownership consent is single-use. No historical receipt can accept a later proposal.
   if act in ('transfer','acceptTransfer','cancelTransfer') then raise exception 'Reload ownership state' using errcode='40001'; end if;
   if act='remove' then
    select role into target_role from public.team_members where workspace_id=w and user_id=(payload->>'userId')::uuid;
    if (r='owner' and target_role is distinct from 'owner' or (r='admin' and prior.result->>'removedRole'='member' and (target_role is null or target_role='member')) or ((payload->>'userId')::uuid=a and r in ('admin','member') and prior.result->>'removedRole' in ('admin','member') and target_role in ('admin','member'))) is not true then raise exception 'Access denied' using errcode='42501'; end if;
   end if;
   if act='revoke' and r='admin' and not exists(select 1 from public.team_invites i where i.id=(payload->>'inviteId')::uuid and i.workspace_id=w and i.role='member') then raise exception 'Access denied' using errcode='42501'; end if;
   return prior.result;
  end if;
  if act in ('acceptTransfer','cancelTransfer') and (pending_id is null or (payload->>'transferId')::uuid is distinct from pending_id) then raise exception 'Transfer changed' using errcode='40001'; end if;
  if act='acceptTransfer' then
   if pending_user is distinct from a or pending_expiry is null or pending_expiry<=clock_timestamp() or r not in ('admin','member') or not exists(select 1 from auth.users u where u.id=a and u.email_confirmed_at is not null) then raise exception 'Transfer unavailable' using errcode='42501'; end if;
   update public.team_members set role='admin' where workspace_id=w and role='owner';
   update public.team_members set role='owner' where workspace_id=w and user_id=a;
   update public.team_workspaces set transfer_id=null,transfer_user_id=null,transfer_expires_at=null where id=w;
   result:=jsonb_build_object('workspaceId',w,'userId',a,'action',act);
  elsif act='cancelTransfer' then
   if pending_user is null or pending_expiry<=clock_timestamp() then raise exception 'Transfer unavailable' using errcode='42501'; end if;
   update public.team_workspaces set transfer_id=null,transfer_user_id=null,transfer_expires_at=null where id=w;
   result:=jsonb_build_object('workspaceId',w,'action',act);
  elsif act='invite' then
   if (select count(*) from public.team_invites where workspace_id=w and revoked_at is null and accepted_at is null and expires_at>clock_timestamp())>=1000 then raise exception 'Pending invitation limit reached' using errcode='54000'; end if;
   -- Unknown, unconfirmed or ambiguous recipients create an indistinguishable
   -- inert invitation. Never report lookup/membership status to the issuer.
   select case when count(*)=1 then (array_agg(u.id))[1] else null end into recipient from auth.users u where lower(u.email)=payload->>'email' and u.email_confirmed_at is not null;
   insert into public.team_invites(workspace_id,email,recipient_id,role,token_hash,issued_by) values(w,payload->>'email',recipient,payload->>'role',payload->>'tokenHash',a) returning * into invitation;
   result:=jsonb_build_object('inviteId',invitation.id,'workspaceId',w,'expiresAt',invitation.expires_at);
  elsif act='accept' then
   select * into invitation from public.team_invites where workspace_id=w and token_hash=payload->>'tokenHash' for update;
   if invitation.id is null or invitation.recipient_id is distinct from a or invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at<=clock_timestamp() or not exists(select 1 from auth.users u where u.id=a and u.email_confirmed_at is not null and lower(u.email)=invitation.email) then raise exception 'Invitation unavailable' using errcode='42501'; end if;
   -- Revalidate issuer authority at acceptance, not only at issuance.
   select role into target_role from public.team_members where workspace_id=w and user_id=invitation.issued_by;
   if target_role is null or target_role='member' or (target_role='admin' and invitation.role<>'member') then raise exception 'Invitation unavailable' using errcode='42501'; end if;
   if r is not null then raise exception 'Invitation unavailable' using errcode='42501'; end if;
   if (select count(*) from public.team_members where user_id=a)>=100 then raise exception 'Workspace membership limit reached' using errcode='54000'; end if;
   if (select count(*) from public.team_members where workspace_id=w)>=1000 then raise exception 'Workspace member limit reached' using errcode='54000'; end if;
   insert into public.team_members(workspace_id,user_id,role) values(w,a,invitation.role);
   update public.team_invites set accepted_at=clock_timestamp() where id=invitation.id;
   result:=jsonb_build_object('workspaceId',w,'userId',a,'role',invitation.role);
  elsif act='revoke' then
   select * into invitation from public.team_invites where id=(payload->>'inviteId')::uuid and workspace_id=w for update;
   if invitation.id is null or (r='admin' and invitation.role<>'member') then raise exception 'Access denied' using errcode='42501'; end if;
   update public.team_invites set revoked_at=coalesce(revoked_at,clock_timestamp()) where id=invitation.id;
   result:=jsonb_build_object('workspaceId',w,'inviteId',invitation.id,'revoked',true);
  else
   target:=(payload->>'userId')::uuid;
   select role into target_role from public.team_members where workspace_id=w and user_id=target;
   if target_role is null or target_role='owner' then raise exception 'Access denied; transfer ownership explicitly' using errcode='42501'; end if;
   if act='role' then
    update public.team_members set role=payload->>'role' where workspace_id=w and user_id=target;
   elsif act='remove' then
    if not (r='owner' or (r='admin' and target_role='member') or (a=target and r in ('admin','member'))) then raise exception 'Access denied' using errcode='42501'; end if;
    update public.team_workspaces set transfer_id=null,transfer_user_id=null,transfer_expires_at=null where id=w and transfer_user_id=target;
    delete from public.team_members where workspace_id=w and user_id=target;
    update public.team_invites set revoked_at=coalesce(revoked_at,clock_timestamp()) where workspace_id=w and (issued_by=target or recipient_id=target) and accepted_at is null;
   elsif act='transfer' then
    -- Do not silently replace a live proposal. The owner must cancel first.
    if pending_user is not null and pending_expiry>clock_timestamp() then raise exception 'Transfer already pending' using errcode='40001'; end if;
    update public.team_workspaces set transfer_id=gen_random_uuid(),transfer_user_id=target,transfer_expires_at=clock_timestamp()+interval '7 days' where id=w returning transfer_id,transfer_expires_at into pending_id,pending_expiry;
   end if;
   result:=jsonb_build_object('workspaceId',w,'userId',target,'action',act);
   if act='remove' then result:=result||jsonb_build_object('removedRole',target_role); end if;
   if act='transfer' then result:=result||jsonb_build_object('transferId',pending_id,'expiresAt',pending_expiry); end if;
  end if;
 end if;
 insert into public.team_operations(actor_id,operation_id,workspace_id,request,result) values(a,op,w,safe_request,result);
 return result;
end $$;
revoke all on function public.team_mutate(jsonb) from public,anon;
grant execute on function public.team_mutate(jsonb) to authenticated;
