'use client';
import {useEffect,useRef,useState} from 'react';
import {validHandle} from '../lib/publicBooking';

export default function CalendarBookingLink({actorId,disabled=false}:{actorId:string;disabled?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[url,setUrl]=useState('');
 const generation=useRef(0),working=useRef(false);
 useEffect(()=>{generation.current++;working.current=false;setBusy(false);setMessage('');setUrl('');return()=>{generation.current++;};},[actorId,disabled]);
 async function copy(){
  if(disabled||!actorId||working.current)return;
  const request=++generation.current;working.current=true;setBusy(true);setUrl('');setMessage('Checking your saved booking link...');
  const current=()=>generation.current===request;
  try{
   const response=await fetch('/api/workspace/public-booking',{cache:'no-store'});
   const body=await response.json();if(!current())return;
   if(!response.ok){setMessage(response.status===401?'Sign in again, then reload this calendar.':'Your booking link could not be checked. Retry or open booking-link settings.');return;}
   if(body.actorId!==actorId){setMessage('Account changed. Reload this calendar before copying a booking link.');return;}
   if(body.available!==true){setMessage('Customer booking is unavailable on this deployment. Open booking-link settings for details.');return;}
   if(!body.portal||body.portal.enabled!==true){setMessage('Your booking link is not enabled. Set it up in booking-link settings before sharing.');return;}
   if(typeof body.portal.token!=='string'||!validHandle(body.portal.token)){setMessage('The saved booking link could not be verified. Open booking-link settings.');return;}
   const link=window.location.origin+'/book/'+body.portal.token;
   setUrl(link);setMessage('Copying booking link...');
   try{await navigator.clipboard.writeText(link);if(current())setMessage('Booking link copied. Paste it into a message to your customer. No message was sent.');}
   catch{if(current())setMessage('Automatic copy was not confirmed. Select and copy the link below. No message was sent.');}
  }catch{if(current())setMessage('Your booking link could not be verified. Reload the calendar or open booking-link settings before sharing.');}
  finally{if(current()){working.current=false;setBusy(false);}}
 }
 return <section className="editorial-card space-y-3" aria-label="Share customer booking link">
  <h2 className="text-xl font-semibold">Let customers book with you</h2>
  <p>Copy your saved, enabled booking link. This does not enable bookings, replace your link or send invitations.</p>
  <button className="primary-action" disabled={disabled||!actorId||busy} onClick={()=>void copy()}>{busy?'Checking booking link...':'Copy customer booking link'}</button>
  <a className="block underline" href="/workspace/scheduling/public">Set up or manage customer booking link</a>
  {message&&<p role="status" aria-live="polite">{message}</p>}
  {url&&<label className="block">Customer booking link<input className="block w-full rounded border p-2" readOnly value={url} onFocus={event=>event.currentTarget.select()}/></label>}
 </section>;
}
