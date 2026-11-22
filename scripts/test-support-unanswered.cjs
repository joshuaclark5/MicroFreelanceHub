const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const state=[];let index=0;const output={};
const jsx=(type,props)=>({type,props});
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/support/SupportGuide.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:output,require:name=>name==='react'?{useState(v){const i=index++;if(!(i in state))state[i]=v;return [state[i],v=>state[i]=v]},useEffect(){}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name.includes('supportKnowledge')?{findSupportAnswers:()=>[],supportTopics:[],supportAnswers:[]}:{default:'stub'}});
function render(){index=0;return output.default()}
function find(n,test){if(!n||typeof n!=='object')return;if(test(n))return n;for(const child of [n.props?.children].flat(Infinity)){const hit=find(child,test);if(hit)return hit;}}
render();state[1]='private search text';const tree=render();
find(tree,n=>n.type==='button'&&n.props.children==='Get help with an unanswered question').props.onClick();
assert.deepEqual(JSON.parse(JSON.stringify(state[0])),{topic:'Something else'});assert.equal(state[1],'private search text');
const handoff=find(render(),n=>n.props?.request===state[0]);assert.ok(handoff);
console.log('PASS unanswered search offers handoff with fixed topic only; query stays private');
