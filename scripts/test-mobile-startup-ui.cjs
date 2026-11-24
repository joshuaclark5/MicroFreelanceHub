const fs=require('fs'),vm=require('vm'),ts=require('../mobile/node_modules/typescript'),assert=require('assert/strict');
const {restoreNativeClient}=require('../mobile/src/sessionStartup.ts');
const slots=[],effects=[];let cursor=0,locked=true,created=0,options;
const React={createElement:(type,props,...children)=>({type,props:props||{},children}),Fragment:'Fragment',useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useEffect(fn,deps){const i=cursor++;if(!(i in slots)||deps.some((v,j)=>v!==slots[i][j])){slots[i]=deps;effects.push(fn);}}};
const storage={getItem:async()=>{if(locked)throw Error('locked');return null;}};
const native=new Proxy({StyleSheet:{create:x=>x}},{get:(o,k)=>o[k]||k});
const mods={'react':React,'react-native':native,'react-native-safe-area-context':{SafeAreaProvider:'Provider',SafeAreaView:'Safe'},'./src/nativeSessionStorage':{nativeSessionStorage:storage},'./src/sessionStartup':{restoreNativeClient},'@supabase/supabase-js':{processLock(){},createClient:(url,key,opts)=>{created++;options=opts;return {auth:{getSession:async()=>({data:{session:null},error:null}),stopAutoRefresh(){}}};}}};
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('mobile/App.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports:exportsObject,require:n=>mods[n]||{},process:{env:{EXPO_PUBLIC_SUPABASE_URL:'https://fixture.supabase.co',EXPO_PUBLIC_SUPABASE_ANON_KEY:'public-fixture'}},URL});
function render(){cursor=0;const tree=exportsObject.default();while(effects.length)effects.shift()();return tree;}
function all(n){return !n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(all):[n,...n.children.flatMap(all)];}
function words(n){return typeof n==='string'?n:!n||typeof n!=='object'?'':Array.isArray(n)?n.map(words).join(''):n.children.map(words).join('');}
(async()=>{
 let tree=render();assert.match(words(tree),/Opening your workspace/);await new Promise(r=>setImmediate(r));
 tree=render();assert.match(words(tree),/restore your sign-in/);assert.equal(created,0);
 const retry=all(tree).find(n=>n.props.title==='Retry sign-in restore');assert.ok(retry);locked=false;retry.props.onPress();
 render();await new Promise(r=>setImmediate(r));tree=render();
 assert.ok(all(tree).some(n=>n.type?.name==='Workspace'));assert.equal(created,1);
 assert.equal(options.auth.persistSession,true);assert.equal(options.auth.storage,storage);assert.equal(typeof options.auth.lock,'function');
 console.log('Startup screen regression passed: loading, storage failure, retry, persistent auth and workspace transition (mocked native UI).');
})().catch(e=>{console.error(e);process.exitCode=1;});
