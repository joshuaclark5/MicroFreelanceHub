const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const out=process.env.QA_RECEIPT;if(!out||fs.existsSync(out))throw Error('Fresh receipt required');
const compiled=ts.transpileModule(fs.readFileSync('app/components/ConnectStripeButton.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),checks=[];try{
 for(const configuration of [undefined,'   ','ca_fixture_only'])for(const width of [360,390,1440]){
  const c=await b.newContext({viewport:{width,height:900}}),p=await c.newPage();let unexpectedRequests=0;
  await c.route('**/*',r=>{if(r.request().url()==='https://fixture.test/settings')return r.fulfill({contentType:'text/html',body:'<div id="root"></div>'});if(r.request().url()==='https://fixture.test/support')return r.fulfill({contentType:'text/html',body:'<h1>Help with payment setup</h1>'});unexpectedRequests++;return r.abort();});
  await p.goto('https://fixture.test/settings');for(const file of ['node_modules/react/umd/react.development.js','node_modules/react-dom/umd/react-dom.development.js'])await p.addScriptTag({content:fs.readFileSync(file,'utf8')});
  await p.addScriptTag({content:`window.process={env:${JSON.stringify(configuration===undefined?{}:{NEXT_PUBLIC_STRIPE_CLIENT_ID:configuration})}};window.exports={};window.require=name=>name==='react'?React:name==='next/link'?(props=>React.createElement('a',props)):{jsx:(type,props,key)=>React.createElement(type,{...props,key}),jsxs:(type,props,key)=>React.createElement(type,{...props,key})};${compiled};window.root=ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(exports.default,{userId:'fictional-owner'}));`});
  const button=p.getByRole('button',{name:'Connect Stripe',exact:true});await button.waitFor();
  if(!configuration?.trim()){
   assert(await button.isDisabled());await p.getByRole('status').filter({hasText:'not available'}).waitFor();const help=p.getByRole('link',{name:'Get help with payment setup',exact:true});await help.focus();await p.keyboard.press('Enter');await p.getByRole('heading',{name:'Help with payment setup',exact:true}).waitFor();assert.equal(unexpectedRequests,0);
  }else {assert(await button.isEnabled());assert.equal(await p.getByRole('status').count(),0);await p.evaluate(()=>root.render(React.createElement(exports.default,{userId:''})));await p.waitForFunction(()=>document.querySelector('#root').childElementCount===0);}
  checks.push({width,configuration:configuration?.trim()?'configured':configuration===undefined?'missing':'blank',unavailableDisabled:!configuration?.trim(),helpReadOnly:!configuration?.trim(),configuredNotActivated:!!configuration?.trim(),unexpectedRequests});await c.close();
 }
}finally{await b.close();fs.writeFileSync(out,JSON.stringify({checks,scope:'Actual isolated component; no Stripe activation or API request'},null,2));}console.log(JSON.stringify(checks));})().catch(e=>{console.error(e);process.exitCode=1});
