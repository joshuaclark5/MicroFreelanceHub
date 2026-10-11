const assert = require('node:assert/strict');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const base=process.env.QA_BASE_URL || 'http://localhost:3047';
 try {
  for(const width of [390,1440]) {
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.route(/google-analytics\.com|googletagmanager\.com/,r=>r.abort());
   let signup;
   await page.route('**/*.supabase.co/**',async r=>{
    if(r.request().url().includes('/auth/v1/signup')) {
     signup={url:r.request().url(),body:r.request().postDataJSON()};
     await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',email:'qa@example.test',identities:[]})});
    } else await r.abort();
   });
   await page.goto(base+'/pricing',{referer:'https://www.google.com/search?q=do-not-store'});
   await page.waitForFunction(()=>localStorage.getItem('marketing_source')==='referrer:google.com');
   await page.goto(base+'/login');
   await page.getByPlaceholder('Email address').fill('qa@example.test');
   await page.getByPlaceholder('Password',{exact:true}).fill('Fixture-password-not-real-2026');
   await page.getByRole('button',{name:'Create account',exact:true}).click();
   await page.getByText('Check your email to confirm your account, then continue with your agreement.',{exact:true}).waitFor();
   assert.equal(new URL(new URL(signup.url).searchParams.get('redirect_to')).searchParams.get('lead_source'),'referrer:google.com');
   assert.equal(signup.body.data.signup_lead_source,'referrer:google.com');
   assert.equal(signup.body.data.signup_landing_page,'/pricing');
   assert.ok(!JSON.stringify(signup).includes('do-not-store'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.close();
  }
  console.log('PASS desktop/mobile referral arrival -> email signup metadata and confirmation URL; no real account or email created.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
