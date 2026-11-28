const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const out=process.env.QA_RECEIPT;
if(!out||fs.existsSync(out))throw Error('A fresh QA_RECEIPT is required');
const source=fs.readFileSync('app/components/UnsavedSetupGuard.tsx','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
const harness=`
 window.exports={};window.require=name=>name==='react'?React:name==='next/navigation'?{useRouter:()=>({push:url=>window.navigations.push(url)})}:{jsx:(type,props,key)=>React.createElement(type,{...props,key}),jsxs:(type,props,key)=>React.createElement(type,{...props,key})};
 window.navigations=[];window.saves=0;
 ${compiled}
 function Harness(){const [value,setValue]=React.useState('Saved'),[baseline,setBaseline]=React.useState('Saved'),[busy,setBusy]=React.useState(false);
 window.resetIdentity=()=>{setValue('Other account');setBaseline('Other account')};
 async function save(){window.saves++;setBusy(true);const ok=await new Promise(resolve=>window.finishSave=resolve);if(ok)setBaseline(value);setBusy(false);return ok;}
 return React.createElement('main',null,React.createElement('label',null,'Business',React.createElement('input',{value,disabled:busy,onChange:e=>setValue(e.target.value)})),React.createElement('a',{href:'/workspace'},'Overview'),React.createElement('a',{href:'/support',target:'_blank'},'Help in another tab'),React.createElement(exports.default,{dirty:value!==baseline,busy,onSave:save}));}
 ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Harness));`;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[];try{
 for(const width of [360,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});let unexpectedRequests=0;
  await context.route('**/*',route=>{if(route.request().url()==='https://fixture.test/setup')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><div id="root"></div></body></html>'});unexpectedRequests++;return route.abort();});
  const page=await context.newPage();await page.goto('https://fixture.test/setup');
  for(const file of ['node_modules/react/umd/react.development.js','node_modules/react-dom/umd/react-dom.development.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
  await page.addScriptTag({content:harness});const input=page.getByLabel('Business'),link=page.getByRole('link',{name:'Overview',exact:true}),dialog=page.getByRole('dialog');
  await input.fill('Changed');await link.focus();await page.keyboard.press('Enter');await dialog.waitFor();assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Keep editing');
  await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await input.inputValue(),'Changed');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Overview');
  await link.click();await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('button',{name:'Saving...',exact:true}).waitFor();assert(await page.getByRole('button',{name:'Discard changes',exact:true}).isDisabled());assert.equal(await page.evaluate(()=>saves),1);
  await page.evaluate(()=>finishSave(false));await page.getByRole('alert').waitFor();assert.equal(await input.inputValue(),'Changed');assert.deepEqual(await page.evaluate(()=>navigations),[]);
  await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.evaluate(()=>finishSave(true));await page.waitForFunction(()=>navigations.length===1);assert.deepEqual(await page.evaluate(()=>navigations),['/workspace']);assert.equal(await dialog.count(),0);assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});dispatchEvent(e);return e.defaultPrevented;}),false);
  // Remount: discard does not write; native unload warning only while dirty.
  await page.reload();for(const file of ['node_modules/react/umd/react.development.js','node_modules/react-dom/umd/react-dom.development.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});await page.addScriptTag({content:harness});
  assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});dispatchEvent(e);return e.defaultPrevented;}),false);
  await input.fill('Discard me');assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});dispatchEvent(e);return e.defaultPrevented;}),true);
  await link.click();await page.getByRole('button',{name:'Discard changes',exact:true}).click();assert.deepEqual(await page.evaluate(()=>navigations),['/workspace']);assert.equal(await page.evaluate(()=>saves),0);
  // New mount tests identity reset while the confirmation is open.
  await page.reload();for(const file of ['node_modules/react/umd/react.development.js','node_modules/react-dom/umd/react-dom.development.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});await page.addScriptTag({content:harness});
  await input.fill('Old owner');await link.click();await dialog.waitFor();await page.evaluate(()=>resetIdentity());await page.waitForFunction(()=>!document.querySelector('dialog').open);assert.equal(await input.inputValue(),'Other account');assert.equal(await page.evaluate(()=>saves),0);
  await page.evaluate(()=>{history.replaceState({},'', '/list?search=retained&sort=name&page=3');history.pushState({},'', '/setup');});
  const historyLength=await page.evaluate(()=>history.length);await input.fill('History edit');await page.evaluate(()=>history.back());await dialog.waitFor();assert.equal(new URL(page.url()).pathname,'/setup');assert.equal(await input.inputValue(),'History edit');await page.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await page.evaluate(()=>history.length),historyLength);
  await page.evaluate(()=>history.back());await dialog.waitFor();await page.getByRole('button',{name:'Discard changes',exact:true}).click();await page.waitForURL('**/list?search=retained&sort=name&page=3');assert.equal(await page.evaluate(()=>history.length),historyLength);assert.equal(await page.evaluate(()=>saves),0);
  assert.equal(unexpectedRequests,0);checks.push({width,keyboardFocusAndEscape:true,failedSaveRetainsInput:true,duplicateDisabled:true,saveThenNavigate:true,discardWithoutWrite:true,nativeUnloadDirtyOnly:true,identityResetClosesPrompt:true,historyBackKeepAndDiscard:true,historyLengthPreserved:true,listQueryPreserved:true,unexpectedRequests});await context.close();
 }
}finally{await browser.close();fs.writeFileSync(out,JSON.stringify({scope:'Actual guard component rendered in isolated React harness; mocked save/router. Not full Next.js integration, browser Back, hosted auth, layout or release proof.',checks},null,2));}console.log(JSON.stringify(checks));})().catch(e=>{console.error(e);process.exitCode=1;});
