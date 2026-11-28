import {createServerActionClient} from '@supabase/auth-helpers-nextjs';
import {cookies} from 'next/headers';
// Decode session identity only AFTER the provider validates this exact token.
export async function verifiedAgreementSession(){
 const auth=createServerActionClient({cookies});
 const {data:{session}}=await auth.auth.getSession();
 if(!session?.access_token)return null;
 const result=await auth.auth.getUser(session.access_token);
 if(result.error||!result.data.user)return null;
 try{
  const claims=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url').toString('utf8'));
  if(claims.sub!==result.data.user.id||typeof claims.session_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.session_id))return null;
  return {actor:result.data.user.id,session:claims.session_id as string};
 }catch{return null;}
}
