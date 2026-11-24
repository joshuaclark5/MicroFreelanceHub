-- Isolated local candidate proof. Synthetic fixtures roll back.
begin;
do $$
declare actor uuid:=gen_random_uuid();today date:=(now() at time zone 'UTC')::date;day date:=today+14;rule jsonb;intake jsonb;portal jsonb;w jsonb;result jsonb;rejected boolean;request jsonb;
begin
 insert into auth.users(id) values(actor);perform set_config('request.jwt.claim.sub',actor::text,true);
 rule:=public.workspace_scheduling_mutate(jsonb_build_object('action','availability','operationId',gen_random_uuid(),'expectedActorId',actor,'title','Window fixture','timezone','UTC','weekday',0,'startMinute',0,'endMinute',1440,'duration',15,'buffer',0,'noticeHours',0,'horizonDays',30,'dailyCap',50,'recurrence',jsonb_build_object('weekdays',jsonb_build_array(0,1,2,3,4,5,6),'intervalWeeks',1,'startDate',day::text,'endDate',null,'excludedDates',jsonb_build_array((day+2)::text))));
 intake:=public.workspace_scheduling_mutate(jsonb_build_object('action','publish','operationId',gen_random_uuid(),'expectedActorId',actor,'title','Window questions','consent','Fixture only','fields',jsonb_build_array(jsonb_build_object('id','q1','label','Topic','required',true))));
 portal:=public.public_booking_config(jsonb_build_object('expectedActorId',actor,'expectedVersion',0,'availabilityId',rule->>'id','intakeId',intake->>'id','enabled',true,'rotate',false));
 w:=public.public_booking_window(portal->>'token');if jsonb_array_length(w->'slots')<>0 or (w->>'nextStart')::date<>today+7 then raise exception 'empty initial window not navigable';end if;
 w:=public.public_booking_window(portal->>'token',day);if jsonb_array_length(w->'slots')<>100 or (w->>'nextStart')::date<>day+1 then raise exception '100 slot pagination may skip a day';end if;
 if w ?| array['owner_id','availability_id','bookings','busy'] then raise exception 'private data projected';end if;
 w:=public.public_booking_window(portal->>'token',(w->>'nextStart')::date,(w->>'nextAfter')::timestamptz);if jsonb_array_length(w->'slots')<>100 or exists(select 1 from jsonb_array_elements_text(w->'slots') s where (s::timestamptz at time zone 'UTC')::date=day+2) then raise exception 'exclusion or capped window incorrect';end if;
 w:=public.public_booking_window(portal->>'token',today+30);if w->'nextStart'<>'null'::jsonb or (w->>'windowEnd')::date<>today+30 then raise exception 'horizon navigation incorrect';end if;
 rejected:=false;begin perform public.public_booking_window(portal->>'token',today-1);exception when others then rejected:=true;end;if not rejected then raise exception 'past window accepted';end if;
 rejected:=false;begin perform public.public_booking_window(portal->>'token',today+31);exception when others then rejected:=true;end;if not rejected then raise exception 'beyond horizon window accepted';end if;
 request:=jsonb_build_object('operationId',gen_random_uuid(),'portalVersion',1,'startsAt',day::text||'T12:00:00.000Z','attendee','Fictional guest','answers',jsonb_build_object('q1','Fixture'),'consented',true);
 result:=public.public_booking_service(portal->>'token',request);if result->'confirmed'<>'true'::jsonb or public.public_booking_service(portal->>'token',request)<>result then raise exception 'later booking or retry failed';end if;
 rejected:=false;begin perform public.public_booking_service(portal->>'token',request||jsonb_build_object('operationId',gen_random_uuid(),'startsAt',(today+31)::text||'T12:00:00.000Z'));exception when others then rejected:=true;end;if not rejected then raise exception 'beyond horizon booking accepted';end if;
 if has_function_privilege('authenticated','public.public_booking_window(text,date,timestamptz)','EXECUTE') or has_function_privilege('anon','public.public_booking_window(text,date,timestamptz)','EXECUTE') then raise exception 'privileged window exposed';end if;
 raise notice 'PASS later windows, 100-slot cursor continuity, exclusions, horizons, later booking/retry, minimal projection and grants';
end $$;
rollback;
