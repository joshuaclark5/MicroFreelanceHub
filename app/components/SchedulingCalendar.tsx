'use client';
import {useMemo, useState} from 'react';
import {Booking} from '../lib/workspaceScheduling';
import './scheduling-calendar.css';

export function calendarDate(instant:string, zone:string){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant));
 const get=(type:string)=>parts.find(p=>p.type===type)?.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
const key=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export default function SchedulingCalendar({bookings}:{bookings:Booking[]}){
 const [zone,setZone]=useState(()=>Intl.DateTimeFormat().resolvedOptions().timeZone);
 const today=calendarDate(new Date().toISOString(),zone);
 const [selected,setSelected]=useState(today),[month,setMonth]=useState(()=>today.slice(0,7)),[search,setSearch]=useState(''),[showCanceled,setShowCanceled]=useState(false);
 const zones=Array.from(new Set([Intl.DateTimeFormat().resolvedOptions().timeZone,'UTC',...bookings.map(b=>b.timezone)]));
 const visible=useMemo(()=>bookings.filter(b=>(showCanceled||b.status==='confirmed')&&b.attendee.toLowerCase().includes(search.toLowerCase().trim())).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)),[bookings,search,showCanceled]);
 const byDay=new Map<string,Booking[]>();visible.forEach(b=>{const day=calendarDate(b.starts_at,zone);byDay.set(day,[...(byDay.get(day)||[]),b]);});
 const [year,number]=month.split('-').map(Number),first=new Date(year,number-1,1),length=new Date(year,number,0).getDate();
 const agenda=byDay.get(selected)||[];
 function move(offset:number){const next=new Date(year,number-1+offset,1);setMonth(key(next).slice(0,7));setSelected(key(next));}
 const label=(day:string)=>new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 const clock=(iso:string)=>new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(new Date(iso));
 return <section className="schedule-calendar" aria-label="Appointment calendar">
  <div className="calendar-heading"><div><p className="calendar-eyebrow">ROOM FOR YOUR BEST WORK</p><h2>Your calendar</h2><p>One clear view of your saved MFH appointments.</p></div><a href="#new-booking" className="primary-action">New booking</a></div>
  <div className="calendar-filters"><label>Find an attendee<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search appointments"/></label><label>Display timezone<select value={zone} onChange={e=>setZone(e.target.value)}>{zones.map(z=><option key={z}>{z}</option>)}</select></label><label className="calendar-check"><input type="checkbox" checked={showCanceled} onChange={e=>setShowCanceled(e.target.checked)}/>Include canceled</label></div>
  <div className="calendar-layout"><div className="calendar-month">
   <div className="calendar-toolbar"><h3 aria-live="polite">{first.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h3><div><button aria-label="Previous month" onClick={()=>move(-1)}>←</button><button onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>Today</button><button aria-label="Next month" onClick={()=>move(1)}>→</button></div></div>
   <div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span className="calendar-weekday" key={d}>{d}</span>)}
    {Array.from({length:first.getDay()},(_,i)=><span aria-hidden="true" key={'blank'+i}/>)}
    {Array.from({length},(_,i)=>{const day=key(new Date(year,number-1,i+1)),items=byDay.get(day)||[];return <button key={day} className={'calendar-day'+(day===today?' calendar-today':'')} aria-pressed={selected===day} aria-label={`${label(day)}, ${items.length} appointments`} onClick={()=>setSelected(day)}><span>{i+1}</span>{items.length>0&&<><small>{items.length}<span className="calendar-count-label"> booked</span></small><span className="calendar-attendee">{items[0].attendee}</span></>}</button>;})}
   </div>
  </div><aside className="calendar-agenda" aria-label="Selected day agenda"><p className="calendar-eyebrow">YOUR DAY AT A GLANCE</p><h3>{label(selected)}</h3><p className="calendar-zone">Times in {zone}</p><div aria-live="polite">{agenda.length===0?<div className="calendar-empty"><strong>A little breathing room.</strong><p>{search?'No matching appointments on this day.':'No appointments on this day.'}</p><a href="#new-booking">Plan an appointment →</a></div>:agenda.map(b=><article key={b.id}><p className="calendar-time">{clock(b.starts_at)} – {clock(b.ends_at)}{calendarDate(b.ends_at,zone)!==selected?' (+ next day)':''}</p><h4>{b.attendee}</h4><p className="calendar-status">{b.status==='confirmed'?'Confirmed':'Canceled'}</p><a href={'#booking-'+b.id}>View booking details →</a></article>)}</div></aside></div>
  <p className="calendar-footnote">Saved MFH bookings only; external calendar events are not shown here. Text reminders are not enabled.</p>
 </section>;
}
