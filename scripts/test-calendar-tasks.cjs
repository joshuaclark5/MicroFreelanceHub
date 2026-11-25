const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),crypto=require('crypto');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,AbortController,require:n=>mocks[n]});return exports;}
const shared=load('app/lib/connectedWorkspace.ts'),{loadCalendarTasks}=load('app/lib/calendarTasks.ts',{'./connectedWorkspace':shared}),owner=crypto.randomUUID(),other=crypto.randomUUID(),controller=new AbortController();
const row=(title,due,status='open')=>({id:crypto.randomUUID(),title,due_date:due,status});
const first=[row('No date',null),row('Later','2026-12-01')],last=[row('Earlier','2026-11-01'),row('Done','2026-10-01','done')];
const response=(records,more=false,extra={})=>({ok:true,json:async()=>({ownerId:owner,records,hasMore:more,complete:!more,nextCursor:more?records.at(-1)?.id:null,...extra})});
(async()=>{const calls=[];const sorted=await loadCalendarTasks(owner,controller.signal,async(url,options)=>{calls.push([url,options]);return calls.length===1?response(first,true):response(last);});assert.deepEqual(Array.from(sorted,r=>r.title),['Earlier','Later','No date']);assert.match(calls[1][0],new RegExp('after='+first.at(-1).id));assert.equal(calls[0][1].headers['x-workspace-owner'],owner);assert.equal(calls[0][1].signal,controller.signal);
 for(const r of [response(first,false,{ownerId:other}),response(first,false,{complete:false}),response([first[0],first[0]]),response(first,true,{nextCursor:null})])await assert.rejects(()=>loadCalendarTasks(owner,controller.signal,async()=>r));
 let n=0;await assert.rejects(()=>loadCalendarTasks(owner,controller.signal,async()=>response([row('Task '+n++,null)],true)),/loading limit/);assert.equal(n,10);
 await assert.rejects(()=>loadCalendarTasks(owner,controller.signal,async()=>({ok:false,status:409,json:async()=>({})})),/Account changed/);
 console.log('PASS calendar task queue: full pagination before ordering, open-only due date order, owner continuity, duplicate/completeness/cursor rejection, bounded traversal; no network');
})().catch(e=>{console.error(e);process.exitCode=1;});
