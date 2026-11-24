-- Local-only containment rollback proof. Saved closures and guards MUST remain.
begin;
do $$ begin if current_database() !~ '^time_off_release_[0-9]+$' then raise exception 'Disposable release database required';end if;end $$;
revoke execute on function public.workspace_time_off_request(jsonb) from authenticated;
do $$
declare c record; preview jsonb; blocked boolean:=false; before_count bigint;
begin
 if has_function_privilege('authenticated','public.workspace_time_off_request(jsonb)','EXECUTE') then raise exception 'Wrapper remains callable';end if;
 select t.*,p.token,r.id rule_id,r.version rule_version,p.intake_id into c from public.workspace_scheduling_time_off t join public.workspace_public_booking p on p.owner_id=t.owner_id and p.enabled join public.workspace_scheduling_availability r on r.id=p.availability_id and r.active where t.active order by t.starts_at,t.id limit 1;
 if c.id is null then raise exception 'Active synthetic closure fixture required';end if;
 preview:=public.public_booking_window(c.token,c.starts_on,null);
 if exists(select 1 from jsonb_array_elements_text(preview->'slots') s where s::timestamptz>=c.starts_at and s::timestamptz<c.ends_at) then raise exception 'Rollback reopened public slots';end if;
 select count(*) into before_count from public.workspace_scheduling_bookings where owner_id=c.owner_id;
 perform set_config('request.jwt.claim.sub',c.owner_id::text,true);
 begin
  perform public.workspace_scheduling_mutate(jsonb_build_object('action','book','operationId',gen_random_uuid()::text,'expectedActorId',c.owner_id,'availabilityId',c.rule_id,'expectedVersion',c.rule_version,'intakeId',c.intake_id,'startsAt',to_char(c.starts_at+interval '12 hours','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'attendee','Fictional rollback check','answers','{}'::jsonb,'consented',true));
 exception when sqlstate 'P0001' then
  if position('Owner-wide time off' in sqlerrm)>0 then blocked:=true;else raise;end if;
 end;
 if not blocked then raise exception 'Rollback allowed a blocked booking';end if;
 if before_count<>(select count(*) from public.workspace_scheduling_bookings where owner_id=c.owner_id) then raise exception 'Rollback changed bookings';end if;
end $$;
rollback;
select has_function_privilege('authenticated','public.workspace_time_off_request(jsonb)','EXECUTE') as wrapper_restored;
