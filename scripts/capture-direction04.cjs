const fs=require('node:fs'),assert=require('node:assert/strict');
require('dotenv').config({path:'.env.local',quiet:true});
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3047', out=process.env.QA_EVIDENCE_DIR||'qa-d4-complete';
const host=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
const docs=[
{id:'00000000-0000-4000-8000-000000000099',user_id:user.id,title:'Website redesign',client_name:'Example Studio',client_data:{email:'client@example.test'},status:'Signed',signed_by:'Example Client',provider_sign:'Morgan Design',price:2400,payment_received_cents:120000,deliverables:'Five pages: home, about, services, work and contact. Includes responsive layouts and two revision rounds.\n\nTimeline: Four weeks from kickoff.\n\nAdditional requests need a separate quote and approval.',payment_type:'one_time',line_items:[{id:'base',description:'Website redesign',quantity:1,amount:2400}],payment_schedule_structured:{type:'50',depositAmount:1200},created_at:'2026-10-01T12:00:00Z'},
{id:'draft-fixture',user_id:user.id,title:'Brand identity',client_name:'Sample Design Co.',status:'Draft',price:1800,payment_type:'one_time',created_at:'2026-10-01T12:00:00Z'},
{id:'paid-fixture',user_id:user.id,title:'Gutter installation',client_name:'Sample Property',status:'Paid',price:3200,payment_received_cents:320000,payment_type:'one_time',created_at:'2026-10-01T12:00:00Z'}];
(async()=>{fs.mkdirSync(out,{recursive:true}); const b=await chromium.launch({channel:'msedge',headless:true});const results=[];try{
for(const width of [1440,390,320]){
 const c=await b.newContext({viewport:{width,height:1000}});let empty=false, unavailable=false;
 await c.addCookies([{name:`sb-${host.split('.')[0]}-auth-token`,value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
 await c.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(/google-analytics|googletagmanager/.test(u.hostname))return r.abort();
 if(u.hostname===host){if(q.method()!=='GET')return r.abort();if(unavailable&&u.pathname.includes('sow_documents'))return r.fulfill({status:503,contentType:'application/json',body:'{"message":"Fixture connection unavailable"}'});
 const body=u.pathname.includes('/auth/')?user:u.pathname.includes('profiles')?{is_pro:true,has_completed_onboarding:true,stripe_account_id:null,full_name:'Morgan Design',company_name:'Morgan Design'}:u.pathname.includes('sow_documents')?(u.searchParams.has('id')?docs[0]:empty?[]:docs):[];
 return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});}
 if(u.pathname==='/api/stripe/subscription')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({plan:'Free',status:'No subscription',cycle:'None',nextDate:null,canManage:false,canCancel:false})});
 if(!['GET','HEAD','OPTIONS'].includes(q.method()))return r.abort();return r.continue();});
 const p=await c.newPage();p.setDefaultTimeout(20000);let errors=[];p.on('pageerror',e=>errors.push(e.message));
 async function snap(name){await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.scrollTo(0,0);await new Promise(r=>requestAnimationFrame(r));});await p.screenshot({path:`${out}/${name}-${width}.png`,fullPage:false});const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);let accessibility=[];
