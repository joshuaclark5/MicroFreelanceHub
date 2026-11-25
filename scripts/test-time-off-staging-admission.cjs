const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),dotenv=require('dotenv');const {createClient}=require('@supabase/supabase-js'),{stringifySupabaseSession}=require('@supabase/auth-helpers-shared');const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const privateRoot='C:/Users/joshu/mfh-private-backups/time-off-staging-1795561114729/',out='artifacts/time-off-staging-admission';fs.mkdirSync(out,{recursive:true});const env=dotenv.parse(fs.readFileSync(privateRoot+'http-app.env')),origin='http://localhost:3064',ref='lfzaivnvoyvdmvvijnoq';assert.equal(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname,ref+'.supabase.co');for(const k of ['NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'])assert.equal(JSON.parse(Buffer.from(env[k].split('.')[1],'base64url')).ref,ref);const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});let actor,browser,cookie,portal,range;const report={project:ref,origin,checks:[],productionChanges:false};
async function api(route,body,auth=true){const response=await fetch(origin+route,{method:body?'POST':'GET',headers:{...(auth?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const data=await response.json();assert.equal(response.status,200,route+' HTTP '+response.status+' '+(data.error||''));return data;}
async function rejected(route,body,auth=true){const r=await fetch(origin+route,{method:'POST',headers:{...(auth?{Cookie:cookie}:{}),'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});assert.equal(r.status,409);}
(async()=>{
 let found=false;for(const file of fs.readdirSync('.next/static/chunks',{recursive:true}).filter(f=>f.endsWith('.js'))){const s=fs.readFileSync(path.join('.next/static/chunks',file),'utf8');assert.ok(!s.includes('rjgttmwrbyjqifodjnqm'));found ||= s.includes(ref);}assert.ok(found);
 const email='time-off-admission-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('hex');
 const made=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{qa_fixture:'time-off-staging-admission'}});assert.ifError(made.error);actor=made.data.user.id;
 fs.writeFileSync(privateRoot+'admission-fixture.json',JSON.stringify({ownerId:actor,project:ref,createdAt:new Date().toISOString()}));
 const login=await client.auth.signInWithPassword({email,password});assert.ifError(login.error);cookie='sb-'+ref+'-auth-token='+encodeURIComponent(stringifySupabaseSession(login.data.session));
 const day=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
 range={startsOn:day,endsOn:day,timezone:'UTC',expectedActorId:actor};
 const ruleBody={action:'availability',operationId:crypto.randomUUID(),expectedActorId:actor,title:'Fictional admission test',timezone:'UTC',weekday:0,startMinute:540,endMinute:1020,duration:30,buffer:0,noticeHours:0,horizonDays:30,dailyCap:50,recurrence:{weekdays:[0,1,2,3,4,5,6],intervalWeeks:1,startDate:new Date().toISOString().slice(0,10),endDate:null,excludedDates:[]}};
 const rule=(await api('/api/workspace-scheduling',ruleBody)).record;
 const second=(await api('/api/workspace-scheduling',{...ruleBody,operationId:crypto.randomUUID(),title:'Fictional second service'})).record;
 const intake=(await api('/api/workspace-scheduling',{action:'publish',operationId:crypto.randomUUID(),expectedActorId:actor,title:'Fictional staging intake',consent:'Test fixture only',fields:[{id:'q1',label:'Test topic',required:false}]})).record;
 portal=(await api('/api/workspace/public-booking',{expectedActorId:actor,expectedVersion:0,availabilityId:rule.id,intakeId:intake.id,enabled:true,rotate:false})).portal;
 const preview=await api('/api/workspace-time-off',{action:'preview',...range});assert.equal(preview.preview.affectedBookings.length,0);
 const book={action:'book',operationId:crypto.randomUUID(),expectedActorId:actor,availabilityId:rule.id,expectedVersion:rule.version,intakeId:intake.id,startsAt:day+'T10:00:00.000Z',attendee:'Fictional retained appointment',answers:{},consented:true};
 const booking=(await api('/api/workspace-scheduling',book)).record;
 const original=(await api('/api/workspace-scheduling')).bookings.find(b=>b.id===booking.id);
 await rejected('/api/workspace-time-off',{action:'create',...range,operationId:crypto.randomUUID(),expectedReviewToken:preview.preview.reviewToken});
 const fresh=await api('/api/workspace-time-off',{action:'preview',...range});assert.equal(fresh.preview.affectedBookings.length,1);assert.equal(fresh.preview.affectedBookings[0].id,booking.id);
 const publicBefore=await api('/api/public-booking/'+portal.token+'?start='+day,undefined,false);assert.ok(publicBefore.slots.includes(day+'T12:00:00.000Z'));
 const saved=await api('/api/workspace-time-off',{action:'create',...range,operationId:crypto.randomUUID(),expectedReviewToken:fresh.preview.reviewToken});
 const after=(await api('/api/workspace-scheduling')).bookings.find(b=>b.id===booking.id);assert.deepEqual(after,original);
 report.checks.push('Booking arriving after review causes 409; renewed review includes existing booking; saving closure leaves booking unchanged');
 for(const availability of [rule,second])await rejected('/api/workspace-scheduling',{...book,operationId:crypto.randomUUID(),availabilityId:availability.id,expectedVersion:availability.version,startsAt:day+'T13:00:00.000Z'});
 const publicBody={operationId:crypto.randomUUID(),startsAt:day+'T12:00:00.000Z',attendee:'Fictional public appointment',answers:{},consented:true,portalVersion:portal.version,challenge:publicBefore.challenge,website:''};
 const delay=2100-(Date.now()-Number(publicBefore.challenge.split('.')[0]));if(delay>0)await new Promise(r=>setTimeout(r,delay));
 await rejected('/api/public-booking/'+portal.token,publicBody,false);
 const hidden=await api('/api/public-booking/'+portal.token+'?start='+day,undefined,false);assert.ok(hidden.slots.every(s=>!s.startsWith(day)));
 const legacy=await admin.rpc('public_booking_service',{handle:portal.token,payload:null});assert.ifError(legacy.error);assert.ok(legacy.data.slots.every(s=>!s.startsWith(day)));
 report.checks.push('Both private availability rules reject new bookings; public POST and both slot-preview functions honor owner-wide closure');
 await api('/api/workspace-time-off',{action:'remove',expectedActorId:actor,operationId:crypto.randomUUID(),id:saved.record.id,expectedVersion:saved.record.version});
 const reopened=await api('/api/public-booking/'+portal.token+'?start='+day,undefined,false);assert.ok(reopened.slots.includes(day+'T12:00:00.000Z'));
 // Reuse the rejected public operation: its failed attempt did not create a booking.
 const remaining=2100-(Date.now()-Number(reopened.challenge.split('.')[0]));if(remaining>0)await new Promise(r=>setTimeout(r,remaining));
 await api('/api/public-booking/'+portal.token,{...publicBody,challenge:reopened.challenge},false);
 const records=(await api('/api/workspace-scheduling')).bookings;assert.equal(records.length,2);assert.deepEqual(records.find(b=>b.id===booking.id),original);
 report.checks.push('Removal reopens public slot; formerly rejected public operation books once; original appointment remains unchanged');
})().catch(e=>{report.error=e.message;process.exitCode=1;console.log('Staging HTTP test failed: '+e.message);}).finally(async()=>{
 if(browser)await browser.close();
 if(actor){try{
 const user=await admin.auth.admin.getUserById(actor);assert.ifError(user.error);assert.equal(user.data.user.user_metadata.qa_fixture,'time-off-staging-admission');
 if(range){const listed=await client.rpc('workspace_time_off_request',{payload:{action:'list',...range}});assert.ifError(listed.error);assert.equal(listed.data.ok,true);for(const row of listed.data.records){const removed=await client.rpc('workspace_time_off_request',{payload:{action:'remove',expectedActorId:actor,operationId:crypto.randomUUID(),id:row.id,expectedVersion:row.version}});assert.ifError(removed.error);assert.equal(removed.data.ok,true);}const check=await client.rpc('workspace_time_off_request',{payload:{action:'list',...range}});assert.ifError(check.error);assert.equal(check.data.ok,true);assert.equal(check.data.records.length,0);report.activeFixtureTimeOff=0;}
 const current=await admin.from('workspace_public_booking').select('*').eq('owner_id',actor).maybeSingle();assert.ifError(current.error);
 if(current.data){const p=current.data;const disabled=await client.rpc('public_booking_config',{payload:{expectedActorId:actor,expectedVersion:p.version,availabilityId:p.availability_id,intakeId:p.intake_id,enabled:false,rotate:false}});assert.ifError(disabled.error);}
 const bookings=await admin.from('workspace_scheduling_bookings').select('id,version,status').eq('owner_id',actor);assert.ifError(bookings.error);for(const b of bookings.data.filter(x=>x.status==='confirmed')){const r=await client.rpc('workspace_scheduling_mutate',{payload:{action:'cancel',operationId:crypto.randomUUID(),expectedActorId:actor,id:b.id,expectedVersion:b.version}});assert.ifError(r.error);}
 const rules=await admin.from('workspace_scheduling_availability').select('id,version,active').eq('owner_id',actor);assert.ifError(rules.error);for(const a of rules.data.filter(x=>x.active)){const r=await client.rpc('workspace_scheduling_mutate',{payload:{action:'toggle',operationId:crypto.randomUUID(),expectedActorId:actor,id:a.id,expectedVersion:a.version,active:false}});assert.ifError(r.error);}
 for(const [table,col,value] of [['workspace_public_booking','enabled',true],['workspace_scheduling_availability','active',true],['workspace_scheduling_bookings','status','confirmed']]){const r=await admin.from(table).select('*',{head:true,count:'exact'}).eq('owner_id',actor).eq(col,value);assert.ifError(r.error);assert.equal(r.count,0);}
 const banned=await admin.auth.admin.updateUserById(actor,{ban_duration:'876000h'});assert.ifError(banned.error);assert.ok(Date.parse(banned.data.user.banned_until)>Date.now());if(portal){const r=await fetch(origin+'/api/public-booking/'+portal.token);assert.ok([404,429].includes(r.status));}
 report.fixtureInactive=true;report.retainedSyntheticHistory=true;fs.writeFileSync(privateRoot+'admission-fixture-cleanup.json',JSON.stringify({ownerId:actor,project:ref,inactive:true,retainedSyntheticHistory:true,bookingsCanceled:bookings.data.length,allRulesDisabled:true,portalDisabled:true,accountBanned:true,at:new Date().toISOString()}));
 }catch(e){report.cleanupError=e.message;process.exitCode=1;}}
 fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));});
