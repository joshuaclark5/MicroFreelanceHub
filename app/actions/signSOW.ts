'use server';
import {createClient} from '@supabase/supabase-js';
import {createServerActionClient} from '@supabase/auth-helpers-nextjs';
import {cookies} from 'next/headers';
export async function signContract(sowId:string,signerName:string,role:'client'|'provider',version:number,reviewed:boolean){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sowId)||typeof signerName!=='string'||signerName.trim().length<2||signerName.trim().length>160||!['client','provider'].includes(role)||!Number.isSafeInteger(version)||version<1||reviewed!==true)return {error:'Review the current version, confirm your agreement and enter your name.'};
 try{
  const auth=createServerActionClient({cookies}),u=await auth.auth.getUser();
  if(u.error||!u.data.user)return {error:'Sign in with the intended recipient email, then review this agreement again.'};
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const r=await db.rpc('accept_reviewed_agreement',{p_document:sowId,p_version:version,p_actor:u.data.user.id,p_name:signerName.trim(),p_role:role});
  if(r.error||!r.data)return {error:r.error?.code==='40001'?'This version changed or a signature is already recorded. Reload and review the saved agreement.':'Acceptance is unavailable. Use the verified recipient account or contact the sender; no signature was recorded by this attempt.'};
  return {success:true,acceptance:r.data};
 }catch{return {error:'The signing result could not be confirmed. Reload to inspect the saved signature before trying again.'};}
}
