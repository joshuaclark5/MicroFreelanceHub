const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function load(path,require){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require});return exports;}
const workspace=load('app/lib/connectedWorkspace.ts');
const {agreementContext}=load('app/lib/agreementContext.ts',()=>workspace);
const owner='11111111-1111-4111-8111-111111111111', project='22222222-2222-4222-8222-222222222222',client='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444';
function db(clientOwner=owner){return {from(table){const filters={};return {select(){return this},eq(k,v){filters[k]=v;return this},async maybeSingle(){const row=table==='workspace_projects'?{id:project,owner_id:owner,client_id:client,name:'Project'}:{id:client,owner_id:clientOwner,name:'Client',email:'client@example.test'};return {data:Object.entries(filters).every(([k,v])=>row[k]===v)?row:null};}}}}}
(async()=>{
 const result=await agreementContext(db(),owner,project);
 assert.equal(result.projectId,project);assert.equal(result.clientId,client);assert.equal(result.client,'Client');
 await assert.rejects(()=>agreementContext(db(),other,project));
 await assert.rejects(()=>agreementContext(db(other),owner,project));
 await assert.rejects(()=>agreementContext(db(),owner,'bad'));
 const returnUrl=new URL('/workspace/agreements?project='+result.projectId+'&agreement='+other,'https://example.test');
 assert.equal(returnUrl.searchParams.get('project'),project);
 assert.equal(returnUrl.searchParams.get('agreement'),other);
 console.log('PASS: owner context, foreign project, mismatched client, invalid id, return context');
})().catch(e=>{console.error(e);process.exitCode=1});
