const assert=require('node:assert/strict');require('dotenv').config({path:'.env.local',quiet:true});
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3050',host=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
const jwt=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [390,1440]){
 const c=await b.newContext({viewport:{width,height:950}});let expired=false,updates=0,exchanges=0,failUpdate=false;
 await c.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(/google-analytics|googletagmanager/.test(u.hostname))return r.abort();
 if(u.hostname===host){let body=user,status=200;
 if(u.pathname.endsWith('/token')){exchanges++;body=expired?{error:'invalid_grant',error_description:'Reset link expired'}:{access_token:jwt,refresh_token:'fixture-refresh',expires_in:3600,token_type:'bearer',user};status=expired?400:200;}
 if(q.method()==='PUT'){updates++;if(failUpdate)return r.abort();assert.equal(JSON.parse(q.postData()).password,'Fixture-password-2026');}
 return r.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});}
 if(!['GET','HEAD','OPTIONS'].includes(q.method()))return r.abort();return r.continue();});
 const p=await c.newPage();await p.goto(base+'/reset-password');await p.getByText(/missing, expired or invalid/).waitFor();assert.equal(await p.getByLabel('New password',{exact:true}).count(),0);
 await c.addCookies([{name:`sb-${host.split('.')[0]}-auth-token-code-verifier`,value:encodeURIComponent(JSON.stringify('fixture-verifier/PASSWORD_RECOVERY')),url:base}]);
 await p.goto(base+'/reset-password?code=fixture-valid');await p.getByLabel('New password',{exact:true}).waitFor();assert.equal(exchanges,1,'PKCE code exchanged exactly once');
 await p.screenshot({path:`recovery-${width}.png`});await p.addScriptTag({path:'C:/Users/joshu/microfreelancehub/node_modules/axe-core/axe.min.js'});assert.deepEqual(await p.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
 await p.getByLabel('New password',{exact:true}).fill('Fixture-password-2026');await p.getByLabel('Confirm new password').fill('Different-password-2026');await p.getByRole('button',{name:'Update password',exact:true}).click();await p.getByText('Passwords do not match.',{exact:true}).waitFor();assert.equal(updates,0);
 await p.getByLabel('Confirm new password').fill('Fixture-password-2026');failUpdate=true;await p.getByRole('button',{name:'Update password',exact:true}).click();await p.getByRole('alert').waitFor();assert.ok(await p.getByRole('button',{name:'Update password',exact:true}).isEnabled());failUpdate=false;
 await p.getByRole('button',{name:'Update password',exact:true}).click();await p.getByText('Your password has been updated.',{exact:true}).waitFor();assert.ok(!p.url().includes('code='));assert.equal(await p.locator('script[src*="googletagmanager"]').count(),0);
 await c.clearCookies();expired=true;await c.addCookies([{name:`sb-${host.split('.')[0]}-auth-token-code-verifier`,value:encodeURIComponent(JSON.stringify('fixture-verifier/PASSWORD_RECOVERY')),url:base}]);await p.goto(base+'/reset-password?code=fixture-expired');await p.getByText(/missing, expired or invalid/).waitFor();assert.equal(await p.getByLabel('New password',{exact:true}).count(),0);
 await c.clearCookies();await p.goto(base+'/signup-success');await p.waitForURL('**/login?mode=signin');assert.equal(await p.getByText('Free account created',{exact:true}).count(),0);
 expired=false;await c.addCookies([{name:`sb-${host.split('.')[0]}-auth-token-code-verifier`,value:encodeURIComponent(JSON.stringify('fixture-verifier/PASSWORD_RECOVERY')),url:base}]);await p.goto(base+'/login?code=fixture-legacy');await p.waitForURL('**/reset-password**');await p.getByLabel('New password',{exact:true}).waitFor();
 await c.clearCookies();await p.goto(base+'/reset-password#access_token='+jwt+'&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=recovery');await p.getByLabel('New password',{exact:true}).waitFor();
 await p.goto(base+'/pricing');assert.equal(await p.getByText('Start Your Free Trial',{exact:true}).count(),0);assert.equal(await p.getByText('DocuSign',{exact:true}).count(),0);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await c.close();
 }console.log('PASS recovery missing/valid/expired/mismatch/network retry, single code exchange, anonymous continuation redirect, auth analytics suppression and pricing clarity. All auth requests intercepted; no real passwords changed.');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
