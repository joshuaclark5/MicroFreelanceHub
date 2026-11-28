import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {apiVersion: '2023-10-16' as any});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});

export async function POST(request: Request) {
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open Settings on this website to manage billing.'},403);
  try {
    const cookieStore = cookies();
    const auth = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: userError } = await auth.auth.getUser();
    if (userError || !user) return reply({error:'Sign in required'},401);
    const { data: profile, error: profileError } = await supabase.from('profiles').select('stripe_customer_id').eq('id',user.id).single();
    if(profileError){
      console.warn('billing_portal_profile_lookup_unavailable');
      return reply({error:'Billing details are temporarily unavailable. Your subscription has not been changed. Try again shortly or contact admin@microfreelancehub.com.'},503);
    }
    if(!profile?.stripe_customer_id)return reply({error:'No billing account is linked. If you already subscribed, contact admin@microfreelancehub.com before starting another subscription.'},404);
    const portalSession = await stripe.billingPortal.sessions.create({customer:profile.stripe_customer_id,return_url:`${process.env.NEXT_PUBLIC_BASE_URL}/settings`});
    return reply({url:portalSession.url});
  } catch {
    // Provider errors may contain private account/request details. Never log them.
    console.warn('billing_portal_provider_unavailable');
    return reply({error:'The billing portal is temporarily unavailable. Your subscription has not been changed. Try again shortly or contact admin@microfreelancehub.com.'},502);
  }
}
