const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('../mobile/node_modules/typescript');
function load(file,imports){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports,require:n=>imports[n],Error,Date,Set,Map,BigInt});return exports;}
const shared=load('app/lib/workspaceInvoices.ts',{}),money=load('app/lib/workspacePresentation.ts',{}),real=load('mobile/src/invoiceData.ts',{'../../app/lib/workspaceInvoices':shared,'../../app/lib/workspacePresentation':money});
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',client='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
let slots=[],effects=[],cleanups=[],cursor=0,dirty=false,loads=0,failLoad=false,failSave=true,saveCalls=[],savedRows=[],deferredSave=null;
const alerts=[];
const React={createElement:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children}),Fragment:'Fragment',useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},useEffect(fn,deps){const i=cursor++;if(!(i in slots)||deps.some((d,j)=>d!==slots[i][j])){slots[i]=deps;effects.push(()=>{cleanups[i]?.();cleanups[i]=fn();});}}};
const native=new Proxy({StyleSheet:{create:x=>x},Alert:{alert:(title,message,buttons)=>alerts.push({title,message,buttons})}},{get:(o,k)=>o[k]||k});
const lib={...real,loadInvoices:async()=>{loads++;if(failLoad)throw Error('offline');return {rows:savedRows,next:null};},loadInvoiceRefs:async(db,owner,kind)=>({rows:kind==='clients'?[{id:client,owner_id:owner,name:'Fictional client'}]:[],next:null}),createInvoiceDraft:async(db,op)=>{
 saveCalls.push(op);if(deferredSave)return deferredSave;
 if(failSave)throw Error('The response was lost.');const row={id,owner_id:actor,client_id:client,project_id:null,version:1,status:'draft',number:null,snapshot:null,total_minor:shared.totalMinor(op.document),document:op.document};savedRows=[row];return row;
}};
const component=load('mobile/src/NativeInvoices.tsx',{'react':React,'react-native':native,'expo-crypto':{randomUUID:()=>id},'../../app/lib/workspaceInvoices':shared,'../../app/lib/workspacePresentation':money,'./invoiceData':lib}).default;
const props={db:{},actor,visible:false,onDirtyChange:v=>dirty=v};
function render(){cursor=0;const tree=component(props);while(effects.length)effects.shift()();return tree;}
function all(n){return !n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(all):[n,...n.children.flatMap(all)];}
function words(n){return typeof n==='string'||typeof n==='number'?String(n):!n||typeof n!=='object'?'':Array.isArray(n)?n.map(words).join(''):n.children.map(words).join('');}
function press(title){const b=all(render()).find(n=>n.type==='Pressable'&&(words(n)===title||n.props.accessibilityLabel===title));assert.ok(b,title);assert.ok(!b.props.disabled,title+' enabled');b.props.onPress();}
function input(label,text){const n=all(render()).find(n=>n.type==='TextInput'&&n.props.accessibilityLabel===label);assert.ok(n,label);n.props.onChangeText(text);}
const flush=()=>new Promise(r=>setImmediate(r));
function fill(){press('New invoice draft');press('Client: Fictional client');input('Invoice seller details','Fictional seller');input('Invoice line 1 description','Design work');input('Invoice line 1 price','12.50');input('Invoice line 1 quantity','3');}
(async()=>{
 render();await flush();assert.equal(loads,0,'Hidden invoice screen does not fetch');props.visible=true;render();await flush();render();assert.equal(loads,1);
 fill();assert.equal(dirty,true);props.visible=false;render();props.visible=true;assert.ok(words(render()).includes('New invoice draft'),'Tab navigation retains form');assert.equal(loads,1);
 press('Review invoice draft');let tree=render();assert.ok(words(tree).includes('$37.50 (USD)'));assert.equal(saveCalls.length,0,'Review never writes');assert.ok(!all(tree).some(n=>n.props.accessibilityLabel==='Invoice line 1 price'),'Review hides editable payload');
 const confirm=all(render()).find(n=>n.type==='Pressable'&&words(n)==='Confirm and save invoice draft').props.onPress;confirm();confirm();
 await flush();tree=render();assert.equal(saveCalls.length,1,'Duplicate click fenced');assert.ok(words(tree).includes('Retry same invoice draft'));assert.equal(dirty,true);
 const staleRetry=all(tree).find(n=>n.type==='Pressable'&&words(n)==='Retry same invoice draft').props.onPress;press('Refresh invoices');assert.equal(all(render()).find(n=>n.type==='Pressable'&&words(n)==='Retry same invoice draft').props.disabled,true);staleRetry();assert.equal(saveCalls.length,1,'Retry cannot race an earlier refresh');await flush();failSave=false;press('Retry same invoice draft');await flush();tree=render();assert.equal(saveCalls.length,2);assert.equal(saveCalls[0],saveCalls[1],'Retry retains exact operation object');assert.equal(dirty,false);assert.ok(words(tree).includes('Draft saved. No invoice issued, message sent or payment collected.'));assert.ok(words(tree).includes('Saved invoice details')||all(tree).some(n=>n.props.accessibilityLabel==='Saved invoice details'));
 press('New invoice draft');input('Invoice seller details','Kept through failure');failLoad=true;press('Refresh invoices');await flush();tree=render();assert.ok(words(tree).includes('No current records are shown'));assert.ok(!all(tree).some(n=>n.props.accessibilityLabel==='Saved invoice details'));assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Invoice seller details').props.value,'Kept through failure');
 press('Cancel invoice draft');assert.equal(alerts.length,1);assert.equal(dirty,true);const oldDiscard=alerts.pop().buttons.find(b=>b.text==='Discard draft').onPress;
 props.actor=other;render();render();oldDiscard();assert.equal(dirty,false,'Account switch removes private draft');assert.ok(!words(render()).includes('Kept through failure'));
 failLoad=false;await flush();props.actor=actor;render();await flush();render();fill();press('Review invoice draft');let resolve;deferredSave=new Promise(r=>resolve=r);press('Confirm and save invoice draft');await flush();props.actor=other;render();render();resolve(savedRows[0]);await flush();tree=render();assert.ok(!words(tree).includes('Draft saved.'));assert.ok(!all(tree).some(n=>n.props.accessibilityLabel==='Saved invoice details'),'Late save receipt from old account cannot show');

 // Explicit verified account mismatch without an auth event or actor prop change.
 // These paths call the real service's auth check, not a synthetic UI error.
 cleanups.forEach(f=>f?.());slots=[];effects=[];cleanups=[];props.actor=actor;deferredSave=null;render();await flush();render();fill();
 const mockLoad=lib.loadInvoices,mockCreate=lib.createInvoiceDraft,mockRefs=lib.loadInvoiceRefs;
 let verifiedOwner=other;props.db.auth={getUser:async()=>({data:{user:{id:verifiedOwner}},error:null})};props.db.from=()=>{const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,then:(resolve,reject)=>Promise.resolve({data:savedRows,count:savedRows.length,error:null}).then(resolve,reject)};return q;};
 lib.loadInvoices=real.loadInvoices;
 press('Refresh invoices');await flush();tree=render();assert.ok(words(tree).includes('Private records and drafts are hidden'));assert.ok(!words(tree).includes('Fictional seller'));assert.ok(!all(tree).some(n=>n.type==='TextInput'));assert.equal(dirty,true,'Original draft stays private in memory');
 verifiedOwner=actor;press('Verify original invoice account');await flush();tree=render();assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Invoice seller details').props.value,'Fictional seller');
 press('Review invoice draft');verifiedOwner=other;lib.createInvoiceDraft=real.createInvoiceDraft;press('Confirm and save invoice draft');await flush();tree=render();assert.ok(words(tree).includes('Private records and drafts are hidden'));assert.ok(!words(tree).includes('Fictional seller'));assert.ok(!words(tree).includes('Retry same invoice draft'));
 lib.loadInvoices=real.loadInvoices;press('Verify original invoice account');await flush();tree=render();assert.ok(words(tree).includes('Private records and drafts are hidden'),'Wrong owner cannot reveal pending operation');
 // Restoring the verified owner reveals the same pending identity. The actual read service verifies the restored original owner before revealing it.
 verifiedOwner=actor;lib.createInvoiceDraft=mockCreate;press('Verify original invoice account');await flush();tree=render();assert.ok(words(tree).includes('Retry same invoice draft'));
 press('Retry same invoice draft');await flush();assert.ok(words(render()).includes('Draft saved.'));

 // Every member of the concurrent read batch must hide private UI immediately,
 // without awaiting siblings that may never settle. Old completions must not
 // release the newer refresh lock or reopen stale contents.
 for(const mismatchKind of ['invoices','clients','projects']){
  fill();verifiedOwner=other;const abandoned=[];
  lib.loadInvoices=mismatchKind==='invoices'?real.loadInvoices:()=>new Promise(resolve=>abandoned.push(resolve));
  lib.loadInvoiceRefs=(db,owner,kind)=>kind===mismatchKind?real.loadInvoiceRefs(db,owner,kind):new Promise(resolve=>abandoned.push(resolve));
  press('Refresh invoices');await flush();tree=render();assert.ok(words(tree).includes('Private records and drafts are hidden'),mismatchKind+' mismatch fences before hung siblings');assert.ok(!all(tree).some(n=>n.type==='TextInput'));assert.ok(!words(tree).includes('Fictional seller'));assert.equal(abandoned.length,2);
  verifiedOwner=actor;lib.loadInvoices=real.loadInvoices;lib.loadInvoiceRefs=mockRefs;press('Verify original invoice account');await flush();tree=render();assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Invoice seller details').props.value,'Fictional seller','Original account can recover without waiting for abandoned reads');
  let finishNewRead;lib.loadInvoices=()=>new Promise(resolve=>finishNewRead=resolve);press('Refresh invoices');abandoned.forEach(resolve=>resolve({rows:[],next:null}));await flush();tree=render();assert.equal(all(tree).find(n=>n.type==='Pressable'&&words(n)==='Refresh invoices').props.disabled,true,'Abandoned batch cannot unlock a newer read');assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Invoice seller details').props.value,'Fictional seller');
  finishNewRead({rows:savedRows,next:null});await flush();lib.loadInvoices=real.loadInvoices;press('Cancel invoice draft');alerts.pop().buttons.find(b=>b.text==='Discard draft').onPress();render();
 }
 cleanups.forEach(f=>f?.());console.log('PASS native invoices UI: lazy loading, preserved drafts, no-write review, duplicate-click guard, locked same-operation retry, success reset, failure clears records, account reset and stale-dialog/receipt fencing. Mocked native controls; no device claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
