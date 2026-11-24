// Local performance characterization, not hosted latency or a load-test claim.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const container='mfh-recurrence-restore-20261124',database='time_off_prototype_'+Date.now(),out='artifacts/time-off-boundary-performance';fs.mkdirSync(out,{recursive:true});
function sync(args){const r=cp.spawnSync('docker',args,{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout;}
function sql(input){return new Promise((resolve,reject)=>{const p=cp.spawn('docker',['exec','-i',container,'psql','-U','supabase_admin','-d',database,'-At','-v','ON_ERROR_STOP=1'],{windowsHide:true});let stdout='',stderr='';p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);const timer=setTimeout(()=>p.kill(),120000);p.on('exit',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(Error(stderr||'SQL timeout'));});p.stdin.end(input);});}
(async()=>{
assert.equal(sync(['inspect','--format','{{.HostConfig.NetworkMode}} {{json .HostConfig.PortBindings}}',container]).trim(),'none {}');
sync(['exec',container,'createdb','-U','supabase_admin','-T','staging_recurrence',database]);
for(const file of ['global-time-off-prototype.sql','global-time-off-lifecycle-prototype.sql'])await sql(fs.readFileSync('scripts/workspace-review/'+file,'utf8').replace(/^\uFEFF/,''));
const output=await sql(`
create temporary table measurements(label text,first_day date,last_day date,zone text,expected_hours numeric,iteration integer,elapsed_ms numeric,actual_hours numeric);
do $$ declare c record; n integer; started timestamptz; result jsonb; owner uuid:=gen_random_uuid(); begin
 insert into auth.users(id) values(owner);perform set_config('request.jwt.claim.sub',owner::text,true);
 for c in select * from (values
 ('NY spring','2027-03-14'::date,'2027-03-14'::date,'America/New_York',23::numeric),
 ('NY fall','2027-11-07','2027-11-07','America/New_York',25),
 ('Five spring days','2027-03-12','2027-03-16','America/New_York',119),
 ('Five fall days','2027-11-05','2027-11-09','America/New_York',121),
 ('Repeated midnight','2027-11-07','2027-11-07','America/Havana',25),
 ('Midnight gap','2018-11-04','2018-11-04','America/Sao_Paulo',23),
 ('Half hour spring','2027-10-03','2027-10-03','Australia/Lord_Howe',23.5),
 ('Half hour fall','2027-04-04','2027-04-04','Australia/Lord_Howe',24.5),
 ('Two hour spring','2027-03-28','2027-03-28','Antarctica/Troll',22),
 ('Quarter offset','2028-02-29','2028-02-29','Asia/Kathmandu',24),
 ('Skipped date span','2011-12-29','2011-12-31','Pacific/Apia',48),
 ('Leap year UTC','2028-01-01','2028-12-31','UTC',8784)
 ) v(label,first_day,last_day,zone,expected_hours) loop
  for n in 1..4 loop
   started:=clock_timestamp();result:=prototype_time_off_preview(c.first_day,c.last_day,c.zone);
   insert into measurements values(c.label,c.first_day,c.last_day,c.zone,c.expected_hours,n,extract(epoch from clock_timestamp()-started)*1000,extract(epoch from (result->>'endsAt')::timestamptz-(result->>'startsAt')::timestamptz)/3600);
  end loop;
 end loop;
end $$;
select jsonb_build_object('samples',(select jsonb_agg(m order by label,iteration) from measurements m),'count',(select count(*) from measurements),'meanMs',(select avg(elapsed_ms) from measurements),'p95Ms',(select percentile_cont(0.95) within group(order by elapsed_ms) from measurements),'maxMs',(select max(elapsed_ms) from measurements),'hoursCorrect',(select bool_and(actual_hours=expected_hours) from measurements));
`);
fs.writeFileSync(out+'/raw.txt',output);const result=JSON.parse(output.split(/\r?\n/).find(s=>s.startsWith('{')));assert.equal(result.count,48);assert.equal(result.hoursCorrect,true);
const report={at:new Date().toISOString(),database,network:'none',hostedChanges:false,scope:'Database-only preview, two exhaustive boundary calculations, empty fictional owner; four repetitions of 12 civil-date cases. Not populated-owner, HTTP or hosted load performance.',...result};fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({database,count:result.count,hoursCorrect:result.hoursCorrect,meanMs:result.meanMs,p95Ms:result.p95Ms,maxMs:result.maxMs}));
})().catch(e=>{fs.writeFileSync(out+'/failure.txt',e.stack);console.error(e);process.exitCode=1;});
