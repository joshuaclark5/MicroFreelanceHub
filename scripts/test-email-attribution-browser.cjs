const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:950}});
   await page.route(/google-analytics\.com|googletagmanager\.com/,r=>r.abort());
   let signupUrl;
   await page.route('**/*.supabase.co/**',async route=>{
    const request=route.request();
    if(request.url().includes('/auth/v1/signup')){
     signupUrl=new URL(request.url());
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',email:'qa@example.test',identities:[]})});
    }else await route.abort();
   });
   await page.addInitScript(()=>{localStorage.setItem('landing_page','/templates/gutter-installer-contract-template');localStorage.setItem('marketing_source','superpath');});
   await page.goto((process.env.QA_BASE_URL||'http://localhost:3036')+'/login');
   await page.getByPlaceholder('Email address').fill('qa@example.test');
   await page.getByPlaceholder('Password',{exact:true}).fill('Fixture-password-not-real-2026');
   await page.getByRole('button',{name:'Create account',exact:true}).click();
   await page.getByText('Check your email to confirm your account, then continue with your agreement.',{exact:true}).waitFor();
   const callback=new URL(signupUrl.searchParams.get('redirect_to'));
   assert.equal(callback.searchParams.get('lead_source'),'superpath');
   assert.equal(callback.searchParams.get('landing_page'),'/templates/gutter-installer-contract-template');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.close();
  }
  console.log('PASS: desktop/mobile email confirmation carries stored attribution; all auth requests mocked, no email/account created.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
