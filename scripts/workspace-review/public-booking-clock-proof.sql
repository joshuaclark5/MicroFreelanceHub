-- Isolated PostgreSQL only: freeze the listing clock, then roll back function and fixtures.
begin;
do $$
declare original text:=pg_get_functiondef('public.public_booking_window(text,date,timestamptz)'::regprocedure);zone text;day date;actor uuid;rule jsonb;intake jsonb;portal jsonb;w jsonb;second jsonb;total integer;
begin
 foreach zone in array array['Antarctica/Troll','America/New_York','Australia/Lord_Howe'] loop
 day:=case zone when 'Antarctica/Troll' then date '2026-10-25' when 'America/New_York' then date '2026-11-01' else date '2026-04-05' end;
 execute replace(original,'now()',quote_literal((day-1)::text||'T12:00:00Z')||'::timestamptz');
 actor:=gen_random_uuid();insert into auth.users(id) values(actor);perform set_config('request.jwt.claim.sub',actor::text,true);
 rule:=public.workspace_scheduling_mutate(jsonb_build_object('action','availability','operationId',gen_random_uuid(),'expectedActorId',actor,'title','Clock fixture','timezone',zone,'weekday',0,'startMinute',0,'endMinute',1440,'duration',15,'buffer',0,'noticeHours',0,'horizonDays',30,'dailyCap',50,'recurrence',jsonb_build_object('weekdays',jsonb_build_array(0,1,2,3,4,5,6),'intervalWeeks',1,'startDate',day::text,'endDate',day::text,'excludedDates',jsonb_build_array())));
 intake:=public.workspace_scheduling_mutate(jsonb_build_object('action','publish','operationId',gen_random_uuid(),'expectedActorId',actor,'title','Clock questions','consent','Fixture only','fields',jsonb_build_array(jsonb_build_object('id','q1','label','Topic','required',true))));
 portal:=public.public_booking_config(jsonb_build_object('expectedActorId',actor,'expectedVersion',0, 'availabilityId',rule->>'id','intakeId',intake->>'id','enabled',true,'rotate',false));
 w:=public.public_booking_window(portal->>'token',day);
 total:=jsonb_array_length(w->'slots');
 if zone='Antarctica/Troll' then
 if total<>100 or (w->>'nextStart')::date<>day or w->>'nextAfter' is null then raise exception 'long day did not provide instant continuation';end if;
 second:=public.public_booking_window(portal->>'token',(w->>'nextStart')::date,(w->>'nextAfter')::timestamptz);
 if jsonb_array_length(second->'slots')<1 or exists(select 1 from jsonb_array_elements_text(second->'slots') s where s::timestamptz<=(w->>'nextAfter')::timestamptz) then raise exception 'long day remainder lost or repeated';end if;
 total:=total+jsonb_array_length(second->'slots');
 end if;
 -- Full-day 15-minute starts: 26h/25h/24.5h minus one slot crossing the backwards transition.
 if total<>(case zone when 'Antarctica/Troll' then 103 when 'America/New_York' then 99 else 97 end) then raise exception 'clock transition choices missing in %: %',zone,total;end if;
 raise notice 'PASS %: all % distinct instants reachable',zone,total;
 end loop;
end $$;
rollback;
