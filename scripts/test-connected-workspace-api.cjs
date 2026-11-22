// Runs real TypeScript modules in a closed VM. No live providers or database claims.
// Usage: node scripts/test-connected-workspace-api.cjs [--proof=../api-proof.json]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const files = ['app/lib/connectedWorkspace.ts', 'app/api/workspace/[entity]/route.ts'];
// Snapshot source once: every fixture and the proof hashes refer to identical bytes.
const sources = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
const compiled = Object.fromEntries(files.map(file => [file, ts.transpileModule(sources[file], {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText]));
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(compiled[file], { exports, URL, require: name => {
    assert.ok(Object.hasOwn(mocks, name), 'Unexpected dependency (service-role/network paths forbidden): ' + name);
    return mocks[name];
  } }, { filename: file });
  return exports;
}
const validator = load(files[0]);
const plain = x => JSON.parse(JSON.stringify(x));
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const id = '33333333-3333-4333-8333-333333333333';
const related = '44444444-4444-4444-8444-444444444444';
const specs = {
  clients: { fields: ['name','email','notes'], valid: {name:'Client',email:'client@fixture.invalid',notes:'Notes'}, required:['name'] },
  stages: { fields:['name','position'], valid:{name:'In progress',position:2}, required:['name'] },
  projects: { fields:['name','client_id','stage_id','notes','status'], valid:{name:'Project',client_id:related,stage_id:related,notes:'Notes',status:'active'}, required:['name','client_id','stage_id'] },
  tasks: { fields:['title','project_id','notes','due_date','status'], valid:{title:'Task',project_id:related,notes:'Notes',due_date:'2028-02-29',status:'open'}, required:['title','project_id'] },
  agreements: { fields:['project_id','agreement_id'], valid:{project_id:related,agreement_id:related}, required:['project_id','agreement_id'] },
};
const methods = ['GET','POST','PATCH','DELETE'];
const columns = entity => ['id',...specs[entity].fields,'created_at','updated_at','version'].join(',');
const unavailable = 'Workspace unavailable. Your unsaved details are still in this form. Please retry.';
function fixture(options = {}) {
  const state = {user:{id:owner}, ...options};
  const calls = [];
  const cookieStore = Object.freeze({fixture:'request-cookie-session'});
  const db = {
    auth: { getUser: async () => {
      calls.push(['getUser']);
      if(state.authThrows) throw Error('private auth token');
      return {data:{user:state.user},error:state.authError};
    } },
    from(table) {
      calls.push(['from', table]);
      if(state.fromThrows) throw Error('private table detail');
      const query = {table, operation:'select', filters:[], projection:null};
      const q = {};
      for(const operation of ['select','insert','update','delete','eq','gt','order','limit']) q[operation] = (...args) => {
        calls.push([operation,...args]);
        if(operation==='select') query.projection=args[0];
        if(['insert','update','delete'].includes(operation)) {query.operation=operation;query.values=args[0];}
        if(operation==='limit')query.limit=args[0];
        if(operation==='eq')query.filters.push(args);
        return q;
      };
      async function result() {
        calls.push(['execute',plain(query)]);
        if(state.dbThrows)throw Error('private database password');
        if(state.dbError)return {data:state.dataOnError ? {id} : null,error:state.dbError};
        if(Object.hasOwn(state,'data'))return {data:Array.isArray(state.data)?state.data.slice(0,query.limit):state.data,count:Object.hasOwn(state,'count')?state.count:(state.data?.length||0),error:null};
        // Model row visibility at the SDK boundary, not PostgreSQL/RLS enforcement.
        const rowOwner = state.rowOwner || state.user?.id;
        const visible = !query.filters.some(([key,value]) => (key==='owner_id'||key==='user_id') && value!==rowOwner);
        const exists = !state.notFound && visible;
        const entity=table.replace('workspace_','');
        const row={id,version:1,...(specs[entity]?.valid||{title:'Agreement',client_name:'Client'}),created_at:'2026-11-18T00:00:00Z',updated_at:'2026-11-18T00:00:00Z',owner_id:rowOwner,user_id:rowOwner,private_secret:'must not select'};
        if(query.values)Object.assign(row,plain(query.values));
        const projected=Object.fromEntries(query.projection.split(',').map(key=>[key,row[key]]));
        return {count:exists?1:0,data:query.operation==='select' ? (exists?[projected]:[]) : (exists?projected:null),error:null};
      }
      q.single=()=>{calls.push(['single']);return result();};
      q.maybeSingle=()=>{calls.push(['maybeSingle']);return result();};
      q.then=(resolve,reject)=>result().then(resolve,reject);
      return q;
    },
  };
  const handlers=load(files[1], {
    'next/server':{NextResponse:{json:(body,init={})=>({body:plain(body),status:init.status||200,headers:plain(init.headers||{})})}},
    'next/headers':{cookies:()=>{calls.push(['cookies']);return cookieStore;}},
    '@supabase/auth-helpers-nextjs':{createRouteHandlerClient:(...args)=>{
      calls.push(['createRouteHandlerClient']);
      assert.equal(args.length,1,'No credential/options override');
      assert.deepEqual(Object.keys(args[0]),['cookies']);
      assert.equal(args[0].cookies(),cookieStore,'Exact request cookie store');
      if(state.clientThrows)throw Error('private client credentials');
      return db;
    }},
    '../../../lib/connectedWorkspace':validator,
  });
  return {state,calls,handlers,async invoke(method,entity='clients',opts={}) {
    const headers = new Map(Object.entries({origin:'https://fixture.invalid','content-type':'application/json','x-workspace-owner':state.user?.id||owner,'if-match':'1',...opts.headers}));
    const body=Object.hasOwn(opts,'body')?opts.body:method==='DELETE'?{}:specs[entity]?.valid;
    const url='https://fixture.invalid/api/workspace/'+entity+(Object.hasOwn(opts,'query')?opts.query:'?id='+id);
    const result=await handlers[method]({method,url,headers:{get:key=>headers.get(key)??null},text:async()=>{
      calls.push(['text']);if(opts.textThrows)throw Error('private request detail');
      return Object.hasOwn(opts,'raw')?opts.raw:JSON.stringify(body);
    }},{params:{entity}});
    assert.equal(result.headers['Cache-Control'],'private, no-store','Every response avoids caching identity-dependent records');
    return result;
  }};
}
const tests=[];
function test(name,fn){tests.push({name,fn});}
function denied(result,status,message) {
  assert.equal(result.status,status);
  assert.ok(Object.keys(result.body).every(k=>['error','code'].includes(k)),'No successful records/flags on a failure');
  assert.equal(typeof result.body.error,'string');
  if(message)assert.equal(result.body.error,message);
  assert.ok(!/private|password|token|23514|42501|victim/i.test(result.body.error.replace('private, no-store','')),'No private provider details');
}
function noDB(f){assert.equal(f.calls.filter(c=>c[0]==='from').length,0);}
function trace(f){return plain(f.calls.filter(c=>['from','select','insert','update','delete','eq','order','limit','single','maybeSingle'].includes(c[0])));}
for(const [entity,spec] of Object.entries(specs)) {
  test(entity+' validator field schema and complete payload',()=>{
    assert.deepEqual(plain(validator.fields[entity]),spec.fields);
    assert.deepEqual(plain(validator.workspaceInput(entity,spec.valid)),spec.valid);
    assert.equal(validator.isEntity(entity),true);
  });
  for(const method of methods)test(entity+' '+method+' exact projection, cookie owner, repeated module calls',async()=>{
    const f=fixture();
    for(const userId of [owner,other]) {
      f.state.user={id:userId}; f.calls.length=0;
      const r=await f.invoke(method,entity);
      assert.equal(r.status,method==='POST'?201:200);
      const expected=[['from','workspace_'+entity]];
      if(method==='GET')expected.push(['select',columns(entity),{count:'exact'}],['eq','owner_id',userId],['order','id',{ascending:true}],['limit',200]);
      if(method==='POST')expected.push(['insert',{...spec.valid,owner_id:userId}],['select',columns(entity)],['single']);
      if(method==='PATCH')expected.push(['update',spec.valid],['eq','owner_id',userId],['eq','id',id],['eq','version',1],['select',columns(entity)],['maybeSingle']);
      if(method==='DELETE')expected.push(['delete'],['eq','owner_id',userId],['eq','id',id],['eq','version',1],['select','id'],['maybeSingle']);
      assert.deepEqual(trace(f),expected);
      assert.deepEqual(Object.keys(r.body).sort(),method==='GET'?['complete','consistency','hasMore','nextCursor','ownerId','records','truncated']:['ownerId','record']);
      const row=method==='GET'?r.body.records[0]:r.body.record;
      assert.deepEqual(Object.keys(row),method==='DELETE'?['id']:columns(entity).split(','));
      assert.equal(f.calls.filter(c=>c[0]==='getUser').length,1);
      assert.ok(f.calls.findIndex(c=>c[0]==='getUser')<f.calls.findIndex(c=>c[0]==='from'));
      assert.equal(JSON.stringify(r.body).includes('must not select'),false);
    }
  });
  for(const field of spec.required)test(entity+' missing required '+field,async()=>{
    const body={...spec.valid};delete body[field];
    assert.throws(()=>validator.workspaceInput(entity,body));
    const f=fixture();denied(await f.invoke('POST',entity,{body}),400);noDB(f);
  });
  test(entity+' minimal POST and partial PATCH',async()=>{
    const required=Object.fromEntries(spec.required.map(key=>[key,spec.valid[key]]));
    const f=fixture();assert.equal((await f.invoke('POST',entity,{body:required})).status,201);
    for(const key of spec.fields)assert.equal((await f.invoke('PATCH',entity,{body:{[key]:spec.valid[key]}})).status,200);
  });
  for(const injected of ['version','owner_id','user_id','id','created_at','updated_at','is_pro','role','membership','membership_id','organization_id','entitlement','subscription_id','__proto__','constructor','prototype','unknown'])for(const method of ['POST','PATCH'])test(entity+' '+method+' rejects '+injected,async()=>{
    const body={...spec.valid,[injected]:injected==='__proto__'?{owner_id:other}:'victim'};
    const f=fixture();denied(await f.invoke(method,entity,{body}),400);noDB(f);
  });
  for(const body of [null,[],['name'],true,42,'name',{}])for(const method of ['POST','PATCH'])test(entity+' '+method+' rejects shape '+JSON.stringify(body),async()=>{
    const f=fixture();denied(await f.invoke(method,entity,{body}),400);noDB(f);
  });
  for(const method of methods)for(const [label,options,status] of [
    ['signed out',{user:null},401],['getUser error',{authError:Error('private auth detail')},401],['getUser throws',{authThrows:true},503],['client throws',{clientThrows:true},503],
  ])test(entity+' '+method+' '+label,async()=>{
    const f=fixture(options);for(let n=0;n<2;n++){denied(await f.invoke(method,entity),status,status===503?unavailable:undefined);noDB(f);}
  });
  for(const method of methods)for(const [label,options] of [
    ['database returned error',{dbError:{code:'42501',message:'private victim token'}}],
    ['database throws',{dbThrows:true}],['from throws',{fromThrows:true}],
    ['error plus data cannot succeed',{dbError:{code:'23514',message:'private constraint detail'},dataOnError:true}],
  ])test(entity+' '+method+' '+label,async()=>{
    const f=fixture(options);denied(await f.invoke(method,entity),503,unavailable);
    f.state.dbError=null;f.state.dbThrows=false;f.state.fromThrows=false;
    assert.equal((await f.invoke(method,entity)).status,method==='POST'?201:200,'Recovery does not cache prior failure');
  });
  for(const method of ['POST','PATCH','DELETE'])for(const code of ['23503','23505','23001'])test(entity+' '+method+' foreign-key/uniqueness '+code,async()=>{
    const f=fixture({dbError:{code,message:'private victim relation'}});denied(await f.invoke(method,entity),409);
  });
  for(const method of ['GET','PATCH','DELETE'])for(const options of [{rowOwner:other},{notFound:true}])test(entity+' '+method+' foreign/missing '+JSON.stringify(options),async()=>{
    const f=fixture(options),r=await f.invoke(method,entity);
    if(method==='GET')assert.deepEqual(r.body,{ownerId:owner,records:[],truncated:false,hasMore:false,nextCursor:null,complete:true,consistency:'live-id-traversal'});else denied(r,409);
    assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='owner_id'&&c[2]===owner));
  });
  test(entity+' POST missing database result is failure',async()=>denied(await fixture({data:null}).invoke('POST',entity),409));
  for(const n of [0,1000,1001])test(entity+' GET bounded results '+n,async()=>{
    const records=Array.from({length:n},(_,i)=>({id:String(i)}));
    const r=await fixture({data:records}).invoke('GET',entity);
    assert.equal(r.body.records.length,Math.min(n,200));assert.equal(r.body.truncated,n>200);
  });
  test(entity+' GET null data normalizes empty',async()=>assert.deepEqual((await fixture({data:null}).invoke('GET',entity)).body,{ownerId:owner,records:[],truncated:false,hasMore:false,nextCursor:null,complete:true,consistency:'live-id-traversal'}));
  for(const key of spec.fields) {
    const bad=key.endsWith('_id')?[null,undefined,'',other+'/path',1,{},'g'.repeat(36),id+'\n']:
      key==='position'?[-1,1000,1.5,'1',null,true,NaN,Infinity]:
      key==='due_date'?['2026-02-29','2026-04-31','2026-13-01','2026-00-01','2026-01-00','2026-01-32','26-01-01','2026-1-01','2026-01-01T00:00:00Z','not-a-date',1,{}]:
      key==='status'?['other','ACTIVE','',null,1,{},...(entity==='projects'?['open','done']:['active','archived'])]:
      [null,1,{},[],...(key==='name'||key==='title'?['','  ']:[]),...(key==='email'?['bad','x@y','x y@z.invalid','a@@b.invalid']:[])];
    for(const value of bad)test(entity+' invalid '+key+' '+String(value),async()=>{
      const body={...spec.valid,[key]:value};
      assert.throws(()=>validator.workspaceInput(entity,body));
      // Undefined is omitted by JSON, so test it at the validator boundary only.
      if(value===undefined)return;
      for(const method of ['POST','PATCH']){const f=fixture();denied(await f.invoke(method,entity,{body}),400);noDB(f);}
    });
    if(['name','title','notes','email'].includes(key)) {
      const max=key==='notes'?4000:key==='email'?254:entity==='stages'?80:160;
      const value=length=>key==='email'?'a'.repeat(length-6)+'@b.com':'x'.repeat(length);
      test(entity+' '+key+' length boundary '+max,async()=>{
        const f=fixture();for(const method of ['POST','PATCH']) {
          assert.equal((await f.invoke(method,entity,{body:{...spec.valid,[key]:value(max)}})).status,method==='POST'?201:200);
          denied(await f.invoke(method,entity,{body:{...spec.valid,[key]:value(max+1)}}),400);
        }
        const output=validator.workspaceInput(entity,{...spec.valid,[key]:' '+value(max)+' '});assert.equal(output[key],value(max));
      });
    }
  }
  test(entity+' inherited required fields cannot satisfy validator',()=>{
    const inherited={};const own={...spec.valid};for(const key of spec.required){inherited[key]=own[key];delete own[key];}
    // Give every entity an allowed own field, ensuring rejection cannot be accidental empty-object rejection.
    const first=spec.fields.find(key=>!spec.required.includes(key))||spec.required[0];
    own[first]=spec.valid[first];delete inherited[first];
    if(!Object.keys(inherited).length){inherited[first]=own[first];delete own[first];own[spec.fields.find(key=>key!==first)]=spec.valid[spec.fields.find(key=>key!==first)];}
    assert.throws(()=>validator.workspaceInput(entity,Object.assign(Object.create(inherited),own)),undefined,'Inherited required fields must not pass as submitted fields');
  });
  test(entity+' inherited identity/entitlements never copied',()=>{
    const body=Object.assign(Object.create({owner_id:other,is_pro:true,membership:'admin'}),spec.valid);
    const result=validator.workspaceInput(entity,body);
    assert.deepEqual(plain(result),spec.valid);
    assert.ok(!Object.hasOwn(result,'owner_id')&&!Object.hasOwn(result,'is_pro'));
  });
}
for(const method of methods)for(const entity of ['nope','__proto__','constructor','toString','','CLIENTS','clients/../../profiles'])test(method+' invalid entity '+entity,async()=>{
  const f=fixture();denied(await f.invoke(method,entity),404);assert.equal(f.calls.length,0);
});
for(const method of ['POST','PATCH','DELETE']) {
  for(const origin of [null,'','https://evil.invalid','http://fixture.invalid','https://fixture.invalid.evil','https://fixture.invalid:444','null'])test(method+' rejects origin '+origin,async()=>{
    const f=fixture();denied(await f.invoke(method,'clients',{headers:{origin}}),403);assert.equal(f.calls.length,0);
  });
  for(const type of [null,'','text/plain','application/x-www-form-urlencoded','application/json-patch+json'])test(method+' rejects content type '+type,async()=>{
    const f=fixture();denied(await f.invoke(method,'clients',{headers:{'content-type':type}}),415);assert.equal(f.calls.length,0);
  });
  test(method+' accepts JSON charset',async()=>assert.equal((await fixture().invoke(method,'clients',{headers:{'content-type':'application/json; charset=utf-8'}})).status,method==='POST'?201:200));
  for(const raw of ['','{','undefined','{"name":',' '.repeat(12001)])test(method+' malformed/oversize '+raw.length,async()=>{
    const f=fixture();denied(await f.invoke(method,'clients',{raw}),raw.length>12000?413:400);noDB(f);
  });
  test(method+' failed request body read',async()=>{const f=fixture();denied(await f.invoke(method,'clients',{textThrows:true}),400);noDB(f);});
  test(method+' raw body exact size boundary',async()=>{
    const body=JSON.stringify(method==='DELETE'?{}:specs.clients.valid);
    assert.equal((await fixture().invoke(method,'clients',{raw:body+' '.repeat(12000-body.length)})).status,method==='POST'?201:200);
    const f=fixture();denied(await f.invoke(method,'clients',{raw:body+' '.repeat(12001-body.length)}),413);noDB(f);
  });
}
for(const method of ['PATCH','DELETE'])for(const value of [null,'','not-uuid',id+'/x','g'.repeat(36),id+'\n'])test(method+' invalid target ID '+value,async()=>{
  const f=fixture();denied(await f.invoke(method,'clients',{query:value===null?'':'?id='+encodeURIComponent(value)}),400);noDB(f);
});
for(const body of [null,[],1,'',true,{id},{owner_id:other},{is_pro:true},{name:'Client'}])test('DELETE rejects nonempty/nonobject body '+JSON.stringify(body),async()=>{
  const f=fixture();denied(await f.invoke('DELETE','clients',{body}),400);noDB(f);
});
test('GET does not require write origin/content type or parse a body',async()=>{
  const f=fixture();assert.equal((await f.invoke('GET','clients',{headers:{origin:null,'content-type':null},textThrows:true})).status,200);
  assert.equal(f.calls.some(c=>c[0]==='text'),false);
});
test('GET ignores client identity/role query and rechecks signed-out session',async()=>{
  const f=fixture();assert.equal((await f.invoke('GET','clients',{query:'?owner_id='+other+'&role=admin&is_pro=true'})).status,200);
  assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='owner_id'&&c[2]===owner));
  f.state.user=null;f.calls.length=0;denied(await f.invoke('GET'),401);noDB(f);
});
test('POST cannot choose identity by query',async()=>{
  const f=fixture();assert.equal((await f.invoke('POST','clients',{query:'?owner_id='+other+'&user_id='+other+'&id='+other})).status,201);
  assert.equal(f.calls.find(c=>c[0]==='insert')[1].owner_id,owner);
});
for(const value of [owner,owner.toUpperCase(),'00000000-0000-0000-0000-000000000000'])test('valid UUID shape '+value,()=>assert.equal(validator.validId(value),true));
for(const value of [null,undefined,{},[],1,'',' '+id,id+'\n',id.replaceAll('-','')])test('invalid UUID shape '+String(value),()=>assert.equal(validator.validId(value),false));
for(const position of [0,999])test('stage position boundary '+position,()=>assert.equal(validator.workspaceInput('stages',{name:'Stage',position}).position,position));
for(const date of [null,'','2024-02-29','2026-02-28','2000-02-29','2026-12-31'])test('valid due date '+date,()=>assert.equal(validator.workspaceInput('tasks',{title:'Task',project_id:related,due_date:date}).due_date,date===''?null:date));
for(const [entity,status] of [['projects','archived'],['tasks','done']])test(entity+' alternate status '+status,()=>assert.equal(validator.workspaceInput(entity,{...specs[entity].valid,status}).status,status));
for(const entity of ['clients','projects','tasks'])test(entity+' optional empty text accepted',()=>{
  const body={...specs[entity].valid,notes:'  ',...(entity==='clients'?{email:'  '}:{})};
  const r=validator.workspaceInput(entity,body);assert.equal(r.notes,'');if(entity==='clients')assert.equal(r.email,'');
});
for(const n of [0,1,1000,1001])test('available-agreements exact own projection and truncation '+n,async()=>{
  const f=fixture({data:Array.from({length:n},()=>({id,title:'Agreement',client_name:'Client'}))});
  const r=await f.invoke('GET','available-agreements');assert.equal(r.status,200);
  assert.deepEqual(trace(f),[['from','sow_documents'],['select','id,title,client_name',{count:'exact'}],['eq','user_id',owner],['order','id',{ascending:true}],['limit',200]]);
  assert.equal(r.body.records.length,Math.min(n,200));assert.equal(r.body.truncated,n>200);
});
for(const method of ['POST','PATCH','DELETE'])test('available-agreements read only '+method,async()=>{
  const f=fixture();denied(await f.invoke(method,'available-agreements'),404);noDB(f);
});
for(const [options,status] of [[{user:null},401],[{authError:Error('private')},401],[{authThrows:true},503],[{dbThrows:true},503],[{dbError:{code:'42501',message:'private'}},503]])test('available-agreements failure '+JSON.stringify(options),async()=>denied(await fixture(options).invoke('GET','available-agreements'),status));
test('available-agreements null data and foreign row',async()=>{
  for(const options of [{data:null},{rowOwner:other}])assert.deepEqual((await fixture(options).invoke('GET','available-agreements')).body,{ownerId:owner,records:[],truncated:false,hasMore:false,nextCursor:null,complete:true,consistency:'live-id-traversal'});
});
test('task next action returns earliest open without mutation',()=>{
  const tasks=[{title:'Undated',status:'open'},{title:'Closed early',status:'done',due_date:'2020-01-01'},{title:'Later',status:'open',due_date:'2027-01-01'},{title:'First',status:'open',due_date:'2026-01-01'}];
  const before=plain(tasks);assert.equal(validator.taskNextAction(tasks).title,'First');assert.deepEqual(tasks,before);
  assert.equal(validator.taskNextAction([]),null);assert.equal(validator.taskNextAction([{title:'Done',status:'done'}]),null);
});
for(const method of methods)test(method+' mismatched owner stops before database',async()=>{const f=fixture();const r=await f.invoke(method,'clients',{headers:{'x-workspace-owner':other}});denied(r,409);assert.equal(r.body.code,'account_changed');noDB(f);});
for(const method of ['POST','PATCH','DELETE'])test(method+' requires owner continuity',async()=>{const f=fixture();denied(await f.invoke(method,'clients',{headers:{'x-workspace-owner':null}}),409);noDB(f);});
for(const method of ['PATCH','DELETE'])for(const version of [null,'','0','-1','1.1','2147483647','1e2'])test(method+' invalid version '+version,async()=>{const f=fixture();denied(await f.invoke(method,'clients',{headers:{'if-match':version}}),428);noDB(f);});
for(const count of [null,undefined,-1,0,1.5])test('unverified page count '+count,async()=>{const f=fixture({data:[{id}],count});denied(await f.invoke('GET'),503);});
for(const query of ['?limit=0','?limit=201','?limit=-1','?limit=1e2','?after=not-uuid'])test('invalid page '+query,async()=>{const f=fixture();denied(await f.invoke('GET','clients',{query}),400);noDB(f);});
test('session identity only no record query',async()=>{const f=fixture();assert.deepEqual((await f.invoke('GET','session')).body,{ownerId:owner});noDB(f);});
test('cursor uses immutable scoped id order',async()=>{const f=fixture();assert.equal((await f.invoke('GET','clients',{query:'?after='+id+'&limit=2'})).status,200);assert.ok(f.calls.some(c=>c[0]==='gt'&&c[1]==='id'&&c[2]===id));});


