// Explicit isolated staging test. Creates synthetic accounts only; no emails/payments.
const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),crypto=require('crypto');
const {createClient}=require('@supabase/supabase-js');
const [keysFile,out]=process.argv.slice(2);if(!keysFile||!out)throw Error('Private staging key file and evidence output required.');
const url='https://lfzaivnvoyvdmvvijnoq.supabase.co';
const keys=JSON.parse(fs.readFileSync(keysFile));
const admin=createClient(url,keys.find(k=>k.id==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
const anon=keys.find(k=>k.id==='anon').api_key;
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>imports[n],Date,Number,Error,Map,BigInt,Intl,URLSearchParams});return exports;}
const time=load('app/lib/workspaceTime.ts'),workflow=load('mobile/src/workflow.ts',{'../../app/lib/workspaceTime':time});
const cleanupOnly=process.argv[4]==='cleanup-only',previous=cleanupOnly?JSON.parse(fs.readFileSync(out)):null;
const users=previous?previous.users.map(id=>({id})):[],checks=previous?.checks||[],cleanup=[];
function ok(r){if(r.error)throw Error(r.error.code||'Backend operation failed');return r.data;}
function receipt(){fs.writeFileSync(out,JSON.stringify({at:new Date().toISOString(),project:'lfzaivnvoyvdmvvijnoq',syntheticOnly:true,users:users.map(u=>u.id),checks,cleanup,deviceTest:false},null,2));}
(async()=>{try{if(!cleanupOnly){
 for(let i=0;i<2;i++){const email='mfh-mobile-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomUUID()+crypto.randomUUID();const u=ok(await admin.auth.admin.createUser({email,password,email_confirm:true})).user;const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});users.push({id:u.id,db});receipt();ok(await db.auth.signInWithPassword({email,password}));}
 const [a,b]=users;
 const c=ok(await a.db.from('workspace_clients').insert({owner_id:a.id,name:'Synthetic mobile QA client'}).select('id').single());
 const s=ok(await a.db.from('workspace_stages').insert({owner_id:a.id,name:'Synthetic mobile QA stage'}).select('id').single());
 const p=ok(await a.db.from('workspace_projects').insert({owner_id:a.id,name:'Synthetic mobile QA project',client_id:c.id,stage_id:s.id}).select('id').single());
 const work=await workflow.loadWork(a.db,a.id);assert.ok(work.projects.some(row=>row.id===p.id));checks.push('Real authenticated project read');
 const input=workflow.manualTime(a.id,crypto.randomUUID(),p.id,'15','Synthetic native core verification',Date.now()-5000);
 await workflow.saveTime(a.db,input);await workflow.saveTime(a.db,input);
 const rows=ok(await a.db.from('workspace_time_entries').select('id,seconds').eq('owner_id',a.id));assert.equal(rows.length,1);assert.equal(rows[0].seconds,900);checks.push('Actual shared mutation: saved 900 seconds, identical retry produced one row');
 assert.equal((await workflow.loadWork(b.db,b.id)).projects.length,0);assert.equal(ok(await b.db.from('workspace_projects').select('id').eq('id',p.id)).length,0);checks.push('Second account cannot read first account project');
 await assert.rejects(()=>workflow.saveTime(b.db,input));
 const cross={...input,expectedActorId:b.id,operationId:crypto.randomUUID()};await assert.rejects(()=>workflow.saveTime(b.db,cross));checks.push('Account-switch and correctly authenticated cross-owner write rejected');
 await a.db.auth.signOut({scope:'local'});await assert.rejects(()=>workflow.loadWork(a.db,a.id));checks.push('Signed-out read rejected');
}}finally{
 for(const u of users){for(const table of ['workspace_time_operations','workspace_time_audit','workspace_time_entries','workspace_projects','workspace_stages','workspace_clients']){const r=await admin.from(table).delete().eq('owner_id',u.id);cleanup.push({table,actor:u.id,ok:!r.error,code:r.error?.code});}const r=await admin.auth.admin.deleteUser(u.id);cleanup.push({authUser:u.id,ok:!r.error||r.error.code==='user_not_found',code:r.error?.code});}
 receipt();
}console.log(JSON.stringify({checks,cleanupFailures:cleanup.filter(x=>!x.ok),deviceTest:false}));})().catch(e=>{receipt();console.error(e.message);process.exitCode=1;});
