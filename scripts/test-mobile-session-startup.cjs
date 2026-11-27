const assert=require('assert/strict');
const {restoreNativeClient}=require('../mobile/src/sessionStartup.ts');
(async()=>{
 let created=0;
 await assert.rejects(restoreNativeClient(async()=>{throw Error('locked');},()=>{created++;}),/locked/);
 assert.equal(created,0,'locked store must not create signed-out client');
 for(const session of [null,{user:{id:'returning-owner'}}]){
  let called=0,stopped=0;
  const db={auth:{getSession:async()=>{called++;return {data:{session},error:null};},stopAutoRefresh:()=>{stopped++;}}};
  assert.equal(await restoreNativeClient(async()=>session?'encrypted token':null,()=>db),db);
  assert.equal(called,1);assert.equal(stopped,0);
 }
 for(const kind of ['error','throw','malformed']){
  let stopped=0;
  const db={auth:{getSession:async()=>{if(kind==='throw')throw Error('private token');return kind==='error'?{error:Error('private token')}:{data:{}};},stopAutoRefresh:()=>{stopped++;}}};
  await assert.rejects(restoreNativeClient(async()=>'saved',()=>db),e=>/Could not restore/.test(e.message)&&!e.message.includes('private token'));
  assert.equal(stopped,1);
 }
 let resolve,settled=false;
 const pending=restoreNativeClient(async()=>'saved',()=>({auth:{getSession:()=>new Promise(r=>resolve=r),stopAutoRefresh:()=>{}}})).then(()=>{settled=true;});
 await new Promise(r=>setImmediate(r));assert.equal(settled,false,'workspace must wait for actual session restore');
 resolve({data:{session:null},error:null});await pending;assert.equal(settled,true);
 console.log('Native session startup tests passed: new/returning account, locked storage, restore errors and pending restore.');
})().catch(e=>{console.error(e);process.exitCode=1;});
