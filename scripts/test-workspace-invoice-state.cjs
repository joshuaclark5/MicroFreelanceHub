const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const ts = require(path.join(root, 'node_modules/typescript'));
function load(file, mocks, extras={}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}
  }).outputText, {exports,require:n=>{if(!(n in mocks)) throw Error('Unknown import '+n);return mocks[n];},console,crypto,...extras});
  return exports;
}
const lib=load('app/lib/workspaceInvoices.ts',{}), presentation=load('app/lib/workspacePresentation.ts',{});
const A=crypto.randomUUID(), B=crypto.randomUUID(), client=crypto.randomUUID(), invoice=crypto.randomUUID();
const doc={clientId:client,projectId:null,seller:'Private seller A',currency:'USD',issueDate:'2026-11-25',dueDate:'2026-12-01',memo:'initial',lines:[{description:'Private invoice A',quantity:1,unitMinor:100}]};
function fixture() {
  let state=[],cursor=0,effects=[],tree,Component,actor=A,fail=false,savedBody=null,unauthorized=0,postActorChange=false,refreshActorChange=false;
  let heldGet=null,holdNextGet=false;
  let record={id:invoice,version:1,status:'draft',number:null,document:structuredClone(doc),total_minor:100,snapshot:null};
  const react={useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useRef(initial){const i=cursor++;if(!(i in state))state[i]={current:initial};return state[i];},useEffect(fn){const i=cursor++;if(!(i in state)){state[i]=true;effects.push(fn);}}};
  const jsx=(type,props)=>({type,props});
  async function fetch(url,options={}) {
    if(unauthorized)return {ok:false,status:unauthorized,json:async()=>{throw Error('Malformed authentication response');}};
    if(options.method==='POST') {
      const body=JSON.parse(options.body); savedBody=body;
      if(actor!==A)return {ok:false,status:409,json:async()=>({error:'Account changed. Draft preserved.'})};
      record={...record,version:2,document:structuredClone(body.document)};
      if(postActorChange)actor=B;
      const savedActor=actor;if(refreshActorChange)actor=B;
      return {ok:!fail,status:fail?503:200,json:async()=>fail?{error:'Unknown save outcome'}:{actorId:savedActor,record:structuredClone(record)}};
    }
    const kind=new URL(url,'http://fixture').searchParams.get('kind');
    const records=kind==='invoices'?[record]:kind==='clients'?[{id:client,name:'Private client A'}]:[];
    const response={ok:true,status:200,json:async()=>({actorId:actor,records:structuredClone(records),nextCursor:null})};
    if(holdNextGet){holdNextGet=false;const snapshot=await response.json();await new Promise(resolve=>heldGet=resolve);return {...response,json:async()=>snapshot};}
    return response;
  }
  Component=load('app/workspace/invoices/page.tsx',{'react':react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'../../lib/workspaceInvoices':lib,'../../lib/workspacePresentation':presentation,'../../components/WorkspaceNav':{default:()=>null},'../../components/workspace-editorial.css':{}},{fetch,window:{confirm:()=>true}}).default;
  const render=()=>{cursor=0;tree=Component();return tree;};
  const settle=async()=>{for(let i=0;i<10;i++){render();while(effects.length)effects.shift()();await new Promise(setImmediate);}render();};
  const walk=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const c of node){const r=walk(c,predicate);if(r)return r;}return null;}if(predicate(node))return node;return walk(node.props?.children,predicate);};
  const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):'';
  const button=name=>{const b=walk(tree,n=>n.type==='button'&&text(n)===name);assert.ok(b,'button '+name);return b;};
  const memo=()=>walk(tree,n=>n.type==='textarea'&&n.props.maxLength===2000);
  const editor=()=>walk(tree,n=>n.type==='fieldset'&&n.props.id==='invoice-draft');
  return {settle,button,memo,editor,render,text:()=>JSON.stringify(tree),setActor:v=>actor=v,setFail:v=>fail=v,body:()=>savedBody,setUnauthorized:v=>unauthorized=v,postActorChange:()=>postActorChange=true,refreshActorChange:()=>refreshActorChange=true,holdGet:()=>holdNextGet=true,releaseGet:()=>heldGet()};
}
(async()=>{
  const f=fixture();await f.settle();f.button('Edit draft').props.onClick();await f.settle();
  f.setActor(B);f.button('Refresh records (preserves form)').props.onClick();await f.settle();
  assert.match(f.text(),/Account changed/);assert.doesNotMatch(f.text(),/Private invoice A|Private seller A|Private client A/);
  f.button('Refresh records').props.onClick();await f.settle();assert.equal(f.editor(),null);
  f.setActor(A);f.button('Refresh records').props.onClick();await f.settle();assert.ok(f.editor());assert.equal(f.memo().props.value,'');
  const g=fixture();await g.settle();g.button('Edit draft').props.onClick();await g.settle();
  g.memo().props.onChange({target:{value:'first edit'}});await g.settle();g.setFail(true);
  await g.button('Save draft').props.onClick();await g.settle();
  assert.match(g.text(),/Unknown save outcome/);assert.equal(g.editor().props.disabled,true);
  const operation=g.body().operationId;g.setFail(false);g.setActor(B);g.button('Retry same operation').props.onClick();await g.settle();
  assert.match(g.text(),/unconfirmed operation/);assert.doesNotMatch(g.text(),/first edit|Private seller A/);assert.equal(g.editor(),null);
  g.setActor(A);g.button('Refresh records').props.onClick();await g.settle();assert.equal(g.editor().props.disabled,true);
  g.button('Retry same operation').props.onClick();await g.settle();
  assert.equal(g.body().operationId,operation);assert.equal(g.memo().props.value,'first edit');
  assert.equal(g.editor().props.disabled,false);
  for(const status of [401,403]){
    const h=fixture();await h.settle();h.button('Edit draft').props.onClick();await h.settle();h.setUnauthorized(status);
    h.button('Refresh records (preserves form)').props.onClick();await h.settle();assert.equal(h.editor(),null);assert.doesNotMatch(h.text(),/Private invoice A|Private seller A/);
    const k=fixture();await k.settle();k.button('Edit draft').props.onClick();await k.settle();k.setUnauthorized(status);
    await k.button('Save draft').props.onClick();await k.settle();assert.equal(k.editor(),null);assert.match(k.text(),/unconfirmed operation/);
  }
  const race=fixture();await race.settle();race.holdGet();race.button('Refresh records (preserves form)').props.onClick();await race.settle();
  race.setActor(B);race.button('Refresh records (preserves form)').props.onClick();await race.settle();assert.equal(race.editor(),null);
  race.releaseGet();await race.settle();assert.equal(race.editor(),null);assert.doesNotMatch(race.text(),/Private invoice A/);
  const post=fixture();await post.settle();post.button('Edit draft').props.onClick();await post.settle();post.postActorChange();
  await post.button('Save draft').props.onClick();await post.settle();assert.equal(post.editor(),null);assert.doesNotMatch(post.text(),/Private seller A/);
  const refresh=fixture();await refresh.settle();refresh.button('Edit draft').props.onClick();await refresh.settle();refresh.refreshActorChange();
  await refresh.button('Save draft').props.onClick();await refresh.settle();assert.equal(refresh.editor(),null);assert.doesNotMatch(refresh.text(),/Private seller A/);
  console.log('PASS invoice private-state fencing, original-actor recovery, locked unknown-save editor, same-operation retry, malformed 401/403, and stale-load suppression. Actual TSX with closed hook/API fixtures; no browser or hosted claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
