import Stripe from 'stripe';
import {SeasonalOffer} from '../seasonalOffers';
// One reusable, first-invoice-only coupon per campaign; creating a coupon never charges anyone.
export async function seasonalCoupon(stripe:Stripe,offer:SeasonalOffer){
 const id=offer.id+'-annual-once';let coupon:Stripe.Coupon;
 try{coupon=await stripe.coupons.retrieve(id);}catch(e){
  if((e as {code?:string}).code!=='resource_missing')throw e;
  coupon=await stripe.coupons.create({id,name:offer.name+' 2026 — first annual year',percent_off:offer.percentOff,duration:'once',redeem_by:Math.floor(Date.parse(offer.endsAt)/1000)+3600,metadata:{purpose:'mfh_first_annual_year',campaign:offer.id}},{idempotencyKey:id});
 }
 if(!coupon.valid||coupon.percent_off!==offer.percentOff||coupon.duration!=='once'||coupon.metadata?.campaign!==offer.id||coupon.redeem_by!==Math.floor(Date.parse(offer.endsAt)/1000)+3600)throw Error('Offer configuration unavailable.');
 return id;
}
