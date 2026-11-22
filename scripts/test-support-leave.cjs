const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const source=ts.transpileModule(fs.readFileSync('app/support/SupportHandoff.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
for(const details of ['', '   ', 'Unsent issue']) {
 const effects=[], listeners=new Map(); let index=0;
 const react={useState: initial=>[index++===1?details:initial,()=>{}],useRef:()=>({current:0}),useEffect: fn=>effects.push(fn)};
 const exports={};
 vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:()=>null,jsxs:()=>null}:{supportDraft:()=>({}),supportTopics:[]},window:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:(key,fn)=>{assert.equal(listeners.get(key),fn);listeners.delete(key);}}});
 exports.default({});
 const cleanups=effects.map(fn=>fn());
 assert.equal(listeners.has('beforeunload'),Boolean(details.trim()));
 if(details.trim()){let prevented=false;const event={preventDefault(){prevented=true;}};listeners.get('beforeunload')(event);assert.equal(prevented,true);assert.equal(event.returnValue,'');}
 cleanups.filter(Boolean).forEach(fn=>fn());assert.equal(listeners.size,0);
}
console.log('PASS empty/whitespace drafts, unsent close warning, and listener cleanup; real browser dialogs unverified');
