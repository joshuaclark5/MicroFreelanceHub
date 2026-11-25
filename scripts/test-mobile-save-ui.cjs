const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const slots=[],effects=[];let cursor=0,authChange;const links=[];
const React={createElement:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children}),Fragment:'Fragment',useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},useEffect(fn,deps){const i=cursor++;if(!(i in slots)||deps?.some((d,j)=>d!==slots[i][j])){slots[i]=deps||[];effects.push(fn);}},useMemo:fn=>fn()};
const native=new Proxy({StyleSheet:{create:x=>x},Platform:{OS:'android'},AppState:{addEventListener:()=>({remove(){}})},BackHandler:{addEventListener:()=>({remove(){}})},Linking:{openURL:async url=>links.push(url)}},{get:(o,k)=>o[k]||k});
const db={auth:{onAuthStateChange:fn=>{authChange=fn;return {data:{subscription:{unsubscribe(){}}}}},startAutoRefresh(){},stopAutoRefresh(){}}};
const mods={'react':React,'react-native':native,'react-native-safe-area-context':{SafeAreaView:'SafeAreaView',SafeAreaProvider:'SafeAreaProvider'},'./src/projectBrowser':{createLoadGate:()=>({invalidate(){},begin:()=>({isCurrent:()=>true})}),filterProjects:(p,q)=>p.filter(x=>x.name.includes(q))},'./src/workflow':{loadWork:async()=>({projects:[{id:'p',name:'Sample project',status:'active'}],entries:[{id:'entry-1',project_id:'p',description:'Fictional completed work',seconds:1200,started_at:'2026-11-24T12:00:00Z'}],projectsTruncated:false})}};
function helper(file){const ex={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:ex,Error});return ex;}
mods['./src/sessionAction']=helper('mobile/src/sessionAction.ts');
mods['./src/sessionExit']=helper('mobile/src/sessionExit.ts');
mods['./src/projectBrowser']=helper('mobile/src/projectBrowser.ts');
let sequence=0,saveMode='fail',refreshFails=false,finishSave;const saves=[],alerts=[];
mods['expo-crypto']={randomUUID:()=> 'operation-'+(++sequence)};
mods['./src/workflow'].manualTime=(actor,id,project,minutes,note)=>({expectedActorId:actor,operationId:id,projectId:project,seconds:Number(minutes)*60,description:note,startedAt:'2026-11-25T00:00:00Z'});
mods['./src/workflow'].saveTime=async(_db,payload)=>{saves.push({...payload});if(saveMode==='fail')throw Error('Save was not confirmed');if(saveMode==='deferred')await new Promise(resolve=>finishSave=resolve);};
const normalLoad=mods['./src/workflow'].loadWork;mods['./src/workflow'].loadWork=async()=>{if(refreshFails)throw Error('Offline');return normalLoad();};
native.Alert={alert:(...args)=>alerts.push(args)};
mods['./src/NativeInvoices']=props=>({type:'InvoicesFixture',props,children:[]});
let signOutCalls=0;db.auth.signOut=async()=>{signOutCalls++;return {error:null};};
const exportsObject={};const source=fs.readFileSync('mobile/App.tsx','utf8')+'\nexport {Workspace};';
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports:exportsObject,require:n=>mods[n]||{},process:{env:{}},Date,Number,Error});
function render(){cursor=0;const tree=exportsObject.Workspace({db});while(effects.length)effects.shift()();return tree;}
function all(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(all);if(node.props?.style?.display==='none')return [];return [node,...node.children.flatMap(all)];}
function words(node){if(typeof node==='string'||typeof node==='number')return String(node);if(!node||typeof node!=='object')return '';if(Array.isArray(node))return node.map(words).join('');return node.children.map(words).join('');}
function press(tree,label){const n=all(tree).find(n=>n.type==='Pressable'&&words(n)===label);assert.ok(n,label);n.props.onPress();}

const settle=()=>new Promise(resolve=>setImmediate(resolve));
function input(tree,label,value){const field=all(tree).find(n=>n.props.accessibilityLabel===label);assert.ok(field,label);assert.notEqual(field.props.editable,false);field.props.onChangeText(value);}
function button(tree,label){return all(tree).find(n=>n.type==='Pressable'&&words(n)===label);}
(async()=>{
 render();authChange('SIGNED_IN',{user:{id:'owner-a'}});render();await settle();let tree=render();press(tree,'Time');tree=render();
 input(tree,'Minutes worked','25');input(tree,'Work note','Fictional test work');tree=render();press(tree,'Review time entry');tree=render();assert.ok(words(tree).includes('Review before saving'));
 const confirm=button(tree,'Confirm and save time');confirm.props.onPress();confirm.props.onPress();await settle();tree=render();assert.equal(saves.length,1,'rapid double press must issue one save');assert.ok(words(tree).includes('outcome is uncertain'));assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Minutes worked').props.editable,false);
 press(tree,'Sign out');assert.equal(alerts.at(-1)[0],'A save is still uncertain');assert.equal(saves.length,1);
 press(tree,'Home');tree=render();assert.ok(words(tree).includes('retry the same save'));press(tree,'Time');tree=render();
 saveMode='success';refreshFails=true;press(tree,'Retry the same entry');await settle();tree=render();assert.equal(saves.length,2);assert.deepEqual(saves[1],saves[0],'retry must preserve entire reviewed payload');assert.ok(words(tree).includes('Time saved. Refresh to see your latest entries; do not submit it again.'));assert.ok(!button(tree,'Retry the same entry'));assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Minutes worked').props.value,'');
 refreshFails=false;press(tree,'Refresh projects & time');await settle();tree=render();input(tree,'Minutes worked','10');tree=render();press(tree,'Review time entry');tree=render();saveMode='deferred';press(tree,'Confirm and save time');await settle();assert.equal(saves.length,3);
 authChange('SIGNED_IN',{user:{id:'owner-b'}});render();await settle();finishSave();await settle();tree=render();assert.ok(!words(tree).includes('Time saved.'),'old account receipt must not report in new session');press(tree,'Time');tree=render();assert.equal(all(tree).find(n=>n.props.accessibilityLabel==='Minutes worked').props.value,'');assert.ok(!button(tree,'Retry the same entry'));assert.equal(saves.length,3);
 press(tree,'Invoices');tree=render();all(tree).find(n=>n.type==='InvoicesFixture').props.onDirtyChange(true);press(tree,'Home');tree=render();press(tree,'Sign out');assert.equal(alerts.at(-1)[0],'Leave workspace changes?');assert.ok(alerts.at(-1)[1].includes('invoice'));assert.equal(signOutCalls,0);
 const staleSignOut=alerts.at(-1)[2].find(b=>b.text==='Sign out anyway').onPress;authChange('SIGNED_IN',{user:{id:'owner-c'}});render();await settle();staleSignOut();await settle();assert.equal(signOutCalls,0,'Invoice warning from old account cannot sign out newer account');
 console.log('PASS mocked native save lifecycle: rapid double press, stable retry payload, uncertain sign-out warning, navigation preservation, saved-but-refresh-failed recovery, account-switch receipt suppression. No network or customer writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
