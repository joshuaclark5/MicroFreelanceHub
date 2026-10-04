const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
require('dotenv').config({path:'.env.local',quiet:true});
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
const {createChangeOrderDraft,changeOrderReference}=load('app/lib/changeOrderDraft.ts');
const {parseEditorDraft}=load('app/lib/agreementDraft.ts');
const original={id:'00000000-0000-4000-8000-000000000099',user_id:'00000000-0000-4000-8000-000000000001',title:'Website redesign',client_name:'Example Studio',client_data:{email:'client@example.test'},price:2400,status:'Signed',signed_by:'Client',provider_sign:'Owner',deliverables:'Original signed five-page scope',payment_type:'one_time',payment_received_cents:120000,line_items:[{id:'base',description:'Original work',quantity:1,amount:2400}],created_at:'2026-10-01T00:00:00Z'};
const input={scope:'One booking page with scheduling link.',amount:'350',timeline:'+2 business days'};
const before=JSON.stringify(original),draft=createChangeOrderDraft(original,input);
assert.ok(parseEditorDraft(JSON.stringify({version:1,savedAt:Date.now(),draft})));
assert.equal(JSON.stringify(original),before);
assert.equal(draft.lineItems[0].amount,350);assert.equal(draft.includeFee,false);
assert.equal(changeOrderReference({title:draft.formData.projectTitle,deliverables:draft.formData.deliverables}).originalId,original.id);
assert.throws(()=>createChangeOrderDraft(original,{...input,amount:'-10'}));
assert.throws(()=>createChangeOrderDraft(original,{...input,amount:'NaN'}));
assert.throws(()=>createChangeOrderDraft({...original,id:'javascript:bad'},input));
assert.equal(changeOrderReference({title:'Change order: Test',deliverables:'Original agreement ID: javascript:bad'}),null);
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3047',host=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [1440,390,320]){
const c=await b.newContext({viewport:{width,height:950}}),user={id:original.user_id,email:'fixture@example.test',aud:'authenticated',role:'authenticated'};let inserted=null,patches=[];
await c.addCookies([{name:`sb-${host.split('.')[0]}-auth-token`,value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
await c.route('**/*',r=>{const q=r.request(),url=new URL(q.url());if(/google-analytics|googletagmanager/.test(url.hostname))return r.abort();if(url.hostname===host){
if(q.method()==='POST'&&url.pathname.includes('sow_documents')){inserted={...q.postDataJSON(),id:'00000000-0000-4000-8000-000000000088',created_at:'2026-10-04T00:00:00Z'};return r.fulfill({status:201,contentType:'application/json',body:'[]'});}
if(q.method()==='PATCH'){patches.push(q.postDataJSON());return r.abort();}
if(q.method()==='HEAD')return r.fulfill({status:200,headers:{'content-range':'0-0/1'}});
if(q.method()!=='GET')return r.abort();
const body=url.pathname.includes('/auth/')?user:url.pathname.includes('/profiles')?{is_pro:true,has_completed_onboarding:true}:url.pathname.includes('sow_documents')?(url.searchParams.has('id')?(inserted&&url.searchParams.get('id').includes(inserted.id)?inserted:original):[original,...(inserted?[inserted]:[])]):[];
return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});}
if(!['GET','HEAD','OPTIONS'].includes(q.method()))return r.abort();return r.continue();});
const p=await c.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/edit/'+original.id);
await p.getByLabel('Added scope',{exact:true}).fill(input.scope);await p.getByLabel('Additional fee (USD)',{exact:true}).fill(input.amount);await p.getByLabel('Timeline impact',{exact:true}).fill(input.timeline);
await p.getByRole('button',{name:'Review separate change order',exact:true}).click();await p.waitForURL('**/create?mode=editor');
const text=p.getByLabel('Agreement text',{exact:true});await text.waitFor();assert.match(await text.inputValue(),/Original agreement ID: 00000000-0000-4000-8000-000000000099/);assert.match(await text.inputValue(),/350.00/);
await p.reload();await text.waitFor();assert.match(await text.inputValue(),/One booking page/);
await p.getByRole('button',{name:'Create Client Link',exact:true}).click();await p.waitForURL('**/dashboard');
assert.ok(inserted);assert.equal(inserted.price,350);assert.equal(inserted.status,'Draft');assert.equal(inserted.client_name,'Example Studio');assert.ok(!inserted.signed_by&&!inserted.provider_sign&&!inserted.payment_received_cents);assert.deepEqual(patches,[]);assert.equal(JSON.stringify(original),before);
await p.goto(base+'/sow/'+inserted.id);await p.getByRole('heading',{name:'One addition to your project.',exact:true}).waitFor();assert.equal(await p.getByRole('link',{name:'Read original agreement',exact:true}).getAttribute('href'),'/sow/'+original.id);await p.getByText('Awaiting client approval',{exact:true}).waitFor();
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.getByTestId('client-portal').getByRole('button',{name:/sign/i}).click();
const dialog=p.getByRole('dialog',{name:'Sign Contract',exact:true});await dialog.waitFor();for(let i=0;i<8;i++){await p.keyboard.press('Tab');assert.ok(await dialog.evaluate(e=>e.contains(document.activeElement)));}await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.deepEqual(errors,[]);await c.close();
}console.log('PASS: separate change-order draft, reload, existing save handler, original unchanged, independent signature/payment state, original link and signing keyboard focus at 1440/390/320; all writes mocked.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
