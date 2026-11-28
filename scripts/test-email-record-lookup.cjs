const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const file = require('node:path').join(__dirname, '../app/lib/emailRecordLookup.ts');
const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context = {exports:{}, URLSearchParams, fetch};
vm.runInNewContext(output, context);
const {findEmailRecord,failedEmailRecords} = context.exports;
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const actor = id(1), target = id(9), signal = () => new AbortController().signal;
const page = (records, hasMore=false, nextCursor=null, actorId=actor) => ({actorId,records,hasMore,nextCursor});
function mock(pages) { const calls=[]; const request=async(url,options)=>{ calls.push({url,options}); const data=pages.shift(); if(!data)throw Error('Unexpected request'); return {ok:true,json:async()=>data}; }; return {request,calls}; }
(async()=>{
 let m=mock([page([{id:id(2)}],true,id(2)),page([{id:target,status:'failed'}])]);
 assert.equal((await findEmailRecord(actor,target,signal(),m.request)).status,'failed');
 assert.equal(m.calls.length,2); assert.ok(m.calls[1].url.includes('after='+id(2)));
 for(const call of m.calls){assert.equal(call.options.cache,'no-store');assert.equal(call.options.method,undefined);assert.ok(call.url.includes('expectedActorId='+actor));}
 m=mock([page([])]); assert.equal(await findEmailRecord(actor,target,signal(),m.request),null);
 m=mock([page([{id:target}],false,null,id(3))]); await assert.rejects(findEmailRecord(actor,target,signal(),m.request),/Account changed/);
 m=mock([page([],true,id(2)),page([],true,id(2))]); await assert.rejects(findEmailRecord(actor,target,signal(),m.request),/incomplete/);
 m=mock([page([],true,id(4)),page([],true,id(3))]); await assert.rejects(findEmailRecord(actor,target,signal(),m.request),/incomplete/);
 m=mock([page([],true,null)]); await assert.rejects(findEmailRecord(actor,target,signal(),m.request),/incomplete/);
 m=mock([page([{id:'invalid'}])]); await assert.rejects(findEmailRecord(actor,target,signal(),m.request),/unavailable/);
 for(const status of [401,403,409,503]) await assert.rejects(findEmailRecord(actor,target,signal(),async()=>({ok:false,status})),/unavailable|Unable/);
 m=mock([]); await assert.rejects(findEmailRecord('invalid',target,signal(),m.request),/Valid/); assert.equal(m.calls.length,0);
 const controller=new AbortController(); controller.abort(); await assert.rejects(findEmailRecord(actor,target,controller.signal,m.request)); assert.equal(m.calls.length,0);
 m=mock(Array.from({length:100},(_,i)=>page([],true,id(i+2)))); await assert.rejects(findEmailRecord(actor,target,signal(),m.request),/limit reached/);assert.equal(m.calls.length,100);
 m=mock([page([{id:id(2),status:'unknown'},{id:id(3),status:'retry'},{id:id(4),status:'delivered'}],true,id(4)),page([{id:id(5),status:'failed',createdAt:'2026-11-27T00:00:00Z'},{id:id(6),status:'bounced',createdAt:'2026-11-25T00:00:00Z'}])]);
 const failures=await failedEmailRecords(actor,signal(),m.request);assert.equal(failures.length,2);assert.equal(failures[0].status,'bounced');assert.equal(failures[1].status,'failed');
 m=mock([page([{id:id(2),status:'failed'}],true,id(2)),page([],false,null,id(3))]);await assert.rejects(failedEmailRecords(actor,signal(),m.request),/Account changed/);
 m=mock([page([])]);assert.equal((await failedEmailRecords(actor,signal(),m.request)).length,0);
 console.log('PASS: exact later-page match, read-only requests, absent record, actor mismatch, invalid/stalled/reversed cursor, malformed record, HTTP errors, invalid identity, abort, traversal bound, failed/bounced filtering/order and later-page privacy failure.');
})().catch(error=>{console.error(error);process.exitCode=1;});
