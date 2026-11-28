const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(path,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,Intl,require:n=>{assert.ok(n in mocks,n);return mocks[n];}});return exports;}
const pref=load('app/lib/workspaceExperience.ts',{'./businessTimezone':load('app/lib/businessTimezone.ts'),'./workspaceInvoices':load('app/lib/workspaceInvoices.ts')});
const base={business:'Test studio',profession:'',goal:'clients'},current={...base,country:'US',currency:'USD'};
assert.equal(pref.countryCodes.length,249);assert.equal(new Set(pref.countryCodes).size,249);
for(const code of pref.countryCodes)assert(pref.workspacePreferences({...current,country:code}));
for(const currency of pref.businessCurrencies)assert(pref.workspacePreferences({...current,currency}));
assert(pref.workspacePreferences(base),'old profiles remain readable');
for(const change of [{country:''},{country:'USA'},{country:'ZZ'},{country:1},{currency:''},{currency:'BTC'},{currency:'usd'},{addressCountry:'ZZ'},{addressLine1:'x'.repeat(121)},{addressLine1:'1 Test St'},{addressCountry:'US'}])assert.equal(pref.workspacePreferences({...current,...change}),null,JSON.stringify(change));
for(const [country,region,postal] of [['US','NY','10001'],['US','NY','10001-1234'],['CA','ON','K1A 0B1'],['GB','','SW1A 1AA'],['AU','NSW','2000'],['JP','','100-0001'],['KW','','13001'],['IE','',''],['HK','','']]){
 const value={...current,addressLine1:' 1 Test Street ',addressLine2:'',addressCity:'City',addressRegion:region,addressPostalCode:postal,addressCountry:country};
 assert.equal(pref.workspacePreferences(value)?.addressLine1,'1 Test Street',country);
 if(postal)assert.equal(pref.workspacePreferences({...value,addressPostalCode:'not-a-postal-code'}),null,country);
}
assert.equal(pref.suggestedBusinessLocale('en-US').currency,'USD');assert.equal(pref.suggestedBusinessLocale('en').country,'');assert.equal(pref.suggestedBusinessLocale('en-IN').currency,'');assert.equal(pref.suggestedBusinessLocale('invalid_locale').country,'');
let user={id:'owner',user_metadata:{unrelated:'keep'}},writes=0,failure=false;
const route=load('app/api/workspace-preferences/route.ts',{'../../lib/workspaceExperience':pref,'next/headers':{cookies:()=>({})},'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},'@supabase/auth-helpers-nextjs':{createRouteHandlerClient:()=>({auth:{getUser:async()=>({data:{user}}),updateUser:async({data})=>{writes++;if(failure)return {error:{message:'offline'},data:{user:null}};user={...user,user_metadata:{...user.user_metadata,...data}};return {data:{user}};}}})}});
const request=(preferences,expectedOwner='owner')=>new Request('https://fixture.invalid/api/workspace-preferences',{method:'POST',headers:{origin:'https://fixture.invalid','content-type':'application/json'},body:JSON.stringify({expectedOwner,preferences})});
(async()=>{
 const address={addressLine1:'1 Test St',addressLine2:'Suite 2',addressCity:'Test city',addressRegion:'NY',addressPostalCode:'10001',addressCountry:'US'};
 assert.equal((await route.POST(request({...current,...address}))).status,200);
 const old=await route.POST(request(base));for(const [key,value]of Object.entries({...address,country:'US',currency:'USD'}))assert.equal(old.body.preferences[key],value,key);
 const before=writes;assert.equal((await route.POST(request({...current,currency:'BTC'}))).status,400);assert.equal((await route.POST(request(current,'other'))).status,409);assert.equal(writes,before);
 failure=true;assert.equal((await route.POST(request({...current,currency:'EUR'}))).status,503);assert.equal(user.user_metadata.mfh_workspace.currency,'USD');failure=false;
 const cleared=await route.POST(request({...current,...Object.fromEntries(pref.addressFields.map(key=>[key,'']))}));assert.equal(cleared.status,200);for(const key of pref.addressFields)assert.equal(cleared.body.preferences[key],'');assert.equal(user.user_metadata.unrelated,'keep');
 const visibilityRequest=(body,origin='https://fixture.invalid')=>new Request('https://fixture.invalid/api/workspace-preferences',{method:'PATCH',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 const snapshot=JSON.stringify(user.user_metadata.mfh_workspace);let count=writes;
 for(const body of [{expectedOwner:'other',setupDismissed:true},{expectedOwner:'owner',setupDismissed:'true'},{expectedOwner:'owner',setupDismissed:true,preferences:{business:'overwrite'}}])assert([400,409].includes((await route.PATCH(visibilityRequest(body))).status));
 assert.equal((await route.PATCH(visibilityRequest({expectedOwner:'owner',setupDismissed:true},'https://foreign.invalid'))).status,403);assert.equal(writes,count);
 failure=true;assert.equal((await route.PATCH(visibilityRequest({expectedOwner:'owner',setupDismissed:true}))).status,503);failure=false;
 for(const setupDismissed of [true,false,true]){const result=await route.PATCH(visibilityRequest({expectedOwner:'owner',setupDismissed}));assert.equal(result.status,200);assert.equal(result.body.setupDismissed,setupDismissed);const read=await route.GET(new Request('https://fixture.invalid/api/workspace-preferences'));assert.equal(read.body.setupDismissed,setupDismissed);assert.equal(JSON.stringify(user.user_metadata.mfh_workspace),snapshot);assert.equal(user.user_metadata.unrelated,'keep');}
 assert.equal((await route.POST(request(current))).status,200);assert.equal(user.user_metadata.mfh_setup_dismissed,true);
 console.log('PASS setup visibility: owner/origin/type/extra-field rejection, failed update, repeated readback, unchanged workspace metadata, visibility retained through profile save.');
 console.log('PASS country/currency/address: ISO list, supported currencies, locale suggestions, legacy reads/writes, regional postal validation, optional clearing, invalid/foreign writes rejected, provider failure retains saved data.');
})().catch(e=>{console.error(e);process.exitCode=1});
