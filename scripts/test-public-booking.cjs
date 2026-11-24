const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),crypto=require('crypto');
const {PGlite}=require(process.env.PGLITE_MODULE||'C:/Users/joshu/mfh-payment-sql-proof/node_modules/@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),A=crypto.randomUUID(),B=crypto.randomUUID(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'mfh-public-booking-')),checks=[];let db;
const q=(s,p=[])=>db.query(s,p),check=async(n,f)=>{await f();checks.push(n);console.log('PASS '+n);};
async function role(r='service_role',actor=''){await db.exec('reset role');await q("select set_config('request.jwt.claim.sub',$1,false)",[actor]);await db.exec('set role '+r);}
const mutate=async(action,extra={},actor=A)=>(await q('select workspace_scheduling_mutate($1::jsonb) r',[JSON.stringify({action,operationId:crypto.randomUUID(),expectedActorId:actor,...extra})])).rows[0].r;
const config=async body=>(await q('select public_booking_config($1::jsonb) r',[JSON.stringify(body)])).rows[0].r;
const service=async(token,payload=null)=>(await q('select public_booking_service($1,$2::jsonb) r',[token,payload===null?null:JSON.stringify(payload)])).rows[0].r;
const throttle=async(token,writing=false,id='a'.repeat(64))=>(await q('select public_booking_throttle($1,$2,$3) r',[token,id,writing])).rows[0].r;
const denied=async f=>assert.rejects(f);
function load(file,mocks={},env={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,Buffer,Date,Request,Response,TextDecoder,Uint8Array,process:{env},require:n=>{if(n==='server-only')return {};if(n==='node:crypto')return crypto;if(!(n in mocks))throw Error('Unexpected import '+n);return mocks[n];}});return exports;}
(async()=>{db=new PGlite(dir);
await db.exec("create role service_role nologin nosuperuser bypassrls;create role authenticated nologin nosuperuser nobypassrls;create role anon nologin nosuperuser nobypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon,service_role;grant execute on function auth.uid() to authenticated,anon,service_role;");
await q('insert into auth.users values($1),($2)',[A,B]);
for(const f of ['20261118020000_workspace_scheduling.sql','20261118090000_workspace_calendar.sql','20261121000000_public_booking.sql','20261124000000_weekly_recurrence.sql','20261124010000_public_booking_windows.sql'])await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',f),'utf8'));
const date=new Date(Date.now()+3*86400000);date.setUTCHours(12,0,0,0);let rule,intake,portal;
await role('authenticated',A);
await check('no existing owner is auto enabled; real owner scheduling/configuration RPCs',async()=>{
assert.equal((await q('select * from workspace_public_booking')).rows.length,0);
rule=await mutate('availability',{title:'Fictional consultation',timezone:'UTC',weekday:date.getUTCDay(),startMinute:540,endMinute:1020,duration:30,buffer:10,noticeHours:1,horizonDays:30,dailyCap:3});
intake=await mutate('publish',{title:'Fictional questions',consent:'Answers shared with host',fields:[{id:'q1',label:'Discussion topic',required:true}]});
portal=await config({expectedActorId:A,expectedVersion:0,availabilityId:rule.id,intakeId:intake.id,enabled:false,rotate:false});assert.match(portal.token,/^[a-f0-9]{64}$/);
await role();await denied(()=>service(portal.token));await role('authenticated',A);
portal=await config({expectedActorId:A,expectedVersion:1,availabilityId:rule.id,intakeId:intake.id,enabled:true,rotate:false});
});
const body=(extra={})=>({operationId:crypto.randomUUID(),portalVersion:portal.version,startsAt:date.toISOString(),attendee:'Fictional guest',answers:{q1:'Fictional discussion'},consented:true,...extra});
await check('browser roles cannot reach privileged SQL or another owner settings',async()=>{
for(const r of ['anon','authenticated']){await role(r,B);for(const t of ['workspace_public_booking_receipts','workspace_public_booking_limits'])await denied(()=>q('select * from '+t));await denied(()=>service(portal.token));await denied(()=>throttle(portal.token));}
await role('authenticated',B);assert.equal((await q('select * from workspace_public_booking')).rows.length,0);
await denied(()=>config({expectedActorId:B,expectedVersion:0,availabilityId:rule.id,intakeId:intake.id,enabled:true,rotate:false}));
await role();
});
await check('minimal public projection and actual SQL filters',async()=>{
const result=await service(portal.token);assert.deepEqual(Object.keys(result).sort(),['consent','duration','fields','portalVersion','slots','timezone','title']);
assert.ok(result.slots.includes(date.toISOString()));assert.ok(result.slots.length<=100);assert.ok(!JSON.stringify(result).includes(A));assert.ok(!JSON.stringify(result).includes(rule.id));
for(const extra of [{answers:{}},{answers:{q2:'forged'}},{consented:false},{attendee:null},{startsAt:new Date(date.getTime()+60000).toISOString()},{startsAt:new Date(date.getTime()+35*86400000).toISOString()},{portalVersion:0},{owner_id:B},{operationId:null}])await denied(()=>service(portal.token,body(extra)));
});
let accepted;
await check('20 competing public submissions admit exactly one, retry is idempotent',async()=>{
const requests=Array.from({length:20},()=>body());const results=await Promise.allSettled(requests.map(p=>service(portal.token,p)));assert.equal(results.filter(x=>x.status==='fulfilled').length,1);const index=results.findIndex(x=>x.status==='fulfilled');accepted=requests[index];const receipt=results[index].value;
assert.deepEqual(Object.keys(receipt).sort(),['confirmed','endsAt','startsAt','timezone']);assert.deepEqual(await service(portal.token,accepted),receipt);await denied(()=>service(portal.token,{...accepted,attendee:'changed'}));
assert.ok(!(await service(portal.token)).slots.includes(date.toISOString()));
await denied(()=>service(portal.token,body({startsAt:new Date(date.getTime()+30*60000).toISOString()})));
await db.exec('reset role');assert.equal((await q("select count(*)::int n from workspace_scheduling_bookings where status='confirmed'")).rows[0].n,1);await role();
});
await check('calendar actual trigger rejects stale, uncovered and busy slots; listing fails closed',async()=>{
await db.exec('reset role');await q("insert into workspace_calendar_connections(owner_id,status,synced_at,window_start,window_end) values($1,'connected',now()-interval '6 minutes',now(),now()+interval '7 days')",[A]);await role();assert.equal((await service(portal.token)).slots.length,0);
const next=new Date(date.getTime()+120*60000).toISOString();await denied(()=>service(portal.token,body({startsAt:next})));
await db.exec('reset role');await q('update workspace_calendar_connections set synced_at=now() where owner_id=$1',[A]);await q('insert into workspace_calendar_busy values($1,$2,$3)',[A,next,new Date(Date.parse(next)+1800000).toISOString()]);await role();
assert.ok(!(await service(portal.token)).slots.includes(next));await denied(()=>service(portal.token,body({startsAt:next})));
await db.exec('reset role');await q("update workspace_calendar_connections set window_end=now()+interval '1 day' where owner_id=$1",[A]);await role();assert.equal((await service(portal.token)).slots.length,0);await denied(()=>service(portal.token,body({startsAt:next})));
await db.exec('reset role');await q("update workspace_calendar_connections set status='disconnected' where owner_id=$1",[A]);await role();
});
await check('private booking path shares overlap lock and public daily cap',async()=>{
await role('authenticated',A);await denied(()=>mutate('book',{availabilityId:rule.id,expectedVersion:1,intakeId:intake.id,startsAt:date.toISOString(),attendee:'Private',answers:{q1:'Private'},consented:true}));await role();
await service(portal.token,body({startsAt:new Date(date.getTime()+120*60000).toISOString()}));
await service(portal.token,body({startsAt:new Date(date.getTime()+240*60000).toISOString()}));
assert.equal((await service(portal.token)).slots.length,0);
await denied(()=>service(portal.token,body({startsAt:new Date(date.getTime()+60*60000).toISOString()})));
});
await check('durable separate abuse limits survive failed bookings, per identity and portal-wide',async()=>{
for(let i=0;i<5;i++)assert.equal(await throttle(portal.token,true),true);assert.equal(await throttle(portal.token,true),false);
await denied(()=>service(portal.token,body({answers:{}})));assert.equal(await throttle(portal.token,true),false);
for(let i=0;i<23;i++)assert.equal(await throttle(portal.token,true,crypto.createHash('sha256').update(String(i)).digest('hex')),true);
assert.equal(await throttle(portal.token,true,'b'.repeat(64)),false);
await db.exec('reset role');await q("update workspace_public_booking_limits set expires_at=now()-interval '1 second'");await role();assert.equal(await throttle(portal.token,true),true);
});
await check('version CAS, rotation and disable invalidate old capabilities without changing bookings',async()=>{
const old=portal.token;await role('authenticated',A);
await denied(()=>config({expectedActorId:A,expectedVersion:1,availabilityId:rule.id,intakeId:intake.id,enabled:true,rotate:false}));
portal=await config({expectedActorId:A,expectedVersion:2,availabilityId:rule.id,intakeId:intake.id,enabled:true,rotate:true});assert.notEqual(old,portal.token);await role();await denied(()=>service(old));await denied(()=>service(portal.token,accepted));
await role('authenticated',A);portal=await config({expectedActorId:A,expectedVersion:3,availabilityId:rule.id,intakeId:intake.id,enabled:false,rotate:false});await role();await denied(()=>service(portal.token));
await role('authenticated',A);portal=await config({expectedActorId:A,expectedVersion:4,availabilityId:rule.id,intakeId:intake.id,enabled:true,rotate:false});await role();
});
const scheduling=load('app/lib/workspaceScheduling.ts'),input=load('app/lib/publicBooking.ts',{'./workspaceScheduling':scheduling});
const env={PUBLIC_BOOKING_ENABLED:'true',NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fictional-server-key'};
let rpcCalls=0;
const rpc=async(name,args)=>{rpcCalls++;await role();try{const data=name==='public_booking_throttle'?await throttle(args.handle,args.writing,args.identity_hash):name==='public_booking_window'?(await q('select public_booking_window($1,$2::date) r',[args.handle,args.starts_on])).rows[0].r:await service(args.handle,args.payload);return {data,error:null};}catch(e){return {data:null,error:{code:e.code}};}};
const lib=load('app/lib/server/publicBooking.ts',{'@supabase/supabase-js':{createClient:()=>({rpc})}},env);
const route=load('app/api/public-booking/[token]/route.ts',{'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},'../../../lib/publicBooking':input,'../../../lib/server/publicBooking':lib});
const url='https://fixture.invalid/api/public-booking/'+portal.token;
const get=()=>route.GET(new Request(url),{params:{token:portal.token}});
const post=(payload,headers={},raw)=>route.POST(new Request(url,{method:'POST',headers:{origin:'https://fixture.invalid','content-type':'application/json',...headers},body:raw??JSON.stringify(payload)}),{params:{token:portal.token}});
const challenge=()=>lib.bookingChallenge(env.SUPABASE_SERVICE_ROLE_KEY,portal.token,Date.now()-3000);
await check('actual API validation executes before privileged RPC; bounded streaming JSON',async()=>{
const before=rpcCalls;for(const suffix of ['?start=2027-02-30','?start=2027-01-01&start=2027-01-02','?owner=bad','?start='])assert.equal((await route.GET(new Request(url+suffix),{params:{token:portal.token}})).status,404);const valid={...body(),challenge:challenge(),website:''};
for(const [extra,headers]of [[{ownerId:A},{}],[{attendee:''},{}],[{answers:{q9:'bad'}},{}],[{startsAt:'2027-02-30T12:00:00.000Z'},{}],[{website:'bot'},{}],[{consented:false},{}],[{challenge:'invalid'},{}],[{},{origin:'https://evil.invalid'}],[{},{'content-type':'text/plain'}]]){
assert.ok((await post({...valid,...extra},headers)).status>=400);}
assert.equal((await post(valid,{},' '.repeat(22001))).status,400);assert.equal((await post(valid,{},'{')).status,400);assert.equal(rpcCalls,before);
const malicious={...valid,answers:JSON.parse('{"__proto__":"bad"}')};assert.equal((await post(malicious)).status,400);
});
await check('real HMAC challenges bound to handle, minimum delay and expiry',async()=>{
const c=challenge();assert.equal(lib.verifyBookingChallenge(env.SUPABASE_SERVICE_ROLE_KEY,portal.token,c),true);
assert.equal(lib.verifyBookingChallenge(env.SUPABASE_SERVICE_ROLE_KEY,'b'.repeat(64),c),false);
assert.equal(lib.verifyBookingChallenge(env.SUPABASE_SERVICE_ROLE_KEY,portal.token,lib.bookingChallenge(env.SUPABASE_SERVICE_ROLE_KEY,portal.token)),false);
assert.equal(lib.verifyBookingChallenge(env.SUPABASE_SERVICE_ROLE_KEY,portal.token,c,Date.now()+16*60000),false);
assert.equal(lib.bookingIdentity('key',new Request(url,{headers:{'x-forwarded-for':'1.1.1.1'}})),lib.bookingIdentity('key',new Request(url,{headers:{'x-forwarded-for':'2.2.2.2'}})));
});
await check('actual API to actual SQL returns minimal data and receipt, no-store/noindex',async()=>{
// Cancel one booking through the existing owner RPC to create a real slot.
await role('authenticated',A);const b=(await q('select id,version from workspace_scheduling_bookings where starts_at=$1',[date.toISOString()])).rows[0];await mutate('cancel',{id:b.id,expectedVersion:b.version});await role();
const response=await get(),listing=await response.json();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.match(response.headers.get('x-robots-tag'),/noindex/);assert.ok(listing.slots.includes(date.toISOString()));
const payload={...body(),challenge:challenge(),website:''};const saved=await post(payload);assert.equal(saved.status,200);const receipt=await saved.json();assert.equal(receipt.confirmed,true);assert.deepEqual(await (await post(payload)).json(),receipt);assert.ok(!JSON.stringify(receipt).includes('attendee'));
});
await check('standalone public document has no analytics and strong response headers',async()=>{
const document=load('app/lib/server/bookingDocument.ts'),page=load('app/book/[token]/route.ts',{'../../lib/publicBooking':input,'../../lib/server/bookingDocument':document});
const response=page.GET(new Request(url),{params:{token:portal.token}}),html=await response.text();
assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.match(html,/noindex,nofollow/);assert.ok(!html.includes('googletagmanager'));assert.ok(!html.includes(portal.token));assert.match(html,/textContent/);
const script=html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1];new vm.Script(script);
assert.equal(page.GET(new Request(url),{params:{token:'bad'}}).status,404);
});
await check('actual browser mobile and desktop flows through real handlers and SQL',async()=>{
const document=load('app/lib/server/bookingDocument.ts'),page=load('app/book/[token]/route.ts',{'../../lib/publicBooking':input,'../../lib/server/bookingDocument':document});
const proof=await require('./public-booking-browser-proof.cjs')({pageHandler:page,apiHandler:route,token:portal.token,prepare:async()=>{
 await role('authenticated',A);const bookings=(await q("select id,version from workspace_scheduling_bookings where status='confirmed'")).rows;for(const b of bookings)await mutate('cancel',{id:b.id,expectedVersion:b.version});
 await db.exec('reset role');await q("update workspace_public_booking_limits set expires_at=now()-interval '1 second'");await role();return {laterDate:new Date(date.getTime()+14*86400000).toISOString().slice(0,10)};
}});console.log(proof);
});
console.log(JSON.stringify({passed:checks.length,checks,database:dir,limitations:['Disposable actual scheduling/calendar/public SQL, fictional auth users.','Embedded single-backend contention is not independent PostgreSQL connection proof.','Supabase SDK transport maps to actual disposable SQL; no live provider or deployed Next routing proof.']}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(db)await db.close();});
