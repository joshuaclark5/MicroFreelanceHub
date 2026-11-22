const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const exportsBag={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/server/outlookAvailability.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsBag,require:n=>{assert.equal(n,'server-only');return {};},URL,URLSearchParams,Buffer,Date,AbortSignal,fetch:()=>{throw Error('No real network');}});
const read=exportsBag.outlookAvailability,start='2026-11-22T00:00:00Z',end='2026-11-23T00:00:00Z';
const event={start:{dateTime:'2026-11-22T10:00:00.0000000',timeZone:'UTC'},end:{dateTime:'2026-11-22T11:00:00',timeZone:'UTC'},showAs:'busy',isCancelled:false};
const response=j=>new Response(JSON.stringify(j)),fixture=items=>async()=>response({value:items});
(async()=>{
 let calls=0;
 const result=await read('fixture-token',start,end,async(url,init)=>{
   assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.equal(init.method,'GET');
   assert.equal(init.headers.Prefer,'outlook.timezone="UTC"');assert.ok(init.signal);
   calls++;
   if(calls===1){assert.equal(new URL(url).searchParams.get('$select'),'start,end,showAs,isCancelled');return response({value:[{...event,subject:'PRIVATE',attendees:['PRIVATE']},{...event,showAs:'free'}],'@odata.nextLink':'https://graph.microsoft.com/v1.0/me/calendarView?$skiptoken=opaque'});}
   return response({value:[{...event,isCancelled:true},{...event,showAs:'unknown',start:{dateTime:'2026-11-21T23:00:00',timeZone:'UTC'}}]});
 });
 assert.equal(calls,2);assert.equal(result.length,2);assert.equal(result[0].start,'2026-11-22T00:00:00.000Z');
 assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
 assert.equal((await read('t',start,end,fixture([]))).length,0);
 for(const link of ['https://evil.invalid/steal','https://graph.microsoft.com/v1.0/users/other/calendarView','https://user:pass@graph.microsoft.com/v1.0/me/calendarView','https://graph.microsoft.com/v1.0/me/calendarView#bad','/relative',null]){
   let fetched=0;await assert.rejects(read('t',start,end,async()=>{fetched++;return response({value:[event],'@odata.nextLink':link});}));assert.equal(fetched,1);
 }
 let repeated=0;await assert.rejects(read('t',start,end,async()=>{repeated++;return response({value:[],'@odata.nextLink':'https://graph.microsoft.com/v1.0/me/calendarView?$skiptoken=loop'});}),e=>e.code==='invalid_pagination');assert.equal(repeated,2);
 for(const item of [{...event,start:{dateTime:'2026-11-22T10:00:00',timeZone:'Pacific Standard Time'}},{...event,start:{dateTime:'2026-02-30T10:00:00',timeZone:'UTC'}},{...event,end:event.start},{...event,isCancelled:undefined},null])await assert.rejects(read('t',start,end,fixture([item])));
 for(const status of [401,403,429,500])await assert.rejects(read('t',start,end,async()=>new Response('PRIVATE TOKEN',{status})),e=>!e.message.includes('PRIVATE'));
 await assert.rejects(read('t',start,end,async()=>{throw Error('PRIVATE TOKEN');}),e=>e.code==='provider_uncertain');
 await assert.rejects(read('t',start,end,async()=>new Response('x'.repeat(1048577))),e=>e.code==='snapshot_too_large');
 await assert.rejects(read('t',start,end,fixture(Array(2001).fill(event))),e=>e.code==='snapshot_too_large');
 let page=0;await assert.rejects(read('t',start,end,async()=>++page===1?response({value:[event],'@odata.nextLink':'https://graph.microsoft.com/v1.0/me/calendarView?$skiptoken=2'}):new Response('bad',{status:503})),e=>e.code==='provider_unavailable');
 await assert.rejects(read('t',end,start),e=>e.code==='invalid_window');
 // Reject ambiguous/normalized windows before any token-bearing request.
 let invalidFetches=0;
 const noRequest=async()=>{invalidFetches++;return response({value:[]});};
 for(const invalid of ['2026-11-22','2026-11-22T00:00:00','2026-11-22T00:00:00+00:00',
   '2026-02-30T00:00:00Z','2026-11-22T24:00:00Z','2026-11-22T00:00:60Z',
   '2026-11-22T00:00:00.0001Z',' 2026-11-22T00:00:00Z',null,123]) {
   await assert.rejects(read('t',invalid,end,noRequest),e=>e.code==='invalid_window');
   await assert.rejects(read('t',start,invalid,noRequest),e=>e.code==='invalid_window');
 }
 await assert.rejects(read('t',start,start,noRequest),e=>e.code==='invalid_window');
 await assert.rejects(read('t',start,'2026-12-23T00:00:00.001Z',noRequest),e=>e.code==='invalid_window');
 assert.equal(invalidFetches,0);
 for(const [lo,hi] of [[start,'2026-12-23T00:00:00Z'],
   ['2028-02-29T23:59:59.1Z','2028-03-01T00:00:00.123Z'],
   ['2026-11-01T05:30:00Z','2026-11-01T06:30:00Z']]) {
   let fetched=0;
   await read('t',lo,hi,async url=>{fetched++;const query=new URL(url).searchParams;
     assert.equal(query.get('startDateTime'),new Date(lo).toISOString());
     assert.equal(query.get('endDateTime'),new Date(hi).toISOString());return response({value:[]});});
   assert.equal(fetched,1);
 }
 console.log('PASS Outlook adapter: complete pagination, UTC validation, privacy, clipping, scope fences, limits, errors; fixture-only, no real provider claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
