const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('../mobile/node_modules/typescript');
function moduleAt(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>imports[n],Date,Set,Map,Error});return exports;}
const shared=moduleAt('app/lib/connectedWorkspace.ts');
const lib=moduleAt('mobile/src/workspaceRecords.ts',{'../../app/lib/connectedWorkspace':shared,'./workflow':{verifyActor:async(db,id)=>{const r=await db.auth.getUser();if(r.error||r.data.user?.id!==id)throw Error('account changed');}}});
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
let signedIn=actor,records=[],writes=0,lose=false,filters=[],foreign=false;
const db={auth:{getUser:async()=>({data:{user:{id:signedIn}},error:null})},from(table){assert.ok(table.startsWith('workspace_'));let action='read',values={},where=[],size=Infinity;const q={select(){return q;},eq(k,v){where.push([k,v]);filters.push([k,v]);return q;},gt(k,v){where.push(['after',v]);return q;},order(){return q;},limit(n){size=n;return q;},insert(v){action='insert';values=v;return q;},update(v){action='update';values=v;return q;},delete(){action='delete';return q;},single(){return execute(true);},maybeSingle(){return execute(true);},then(resolve,reject){return execute(false).then(resolve,reject);}};
 async function execute(single){let found=records.filter(r=>where.every(([k,v])=>k==='after'?r.id>v:r[k]===v));if(action!=='read'){writes++;if(action==='insert'){if(records.some(r=>r.id===values.id))return {data:null,error:{code:'23505'}};const row={email:'',phone:'',notes:'',...values,version:1};records.push(row);found=[row];}else if(action==='update')found.forEach(r=>{Object.assign(r,values);r.version++;});else records=records.filter(r=>!found.includes(r));if(lose){lose=false;throw Error('response lost after commit');}}const out=found.slice().sort((a,b)=>a.id.localeCompare(b.id)).slice(0,size).map(r=>({...r,owner_id:foreign?other:r.owner_id}));return {data:single?(out[0]||null):out,error:null,count:found.length};}return q;}};
(async()=>{
 const op=lib.prepareRecord('clients',actor,id,{name:'Fictional client',email:'',phone:'',notes:''});
 lose=true;await assert.rejects(()=>lib.saveRecord(db,op));assert.equal(records.length,1);
 const receipt=await lib.saveRecord(db,op,true);assert.equal(receipt.id,id);assert.equal(writes,1,'Lost create response must not create another record');
 const edit=lib.prepareRecord('clients',actor,id,{name:'Revised client'},receipt);
 lose=true;await assert.rejects(()=>lib.saveRecord(db,edit));const updated=await lib.saveRecord(db,edit,true);assert.equal(updated.version,2);assert.equal(writes,2);
 const stale=lib.prepareRecord('clients',actor,id,{name:'Stale overwrite'},receipt);await assert.rejects(()=>lib.saveRecord(db,stale),/changed/);assert.equal(records[0].name,'Revised client');
 const remove=lib.prepareRecord('clients',actor,id,{},updated,true);records[0].version=3;await assert.rejects(()=>lib.saveRecord(db,remove,true),/changed/);assert.equal(records.length,1,'A newer existing row is not a confirmed delete');
 records[0].version=2;lose=true;await assert.rejects(()=>lib.saveRecord(db,remove));assert.equal(await lib.saveRecord(db,remove,true),null);assert.equal(records.length,0);
 signedIn=other;const before=writes;await assert.rejects(()=>lib.saveRecord(db,op),/account changed/);assert.equal(writes,before);signedIn=actor;
 records=Array.from({length:101},(_,n)=>({id:`00000000-0000-4000-8000-${String(n+1).padStart(12,'0')}`,owner_id:actor,version:1,name:'Client '+n,email:'',phone:'',notes:''}));
 const page=await lib.loadRecordPage(db,'clients',actor);assert.equal(page.rows.length,100);assert.equal(page.next,records[99].id);const tail=await lib.loadRecordPage(db,'clients',actor,page.next);assert.equal(tail.rows.length,1);assert.equal(tail.next,null);assert.ok(filters.some(([k,v])=>k==='owner_id'&&v===actor));
 foreign=true;await assert.rejects(()=>lib.loadRecordPage(db,'clients',actor));foreign=false;
 assert.throws(()=>lib.prepareRecord('tasks',actor,id,{title:'Test',project_id:id,due_date:'2026-02-30',status:'open',notes:''}));
 assert.throws(()=>lib.prepareRecord('clients',actor,id,{name:'Test',owner_id:other}));
 console.log('PASS native records: lost-response create/update/delete recovery, stale conflicts, account isolation, pagination, foreign-row rejection and shared validation. Fixture data only.');
})().catch(e=>{console.error(e);process.exitCode=1});
