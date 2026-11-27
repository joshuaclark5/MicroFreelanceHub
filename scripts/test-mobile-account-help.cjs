const fs=require('fs'),vm=require('vm'),ts=require('../mobile/node_modules/typescript'),assert=require('assert/strict');
const links=[];let fail=false,errorState='';
const React={useState:()=>[errorState,v=>errorState=v],createElement:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children})};
const native=new Proxy({StyleSheet:{create:x=>x},Linking:{openURL:async url=>{links.push(url);if(fail)throw Error('no handler');}}},{get:(o,k)=>o[k]||k});
const exportsObject={};const source=fs.readFileSync('mobile/App.tsx','utf8')+'\nexport {AccountHelp};';
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports:exportsObject,require:n=>n==='react'?React:n==='react-native'?native:{},encodeURIComponent});
function all(n){return !n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(all):[n,...n.children.flatMap(all)];}
function words(n){return typeof n==='string'?n:!n||typeof n!=='object'?'':Array.isArray(n)?n.map(words).join(''):n.children.map(words).join('');}
(async()=>{
 let tree=exportsObject.AccountHelp();
 function press(label){const button=all(tree).find(n=>n.type==='Pressable'&&words(n)===label);assert.ok(button);button.props.onPress();}
 press('Read privacy policy');await new Promise(r=>setImmediate(r));assert.equal(links.pop(),'https://www.microfreelancehub.com/privacy-policy');
 press('Email deletion request');await new Promise(r=>setImmediate(r));const target=new URL(links.pop());assert.equal(target.protocol,'mailto:');assert.equal(target.pathname,'admin@microfreelancehub.com');assert.equal(target.searchParams.get('subject'),'MicroFreelanceHub account deletion request');assert.equal(errorState,'');
 assert.match(words(tree),/does not cancel a subscription/);assert.match(words(tree),/you choose whether to send/);
 fail=true;press('Email deletion request');await new Promise(r=>setImmediate(r));tree=exportsObject.AccountHelp();assert.match(words(tree),/No request was sent/);assert.ok(all(tree).some(n=>n.props.accessibilityRole==='alert'));
 press('Read privacy policy');await new Promise(r=>setImmediate(r));tree=exportsObject.AccountHelp();assert.match(words(tree),/microfreelancehub.com\/privacy-policy/);
 console.log('PASS native account help: exact privacy/mail targets, draft-only wording, billing warning and missing-handler recovery. No email or data mutation.');
})().catch(e=>{console.error(e);process.exitCode=1});
