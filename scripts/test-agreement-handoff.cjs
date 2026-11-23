const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(path, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText, {exports, require:name=>name === 'react/jsx-runtime' ? require(name) : imports[name]});
  return exports;
}
const contextModule = load('app/lib/agreementContext.ts', {'./connectedWorkspace':load('app/lib/connectedWorkspace.ts')});
const draftModule = load('app/lib/agreementDraft.ts');
const {briefStorageKey, clearAgreementDraft, validateHandoff} = load('app/lib/agreementHandoff.ts', {'./agreementContext':contextModule,'./agreementDraft':draftModule});
const ownerId='11111111-1111-4111-8111-111111111111', projectId='22222222-2222-4222-8222-222222222222',clientId='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444';
const context={ownerId,projectId,clientId};
function db({identities=[ownerId,ownerId], client=clientId, foreign=false, fail=false}={}) {
  let reads=0, queries=0;
  return { get reads(){return reads}, get queries(){return queries},
    auth:{async getUser(){return {data:{user:identities[reads] ? {id:identities[reads++]} : (reads++, null)}}}},
    from(table){const filters={};queries++;return {
      select(){return this},eq(k,v){filters[k]=v;return this},
      async maybeSingle(){const row=table==='workspace_projects'?{id:projectId,owner_id:ownerId,client_id:client,name:'Project'}:{id:client,owner_id:foreign?other:ownerId,name:'Client',email:'client@example.test'};
        return {data:Object.entries(filters).every(([k,v])=>row[k]===v)?row:null,error:fail?new Error('Unavailable'):null};
      }
    }}
  };
}
(async()=>{
  const keys=[briefStorageKey(),draftModule.DRAFT_KEY,briefStorageKey(context),briefStorageKey({...context,ownerId:other}),briefStorageKey({...context,projectId:other}),briefStorageKey({...context,clientId:other})];
  assert.equal(new Set(keys).size,6);
  const cache=new Map(keys.map(key=>[key,'unsaved content']));
  clearAgreementDraft({removeItem:key=>cache.delete(key)},context);
  assert.equal(cache.has(briefStorageKey(context)),false);
  for(const key of keys.filter(key=>key!==briefStorageKey(context))) assert.equal(cache.get(key),'unsaved content');
  clearAgreementDraft({removeItem:key=>cache.delete(key)});
  assert.equal(cache.has(briefStorageKey()),false);assert.equal(cache.has(draftModule.DRAFT_KEY),false);assert.equal(cache.size,3);
  let client=db();await validateHandoff(client,context);assert.equal(client.reads,2);assert.equal(client.queries,2);
  client=db({identities:[other]});await assert.rejects(()=>validateHandoff(client,context));assert.equal(client.queries,0);
  for(const opts of [{identities:[null]},{identities:[ownerId,other]},{identities:[ownerId,null]},{client:other},{foreign:true},{fail:true}])
    await assert.rejects(()=>validateHandoff(db(opts),context));
  // Exercise the real component wrappers: React keys force remounts on query/cache changes.
  const react=require('react');let query='project='+projectId;
  const page=load('app/create/page.tsx',new Proxy({'react':react,'next/navigation':{useSearchParams:()=>({toString:()=>query})}}, {get:(target,key)=>target[key]||{}}));
  const wrapper=page.default().props.children.type;
  const first=wrapper();query='project='+other;const second=wrapper();query='client='+clientId;const third=wrapper();query='';const generic=wrapper();
  assert.equal(new Set([first.key,second.key,third.key,generic.key]).size,4);
  const starter=load('app/components/AgreementStarter.tsx',new Proxy({'react':react},{get:(target,key)=>target[key]||{}})).default;
  assert.notEqual(starter({storageKey:keys[2]}).key,starter({storageKey:keys[3]}).key);
  console.log('PASS handoff: isolated cache cleanup, owner/project/client identities, live account switch/logout during validation, revoked access, reassignment, query and brief remount boundaries');
})().catch(error=>{console.error(error);process.exitCode=1});
