'use client';
import {usePathname} from 'next/navigation';
import SeasonalOfferBanner from './SeasonalOffer';
export default function SitewideSeasonalOffer(){
 const path=usePathname();
 // Do not advertise subscriptions in private work or customer transaction flows.
 if(!path||['/workspace','/dashboard','/settings','/checkout-plan','/sow','/book','/sign','/portal','/create','/edit','/preview','/invoice','/pay','/auth','/login','/reset-password'].some(root=>path===root||path.startsWith(root+'/')))return null;
 return <SeasonalOfferBanner/>;
}
