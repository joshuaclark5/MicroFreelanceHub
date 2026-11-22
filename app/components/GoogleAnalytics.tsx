'use client';
import Script from 'next/script';
import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {analyticsAllowed,publicAnalyticsPath} from '../lib/analyticsPrivacy';
const ID='G-3PZE2XQMH0';
type AnalyticsWindow=Window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;'ga-disable-G-3PZE2XQMH0'?:boolean;mfhAnalyticsInitialized?:boolean};
export default function GoogleAnalytics(){
 const pathname=usePathname();
 const [enabled,setEnabled]=useState(false);
 const lastView=useRef<string|null>(null);
 useEffect(()=>{
  const w=window as AnalyticsWindow;
  const path=publicAnalyticsPath(pathname);
  const allowed=!!path&&analyticsAllowed(navigator);
  w['ga-disable-'+ID]=!allowed;
  setEnabled(allowed);
  if(!allowed){lastView.current=null;return;}
  w.dataLayer ||= [];
  w.gtag ||= function(){w.dataLayer!.push(arguments);};
  if(!w.mfhAnalyticsInitialized){w.gtag('js',new Date());w.mfhAnalyticsInitialized=true;}
  const location='https://www.microfreelancehub.com'+path;
  w.gtag('config',ID,{send_page_view:false,page_location:location,page_path:path,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});
  if(lastView.current!==path){w.gtag('event','page_view',{page_location:location,page_path:path,page_referrer:'',page_title:document.title});lastView.current=path;}
  return()=>{w['ga-disable-'+ID]=true;};
 },[pathname]);
 return enabled?<Script id="mfh-ga-library" strategy="afterInteractive" src={'https://www.googletagmanager.com/gtag/js?id='+ID}/>:null;
}
