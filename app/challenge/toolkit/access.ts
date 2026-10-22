import 'server-only';
import {cookies} from 'next/headers';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
export async function toolkitAccess():Promise<'allowed'|'signin'|'upgrade'|'unavailable'>{
 try{const store=cookies();const db=createServerComponentClient({cookies:()=>store});const{data:{user},error}=await db.auth.getUser();if(error||!user)return 'signin';
 const{data:profile,error:pe}=await db.from('profiles').select('stripe_customer_id').eq('id',user.id).maybeSingle();if(pe)return 'unavailable';if(!profile?.stripe_customer_id)return 'upgrade';
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!);const subs=await stripe.subscriptions.list({customer:profile.stripe_customer_id,status:'active',limit:100});
 return subs.data.some(s=>s.metadata.userId===user.id && ['starter','pro','agency'].includes(s.metadata.plan))?'allowed':'upgrade';
 }catch{return 'unavailable';}
}
