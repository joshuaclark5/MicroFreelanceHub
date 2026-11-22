// Read-only operational counts, not visitor conversion rates or financial certification.
const fs=require('node:fs'),dotenv=require('dotenv');
const [envFile,out]=process.argv.slice(2);if(!envFile||!out)throw Error('Private environment path and evidence destination required.');
const env=dotenv.parse(fs.readFileSync(envFile));
const origin=env.NEXT_PUBLIC_SUPABASE_URL;
if(origin!=='https://rjgttmwrbyjqifodjnqm.supabase.co')throw Error('Production identity not confirmed.');
const key=env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw Error('Read credentials unavailable');
const headers={apikey:key,Authorization:'Bearer '+key,'Accept-Profile':'public'};
async function count(table,filter=''){
 const r=await fetch(origin+'/rest/v1/'+table+'?select=*'+filter,{method:'HEAD',headers:{...headers,Prefer:'count=exact'},signal:AbortSignal.timeout(20000)});
 if(!r.ok)return {unavailable:true,status:r.status};const n=Number(r.headers.get('content-range')?.split('/')[1]);return Number.isSafeInteger(n)?n:{unavailable:true};
}
(async()=>{
 const rows={};for(const [name,table,filter]of [['profiles','profiles',''],['profiles_with_subscription_reference','profiles','&subscription_id=not.is.null'],['profiles_with_attribution','profiles','&or=(signup_landing_page.not.is.null,lead_source.not.is.null)'],['agreements','sow_documents','&slug=is.null'],['verified_agreement_receipts','agreement_payment_receipts',''],['clients','workspace_clients',''],['projects','workspace_projects',''],['time_entries','workspace_time_entries','']])rows[name]=await count(table,filter);
 const r=await fetch(origin+'/auth/v1/admin/users?page=1&per_page=1000',{headers,signal:AbortSignal.timeout(20000)});
 if(r.ok){const data=await r.json(),users=data.users||[];rows.auth_account_count=users.length;rows.auth_count_complete=users.length<1000;rows.confirmed_accounts=users.filter(u=>u.email_confirmed_at||u.phone_confirmed_at).length;rows.accounts_created_last_30_days=users.filter(u=>Date.parse(u.created_at)>Date.now()-30*86400000).length;rows.accounts_with_signin_last_30_days=users.filter(u=>Date.parse(u.last_sign_in_at)>Date.now()-30*86400000).length;}
 const result={at:new Date().toISOString(),source:'Production read-only Supabase counts',caveats:['Includes staff and synthetic accounts; not qualified traffic or a conversion funnel.','A subscription reference is not evidence of a current paid subscription.','Recent sign-in is not cohort retention.','Qualified visits, signup rates and paid retention need GA4 and reconciled cohort data; unavailable here.'],rows};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
