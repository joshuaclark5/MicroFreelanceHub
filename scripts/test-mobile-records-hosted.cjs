// Isolated existing staging only. Synthetic records; no customer data, emails or payments.
const fs=require('fs'),vm=require('vm'),ts=require('../mobile/node_modules/typescript'),assert=require('assert/strict'),crypto=require('crypto');
const {createClient}=require('@supabase/supabase-js');
const [keyFile,output]=process.argv.slice(2);if(!keyFile||!output)throw Error('Private key path and evidence output required.');
const bytes=fs.readFileSync(keyFile),keys=JSON.parse(bytes.toString(bytes[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
const ref='lfzaivnvoyvdmvvijnoq',url='https://'+ref+'.supabase.co';
const anon=keys.find(k=>k.id==='anon').api_key,service=keys.find(k=>k.id==='service_role').api_key;
assert.equal(JSON.parse(Buffer.from(service.split('.')[1],'base64url')).ref,ref,'Refusing a non-staging credential');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
function mod(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>imports[n],Date,Set,Map,Error,Intl});return exports;}
const shared=mod('app/lib/connectedWorkspace.ts'),time=mod('app/lib/workspaceTime.ts'),workflow=mod('mobile/src/workflow.ts',{'../../app/lib/workspaceTime':time});
const api=mod('mobile/src/workspaceRecords.ts',{'../../app/lib/connectedWorkspace':shared,'./workflow':workflow});
const scheduling=mod('app/lib/workspaceScheduling.ts'),agenda=mod('mobile/src/nativeAgenda.ts',{'../../app/lib/workspaceScheduling':scheduling,'./workflow':workflow});
const users=[],checks=[],cleanup=[];const ok=r=>{if(r.error)throw Error(r.error.code||'Backend failure');return r.data;};
function receipt(){fs.writeFileSync(output,JSON.stringify({at:new Date().toISOString(),project:ref,syntheticOnly:true,users:users.map(u=>u.id),checks,cleanup,deviceTest:false},null,2));}
(async()=>{try{
 for(let n=0;n<2;n++){const email='mfh-records-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomUUID()+crypto.randomUUID(),u=ok(await admin.auth.admin.createUser({email,password,email_confirm:true})).user;const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});users.push({id:u.id,db});receipt();ok(await db.auth.signInWithPassword({email,password}));}
 const [a,b]=users;
 async function create(section,values){const op=api.prepareRecord(section,a.id,crypto.randomUUID(),values);const row=await api.saveRecord(a.db,op);const again=await api.saveRecord(a.db,op,true);assert.equal(row.id,again.id);checks.push(section+' create and recovered retry');return row;}
 const client=await create('clients',{name:'Synthetic mobile client',email:'',phone:'',notes:'Fictional QA only'});
 const stage=await create('stages',{name:'Synthetic mobile stage',position:0});
 const project=await create('projects',{name:'Synthetic mobile project',client_id:client.id,stage_id:stage.id,notes:'',status:'active'});
 const task=await create('tasks',{title:'Synthetic mobile task',project_id:project.id,notes:'',due_date:'2026-12-01',status:'open'});
 const snapshot=await agenda.loadAgenda(a.db,a.id,'2026-12');assert.equal(snapshot.tasks.length,1);assert.equal(snapshot.tasks[0].id,task.id);assert.equal(snapshot.truncated,false);assert.equal((await agenda.loadAgenda(b.db,b.id,'2026-12')).tasks.length,0);checks.push('Native agenda authenticated queries, task due date and cross-owner isolation');
 const done=api.prepareRecord('tasks',a.id,task.id,{status:'done'},task);const updated=await api.saveRecord(a.db,done);assert.equal(updated.status,'done');assert.equal(updated.version,task.version+1);assert.equal((await api.saveRecord(a.db,done,true)).id,task.id);checks.push('Task completion and same-operation recovery');
 assert.equal((await agenda.loadAgenda(a.db,a.id,'2026-12')).tasks.length,0);checks.push('Completed task leaves native due-next view');
 await assert.rejects(()=>api.saveRecord(a.db,api.prepareRecord('tasks',a.id,task.id,{status:'open'},task)));checks.push('Stale edit rejected');
 assert.equal((await api.loadRecordPage(b.db,'clients',b.id)).rows.length,0);await assert.rejects(()=>api.saveRecord(b.db,api.prepareRecord('projects',b.id,crypto.randomUUID(),{name:'Cross-owner attempt',client_id:client.id,stage_id:stage.id,notes:'',status:'active'})));checks.push('Cross-account reads and relationship write rejected');
 for(const [section,row] of [['tasks',updated],['projects',project],['stages',stage],['clients',client]]){const op=api.prepareRecord(section,a.id,row.id,{},row,true);await api.saveRecord(a.db,op);await api.saveRecord(a.db,op,true);assert.equal((await api.loadRecordPage(a.db,section,a.id)).rows.length,0);}checks.push('Versioned deletion and recovery in dependency order');
}finally{
 for(const user of users){for(const table of ['workspace_tasks','workspace_projects','workspace_stages','workspace_clients']){const r=await admin.from(table).delete().eq('owner_id',user.id);cleanup.push({table,actor:user.id,ok:!r.error,code:r.error?.code});}const r=await admin.auth.admin.deleteUser(user.id);cleanup.push({authUser:user.id,ok:!r.error,code:r.error?.code});await user.db.auth.signOut({scope:'local'});}
 receipt();
}assert.ok(cleanup.every(x=>x.ok),'Cleanup incomplete; inspect private evidence');console.log(JSON.stringify({checks,cleanupComplete:true,deviceTest:false}));})().catch(e=>{receipt();console.error(e.message);process.exitCode=1});
