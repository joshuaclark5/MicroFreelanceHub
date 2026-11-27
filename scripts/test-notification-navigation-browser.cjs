const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL,host=process.env.QA_SUPABASE_HOST;
if(!base||!host||!process.env.QA_RECEIPT)throw Error('Explicit test target required');
const checks=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [360,390,1440]){
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage();let writes=0;
 const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user,token_type:'bearer'})),url:base}]);
 await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.hostname===host&&url.pathname==='/auth/v1/user')return route.fulfill({json:user});if(!['GET','HEAD'].includes(req.method())){writes++;return route.abort();}if(url.origin!==base)return route.abort();if(url.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture only'}});return route.continue();});
 await page.goto(base+'/settings/notifications');
 await page.getByRole('heading',{name:'Notification preferences',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Preference controls are not available yet',exact:true}).waitFor();
 assert.equal(await page.locator('main input,main select,main form').count(),0);
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex, nofollow');
 assert.equal(await page.locator('main [aria-current=page]').innerText(),'Notification preferences');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const summary=page.locator('.mfh-account-menu summary:visible').first();await summary.focus();await page.keyboard.press('Enter');
 const menu=summary.locator('..');assert.equal(await menu.getByRole('link',{name:'Notification preferences',exact:true}).getAttribute('href'),'/settings/notifications');
 const box=await summary.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=950);
 await page.screenshot({path:process.env.QA_RECEIPT+'.'+width+'.png'});
 await menu.getByRole('link',{name:'Notification preferences',exact:true}).click();
 await page.reload();await page.getByRole('heading',{name:'Notification preferences',exact:true}).waitFor();
 await page.getByRole('link',{name:'Back to Settings',exact:true}).click();await page.waitForURL('**/settings');
 await page.goBack();await page.getByRole('heading',{name:'Notification preferences',exact:true}).waitFor();
 assert.equal(writes,0);checks.push({width,menu:true,noOverflow:true,reloadAndBack:true,explicitUnavailable:true,noMutations:true});await context.close();
}
}finally{await browser.close();fs.writeFileSync(process.env.QA_RECEIPT,JSON.stringify({checks,scope:'Production build with mocked identity. No hosted writes or email.'},null,2));}console.log(JSON.stringify(checks));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