if(process.env.QA_AXE==='1'){await p.addScriptTag({path:'C:/Users/joshu/microfreelancehub/node_modules/axe-core/axe.min.js'});accessibility=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});}
results.push({screen:name,width,overflow,errors:[...errors],accessibility});}
 for(const [name,path] of [['home','/'],['pricing','/pricing'],['seo','/templates/web-development-contract'],['service-template','/templates/mobile-mechanic-contract-template']]){await p.goto(base+path);await snap(name);}
 await p.goto(base+'/dashboard');await p.getByRole('heading',{name:'Your agreements',exact:true}).waitFor();await snap('dashboard');
 await p.getByLabel('Search agreements or clients').fill('no matching fixture');await snap('no-results');
 empty=true;await p.reload();await p.getByRole('heading',{name:'Your first agreement starts here.',exact:true}).waitFor();await snap('empty');empty=false;
 if(process.env.QA_BASELINE!=='1'){unavailable=true;await p.goto(base+'/dashboard');await p.getByRole('alert').waitFor();await snap('dashboard-error');unavailable=false;}
 await p.goto(base+'/settings');await p.getByText('Morgan Design',{exact:true}).first().waitFor();await snap('settings');
 await p.goto(base+'/edit/'+docs[0].id);await p.getByPlaceholder('Untitled Agreement').waitFor();await p.getByPlaceholder('Untitled Agreement').fill('Website redesign + booking page');if(await p.getByLabel('Added scope',{exact:true}).count()){await p.getByLabel('Added scope',{exact:true}).fill('Add a booking page and connect the supplied scheduling link.');await p.getByLabel('Additional fee (USD)',{exact:true}).fill('350');await p.getByLabel('Timeline impact',{exact:true}).fill('+2 business days');}await snap('change');
 await p.goto(base+'/sow/'+docs[0].id);await p.getByTestId('client-portal').waitFor();await snap('portal');
 if(process.env.QA_BASELINE!=='1'){
 const prior={...docs[0]};
 docs[0].payment_type='none';docs[0].price=0;docs[0].signed_by=null;docs[0].provider_sign=null;docs[0].status='Draft';await p.reload();await p.getByTestId('client-portal').waitFor();await snap('no-payment');
 Object.assign(docs[0],prior);docs[0].status='Paid';docs[0].payment_received_cents=240000;await p.reload();await p.getByTestId('client-portal').waitFor();await snap('paid');
 Object.assign(docs[0],prior);
 unavailable=true;await p.reload();await p.getByRole('heading',{name:'Agreement unavailable'}).waitFor();await snap('portal-unavailable');unavailable=false;
 }
 await p.goto(base+'/sow/'+docs[0].id+'?payment=success');await p.getByRole('status').filter({hasText:'confirmation is pending'}).waitFor();await snap('payment-pending');
 docs[0].signed_by=null;docs[0].provider_sign=null;docs[0].status='Draft';
 await p.goto(base+'/sow/'+docs[0].id);await p.getByTestId('client-portal').waitFor();await snap('unsigned-portal');
 const priorTitle=docs[0].title,priorText=docs[0].deliverables,priorPrice=docs[0].price,priorReceived=docs[0].payment_received_cents;
 docs[0].title='Change order: Website redesign';docs[0].price=350;docs[0].payment_received_cents=0;docs[0].payment_schedule_structured={type:'none',depositAmount:350};
 docs[0].deliverables='CHANGE ORDER / SEPARATE AGREEMENT\nOriginal agreement ID: 00000000-0000-4000-8000-000000000098\n\nADDITIONAL SCOPE\nAdd a booking page and connect the supplied scheduling link.\n\nTIMELINE IMPACT\n+2 business days\n\nPAYMENT FOR THIS ADDITION\nAdditional fee USD 350. Review before signing.';
 await p.reload();await p.getByTestId('client-portal').waitFor();await snap('client-approval');
 await p.getByTestId('client-portal').getByRole('button',{name:/sign/i}).click();await p.getByRole('heading',{name:'Sign Contract',exact:true}).waitFor();await snap('signing');
 docs[0].title=priorTitle;docs[0].deliverables=priorText;docs[0].price=priorPrice;docs[0].payment_received_cents=priorReceived;docs[0].payment_schedule_structured={type:'50',depositAmount:1200};
 docs[0].signed_by='Example Client';docs[0].provider_sign='Morgan Design';docs[0].status='Signed';
 await p.goto(base+'/create');await p.getByLabel('Project name',{exact:true}).fill('Website redesign');
 if(await p.getByLabel('Client name (optional)').count())await p.getByLabel('Client name (optional)').fill('Example Studio');
 await snap('project');await p.getByRole('button',{name:'Continue',exact:true}).click();
 const scope=p.getByLabel('What will you deliver?',{exact:true});if(await scope.count()){await scope.fill('Five-page website: home, about, services, work and contact. Responsive layouts for desktop and mobile.');await p.getByLabel('Revision rounds').selectOption('2 rounds');await p.getByLabel('Target completion').fill('November 6, 2026');await p.getByLabel('What is not included?').fill('Copywriting, hosting and additional pages. New requests require a separate quote and approval.');await snap('editor');await p.getByRole('button',{name:'Payment options',exact:true}).click();await p.getByLabel('Project price (USD, optional)').fill('2400');await p.getByLabel('Payment schedule').selectOption('50');await snap('payment');await p.getByRole('button',{name:'Review brief',exact:true}).click();await snap('review');await p.getByRole('button',{name:'Preview',exact:true}).click();await snap('preview');await p.getByRole('button',{name:'Close',exact:true}).click();await p.getByRole('button',{name:'Review agreement',exact:true}).click();await p.getByLabel('Agreement text').waitFor();await snap('direct');}
 else {await p.getByLabel('Deliverables and included revisions').fill('Five pages and two revision rounds.');await snap('editor');}
 await c.close();
}
fs.writeFileSync(out+'/layout.json',JSON.stringify(results,null,2));if(results.some(r=>r.overflow||r.errors.length||r.accessibility.length))process.exitCode=1;console.log(JSON.stringify({screens:results.length,overflows:results.filter(r=>r.overflow),runtimeErrors:results.filter(r=>r.errors.length)}));}
finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
