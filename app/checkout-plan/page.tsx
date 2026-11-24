'use client';
import {useState,Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import {getTrackedData} from '../lib/trackingClient';
import {isPaidPlan,planQuote,PRICING_VERSION} from '../lib/planPricing';
function CheckoutLogic(){
 const params=useSearchParams(),plan=params.get('plan'),cycle=params.get('billing')==='annual'?'annual':'monthly';
 const [db]=useState(()=>createClientComponentClient()),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const quote=isPaidPlan(plan)?planQuote(plan,cycle):null;
 async function checkout(){
  if(busy||!quote)return;setBusy(true);setError('');
  try{
   const {data:{user}}=await db.auth.getUser();
   const tracked=getTrackedData();const landingPage=params.get('landing_page')||tracked.landing_page,leadSource=params.get('lead_source')||tracked.lead_source;
   if(!user){const url=new URL('/login',window.location.origin);url.searchParams.set('plan',plan!);url.searchParams.set('billing',cycle);if(landingPage)url.searchParams.set('landing_page',landingPage);if(leadSource)url.searchParams.set('lead_source',leadSource);window.location.assign(url.toString());return;}
   const res=await fetch('/api/stripe/checkout-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,billingCycle:cycle,pricingVersion:PRICING_VERSION,userId:user.id,landingPage,leadSource})});
   const result=await res.json();if(!res.ok||!result.url)throw Error(result.error||'Unable to open checkout. Please retry.');window.location.assign(result.url);
  }catch(e){setError(e instanceof Error?e.message:'Unable to open checkout. Please retry.');setBusy(false);}
 }
 return <main className="mfh-checkout min-h-screen flex items-center justify-center bg-slate-50 p-5"><section className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-8 text-slate-900">
  <p className="text-sm font-semibold text-emerald-800">MICROFREELANCEHUB</p><h1 className="text-3xl font-semibold my-5">Review your subscription</h1>
  {!quote?<p role="alert">Choose a valid plan to continue.</p>:<><h2 className="text-xl font-semibold">{quote.name}</h2><p className="text-4xl font-bold my-5">${quote.amount/100}<span className="text-base font-normal"> / {quote.interval}</span></p><p>{cycle==='annual'?`Equivalent to $${quote.monthlyEquivalent}/month, billed as one annual payment.`:'Billed monthly.'} Renews at this rate until canceled or changed.</p><p className="mt-4 text-sm text-slate-600">Review the final total, any discounts and applicable taxes in Stripe before subscribing. Client payment processing fees are separate. SMS is not included. Existing subscriptions are not changed here.</p><button className="mt-6 w-full rounded-xl bg-emerald-900 text-white font-semibold p-4 disabled:opacity-50" disabled={busy} onClick={checkout}>{busy?'Opening checkout...':'Continue to secure checkout'}</button></>}
  {error&&<p role="alert" className="mt-4 text-red-800">{error}</p>}<div className="mt-6 flex gap-5 flex-wrap"><Link className="underline" href="/pricing">Compare plans</Link><Link className="underline" href="/settings">Manage existing subscription</Link></div>
 </section></main>;
}
export default function CheckoutPlanPage(){return <Suspense fallback={<p role="status">Loading subscription details...</p>}><CheckoutLogic/></Suspense>;}
