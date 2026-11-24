-- Run only in the isolated restored test database. All fixtures are rolled back.
begin;
do $$
declare r jsonb:=jsonb_build_object('weekdays',jsonb_build_array(1,5),'intervalWeeks',2,'startDate','2026-12-28','endDate','2027-02-01','excludedDates',jsonb_build_array('2027-01-15'));bad jsonb;
begin
 if not public.workspace_recurrence_valid(r) then raise exception 'valid recurrence rejected';end if;
 if not public.workspace_availability_matches(0,r,'2027-01-01') or public.workspace_availability_matches(0,r,'2027-01-08') or public.workspace_availability_matches(0,r,'2027-01-15') or not public.workspace_availability_matches(0,r,'2027-01-25') or public.workspace_availability_matches(0,r,'2027-02-05') then raise exception 'year boundary, alternate week, end or closure mismatch';end if;
 if not public.workspace_availability_matches(5,null,'2027-01-01') or public.workspace_availability_matches(1,null,'2027-01-01') then raise exception 'legacy weekly behavior changed';end if;
 foreach bad in array array[r||'{"weekdays":[]}'::jsonb,r||'{"weekdays":[1,1]}'::jsonb,r||'{"weekdays":[7]}'::jsonb,r||'{"weekdays":["1"]}'::jsonb,r||'{"intervalWeeks":0}'::jsonb,r||'{"intervalWeeks":1.5}'::jsonb,r||'{"startDate":"2026-02-30"}'::jsonb,r||'{"endDate":"2026-01-01"}'::jsonb,r||'{"excludedDates":["2027-02-30"]}'::jsonb,r||'{"excludedDates":["2027-01-15","2027-01-15"]}'::jsonb,r||'{"unknown":true}'::jsonb,'null'::jsonb] loop
  if public.workspace_recurrence_valid(bad) then raise exception 'invalid recurrence accepted: %',bad;end if;
 end loop;
 raise notice 'PASS validation, legacy matching, multi-day, alternate weeks/year boundary, end and days off';
end $$;
do $$
declare actor uuid:=gen_random_uuid(); day date:=(now() at time zone 'UTC')::date+2; rec jsonb; request jsonb; rule jsonb; intake jsonb; portal jsonb; slots jsonb; booking jsonb; invalid_day date; rejected boolean; result jsonb;
begin
 insert into auth.users(id) values(actor);
 perform set_config('request.jwt.claim.sub',actor::text,true);
 rec:=jsonb_build_object('weekdays',jsonb_build_array(extract(dow from day)::int,extract(dow from day+1)::int),'intervalWeeks',2,'startDate',day::text,'endDate',(day+60)::text,'excludedDates',jsonb_build_array((day+1)::text));
 request:=jsonb_build_object('action','availability','operationId',gen_random_uuid(),'expectedActorId',actor,'title','Recurrence fixture','timezone','UTC','weekday',extract(dow from day)::int,'startMinute',540,'endMinute',1020,'duration',30,'buffer',0,'noticeHours',0,'horizonDays',90,'dailyCap',8,'recurrence',rec);
 rule:=public.workspace_scheduling_mutate(request);
 if rule->'recurrence'<>rec or public.workspace_scheduling_mutate(request)<>rule then raise exception 'recurrence or retry receipt mismatch';end if;
 rejected:=false;begin perform public.workspace_scheduling_mutate(request||jsonb_build_object('recurrence',rec||'{"intervalWeeks":1}'::jsonb));exception when others then rejected:=true;end;if not rejected then raise exception 'changed retry accepted';end if;
 intake:=public.workspace_scheduling_mutate(jsonb_build_object('action','publish','operationId',gen_random_uuid(),'expectedActorId',actor,'title','Fixture questions','consent','Fixture only','fields',jsonb_build_array(jsonb_build_object('id','q1','label','Topic','required',true))));
 portal:=public.public_booking_config(jsonb_build_object('expectedActorId',actor,'expectedVersion',0,'availabilityId',rule->>'id','intakeId',intake->>'id','enabled',true,'rotate',false));
 slots:=public.public_booking_service(portal->>'token')->'slots';
 if jsonb_array_length(slots)=0 then raise exception 'expected public slots missing';end if;
 if exists(select 1 from jsonb_array_elements_text(slots) s where not public.workspace_availability_matches(0,rec,(s::timestamptz at time zone 'UTC')::date)) then raise exception 'public listing ignores recurrence';end if;
 booking:=jsonb_build_object('action','book','operationId',gen_random_uuid(),'expectedActorId',actor,'availabilityId',rule->>'id','expectedVersion',1,'intakeId',intake->>'id','startsAt',day::text||'T09:00:00.000Z','attendee','Fictional guest','answers',jsonb_build_object('q1','Fixture'),'consented',true);
 foreach invalid_day in array array[day+1,day+2,day+7,day+61] loop
  rejected:=false;begin perform public.workspace_scheduling_mutate(booking||jsonb_build_object('operationId',gen_random_uuid(),'startsAt',invalid_day::text||'T09:00:00.000Z'));exception when others then rejected:=true;end;if not rejected then raise exception 'private invalid day accepted %',invalid_day;end if;
 end loop;
 result:=public.public_booking_service(portal->>'token',jsonb_build_object('operationId',gen_random_uuid(),'portalVersion',1,'startsAt',day::text||'T09:00:00.000Z','attendee','Fictional public guest','answers',jsonb_build_object('q1','Fixture'),'consented',true));
 if result->'confirmed'<>'true'::jsonb then raise exception 'public booking not confirmed';end if;
 rejected:=false;begin perform public.workspace_scheduling_mutate(booking);exception when others then rejected:=true;end;if not rejected then raise exception 'cross-path double booking';end if;
 perform public.workspace_scheduling_mutate(booking||jsonb_build_object('operationId',gen_random_uuid(),'startsAt',(day+14)::text||'T09:00:00.000Z'));
 if (select count(*) from public.workspace_scheduling_bookings where owner_id=actor)<>2 then raise exception 'wrong booking count';end if;
 rejected:=false;begin update public.workspace_scheduling_availability set recurrence=rec||'{"intervalWeeks":1}'::jsonb where id=(rule->>'id')::uuid;exception when others then rejected:=true;end;if not rejected then raise exception 'immutable rule modified';end if;
 raise notice 'PASS RPC multi-day/closure/alternate-week enforcement, public listing/booking, retry, cross-path overlap and immutable rules';
end $$;
rollback;