test('provider cap below requested page is not complete',async()=>{const f=fixture({data:[{id}],count:1005});const r=await f.invoke('GET');assert.equal(r.status,200);assert.equal(r.body.complete,false);assert.equal(r.body.nextCursor,id);});
test('nonempty count with empty response fails closed',async()=>denied(await fixture({data:[],count:2}).invoke('GET'),503));
(async()=>{
  const results=[];
  for(const {name,fn} of tests) {
    try{await fn();results.push({name,status:'passed'});}
    catch(error){results.push({name,status:'failed',message:error.message,stack:error.stack});console.error('FAIL: '+name+'\n'+error.stack);}
  }
  const failed=results.filter(r=>r.status==='failed');
  const proof={generatedAt:new Date().toISOString(),suite:'connected-workspace-api',mode:'Actual TypeScript VM modules; mocked cookie Supabase SDK boundary; no network or live credentials',databaseRLSProven:false,files:files.map(file=>({path:file,sha256:crypto.createHash('sha256').update(sources[file]).digest('hex')})),total:results.length,passed:results.length-failed.length,failed:failed.length,results};
  const proofArg=process.argv.find(arg=>arg.startsWith('--proof='));
  if(proofArg){const target=path.resolve(root,proofArg.slice(8));fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n');fs.writeFileSync(target.replace(/\.json$/i,'.log'),results.map(r=>r.status.toUpperCase()+': '+r.name+(r.message?' — '+r.message:'')).join('\n')+'\n');}
  console.log((failed.length?'FAIL':'PASS')+': '+proof.passed+'/'+proof.total+' connected workspace handler/validator cases; '+failed.length+' failures. Mocked SDK only; independent DB/RLS proof required.');
  if(failed.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
