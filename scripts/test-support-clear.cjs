const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const source=ts.transpileModule(fs.readFileSync('app/support/SupportHandoff.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const state=[],refs=[];let index=0,refIndex=0;
const react={useState(initial){const i=index++;if(!(i in state))state[i]=initial;return [state[i],v=>state[i]=v];},useRef(initial){const i=refIndex++;return refs[i] ||= {current:initial};},useEffect(){}};
const exportsObject={};
const jsx=(type,props)=>({type,props});
vm.runInNewContext(source,{exports:exportsObject,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:{supportDraft:()=>({}),supportTopics:[]}});
function render(){index=refIndex=0;return exportsObject.default({});}
function find(node,predicate){if(!node||typeof node!=='object')return; if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const match=find(child,predicate);if(match)return match;}}
function button(tree,label){const b=find(tree,n=>n.type==='button'&&n.props.children===label);assert.ok(b,label);return b;}
let tree=render();state[1]='Unsent private details';tree=render();
button(tree,'Clear draft').props.onClick();assert.equal(state[1],'Unsent private details');tree=render();
button(tree,'Keep draft').props.onClick();assert.equal(state[1],'Unsent private details');assert.equal(state[3],false);
button(render(),'Clear draft').props.onClick();tree=render();
find(tree,n=>n.type==='textarea').props.onChange({target:{value:'Edited details'}});assert.equal(state[3],false);assert.equal(state[1],'Edited details');
button(render(),'Clear draft').props.onClick();button(render(),'Confirm clear draft').props.onClick();assert.equal(state[1],'');assert.equal(state[0],'Something else');assert.equal(state[3],false);
assert.match(state[2],/clipboard or email app is unchanged/);
console.log('PASS clear request preserves draft, cancel preserves draft, editing dismisses stale confirmation, explicit confirmation clears');

