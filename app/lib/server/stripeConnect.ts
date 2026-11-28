import {createHash,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
export const connectState=()=>randomBytes(32).toString('base64url');
export const connectHash=(state:string)=>createHash('sha256').update(state).digest('hex');
export function connectConfig(){
 const clientId=process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID?.trim();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,secret=process.env.STRIPE_SECRET_KEY;
 return clientId&&url&&key&&secret?{clientId,url,key,secret}:null;
}
export async function connectAttempt(action:'begin'|'consume'|'complete',actor:string,state:string,origin:string,account?:string){
 const c=connectConfig();if(!c)return false;
 const db=createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false}});
 const r=await db.rpc('stripe_connect_authorization',{p_action:action,p_actor:actor,p_hash:connectHash(state),p_origin:origin,p_account:account||null});
 return !r.error&&r.data===true;
}
