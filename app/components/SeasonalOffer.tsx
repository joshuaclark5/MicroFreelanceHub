'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {SeasonalOffer} from '../lib/seasonalOffers';
export function useSeasonalOffer(){
 const [offer,setOffer]=useState<SeasonalOffer|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{let alive=true;const refresh=()=>fetch('/api/subscription-offer',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(alive){setOffer(data.offer);setReady(true);setError(false);}}).catch(()=>{if(alive){setOffer(null);setReady(false);setError(true);}});void refresh();const timer=setInterval(refresh,60000);return()=>{alive=false;clearInterval(timer);};},[]);
 return {offer,ready,error};
}
export default function SeasonalOfferBanner(){const {offer}=useSeasonalOffer();if(!offer)return null;return <aside aria-label="Seasonal subscription offer" style={{background:'#163d35',color:'#fff',padding:'14px 20px',textAlign:'center',fontSize:14,lineHeight:1.7}}><strong>{offer.name}: {offer.percentOff}% off your first annual year.</strong>{' '}First-time paid subscribers only. Ends {offer.endsLabel}.{' '}<Link href="/pricing" style={{color:'#fff',textDecoration:'underline',fontWeight:700}}>Compare annual plans</Link>{' · '}<Link href="/offers" style={{color:'#fff',textDecoration:'underline'}}>Offer terms</Link></aside>;}
