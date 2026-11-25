const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('../mobile/node_modules/typescript');
function moduleAt(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>imports[n],Date,Set,Map,Error,Intl});return exports;}
const shared=moduleAt('app/lib/workspaceScheduling.ts'),actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const lib=moduleAt('mobile/src/nativeAgenda.ts',{'../../app/lib/workspaceScheduling':shared,'./workflow':{verifyActor:async(db,id)=>{const r=await db.auth.getUser();if(r.data.user?.id!==id)throw Error('account changed');}}});
const rule={id:actor,owner_id:actor,version:1,title:'Hours',timezone:'America/New_York',weekday:0,start_minute:540,end_minute:1020,active:true,recurrence:{weekdays:[0],intervalWeeks:1,startDate:'2026-01-01',endDate:null,excludedDates:['2026-11-08']}};
const booking={id:actor,owner_id:actor,version:1,attendee:'Fictional attendee',timezone:'America/New_York',starts_at:'2026-11-01T05:30:00.000Z',ends_at:'2026-11-01T06:30:00.000Z',status:'confirmed'};
const task={id:actor,owner_id:actor,version:1,title:'Fictional task',status:'open',due_date:'2026-11-01'};
let signedIn=actor,switchAfterRead=false,foreign=false,malformed=false,missingCount=false,incomplete=false;
const calls=[];
const db={auth:{getUser:async()=>({data:{user:{id:signedIn}}})},from(table){const filters=[];let data=table.endsWith('availability')?[rule]:table.endsWith('bookings')?[booking]:[task];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},gte(k,v){filters.push([k,v]);return q;},lt(k,v){filters.push([k,v]);return q;},order(){return q;},limit(){return q;},then(resolve,reject){calls.push({table,filters});const rows=data.map(r=>({...r,owner_id:foreign?other:actor,...(malformed?{timezone:'Not/AZone'}:{})}));if(switchAfterRead)signedIn=other;return Promise.resolve({data:rows,error:null,count:missingCount?null:incomplete?100:rows.length}).then(resolve,reject);}};return q;}};
(async()=>{
 assert.equal(lib.localDay('2026-11-01T02:00:00.000Z','America/New_York'),'2026-10-31','Date must use chosen zone, not UTC');
 let snapshot=await lib.loadAgenda(db,actor,'2026-11');assert.equal(snapshot.truncated,false);
 assert.ok(calls.every(c=>c.filters.some(([k,v])=>k==='owner_id'&&v===actor)));
 assert.equal(lib.daySummary(snapshot,'2026-11-01','America/New_York').bookings.length,1,'DST fold remains one appointment');
 assert.equal(lib.daySummary(snapshot,'2026-11-01','America/New_York').working.length,1);
 assert.equal(lib.daySummary(snapshot,'2026-11-08','America/New_York').working.length,0,'Time off excludes work pattern');
 assert.equal(lib.daySummary(snapshot,'2026-11-01','UTC').working.length,0,'Do not show another zone working hours as local hours');
 assert.equal(lib.daySummary(snapshot,'2026-11-01','America/New_York').tasks.length,1);
 booking.status='canceled';snapshot=await lib.loadAgenda(db,actor,'2026-11');assert.equal(lib.daySummary(snapshot,'2026-11-01','America/New_York').bookings.length,0);booking.status='confirmed';
 foreign=true;await assert.rejects(()=>lib.loadAgenda(db,actor,'2026-11'),/verified/);foreign=false;
 malformed=true;await assert.rejects(()=>lib.loadAgenda(db,actor,'2026-11'),/verified/);malformed=false;
 missingCount=true;await assert.rejects(()=>lib.loadAgenda(db,actor,'2026-11'),/verified/);missingCount=false;
 incomplete=true;await assert.rejects(()=>lib.loadAgenda(db,actor,'2026-11'),/verified/);incomplete=false;
 switchAfterRead=true;await assert.rejects(()=>lib.loadAgenda(db,actor,'2026-11'),/account changed/);signedIn=actor;switchAfterRead=false;
 await assert.rejects(()=>lib.loadAgenda(db,actor,'2026-13'),/month/);
 console.log('Native agenda: timezone/DST, recurrence/time-off, cancellation, owner isolation, count completeness and account-change checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
