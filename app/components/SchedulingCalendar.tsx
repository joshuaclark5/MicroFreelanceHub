'use client';
import {useEffect, useMemo, useState} from 'react';
import TimezoneSelect from './TimezoneSelect';
import {Booking, Availability, availabilityMatches} from '../lib/workspaceScheduling';
import './scheduling-calendar.css';

export function calendarDate(instant:string, zone:string){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant));
 const get=(type:string)=>parts.find(p=>p.type===type)?.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
const key=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export default function SchedulingCalendar({bookings,availability,managementPath=''}:{bookings:Booking[];availability?:Availability[];managementPath?:string}){
 const [zone,setZone]=useState('UTC');
 const [mounted,setMounted]=useState(false);
 const today=mounted?calendarDate(new Date().toISOString(),zone):'2000-01-01';
 useEffect(()=>{const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;const day=calendarDate(new Date().toISOString(),zone);setZone(zone);setSelected(day);setMonth(day.slice(0,7));setMounted(true);},[]);
 const [selected,setSelected]=useState(today),[month,setMonth]=useState(()=>today.slice(0,7)),[search,setSearch]=useState(''),[showCanceled,setShowCanceled]=useState(false);
 const visible=useMemo(()=>bookings.filter(b=>(showCanceled||b.status==='confirmed')&&b.attendee.toLowerCase().includes(search.toLowerCase().trim())).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)),[bookings,search,showCanceled]);
 const byDay=new Map<string,Booking[]>();visible.forEach(b=>{const day=calendarDate(b.starts_at,zone);byDay.set(day,[...(byDay.get(day)||[]),b]);});
 const [year,number]=month.split('-').map(Number),first=new Date(year,number-1,1),length=new Date(year,number,0).getDate();
 const agenda=byDay.get(selected)||[];
 const canonicalZone=(value:string)=>new Intl.DateTimeFormat('en',{timeZone:value}).resolvedOptions().timeZone;
 const rulesInZone=(availability||[]).filter(r=>r.active&&canonicalZone(r.timezone)===canonicalZone(zone));
 const working=rulesInZone.filter(r=>availabilityMatches(r.weekday,r.recurrence,selected));
 const otherZones=Array.from(new Set((availability||[]).filter(r=>r.active&&canonicalZone(r.timezone)!==canonicalZone(zone)).map(r=>r.timezone)));
 const minutes=(value:number)=>String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
 function move(offset:number){const next=new Date(year,number-1+offset,1);setMonth(key(next).slice(0,7));setSelected(key(next));}
 const label=(day:string)=>new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 const clock=(iso:string)=>new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(new Date(iso));
 if(!mounted)return <p role="status">Loading your calendar...</p>;
 return <section className="schedule-calendar" aria-label="Appointment calendar">
  <div className="calendar-heading"><div><p className="calendar-eyebrow">ROOM FOR YOUR BEST WORK</p><h2>Your calendar</h2><p>Saved appointments{availability?' and scheduled working hours':''}.</p></div><a href={managementPath+"#new-booking"} className="primary-action">New booking</a></div>
  <div className="calendar-filters"><label>Find an attendee<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search appointments"/></label><TimezoneSelect label="Display timezone" value={zone} onChange={setZone}/><label className="calendar-check"><input type="checkbox" checked={showCanceled} onChange={e=>setShowCanceled(e.target.checked)}/>Include canceled</label></div>
  <div className="calendar-layout"><div className="calendar-month">
   <div className="calendar-toolbar"><h3 aria-live="polite">{first.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h3><div><button aria-label="Previous month" onClick={()=>move(-1)}>←</button><button onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>Today</button><button aria-label="Next month" onClick={()=>move(1)}>→</button></div></div>
   <div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span className="calendar-weekday" key={d}>{d}</span>)}
    {Array.from({length:first.getDay()},(_,i)=><span aria-hidden="true" key={'blank'+i}/>)}
    {Array.from({length},(_,i)=>{const day=key(new Date(year,number-1,i+1)),items=byDay.get(day)||[];return <button key={day} className={'calendar-day'+(day===today?' calendar-today':'')} aria-pressed={selected===day} aria-label={`${label(day)}, ${items.length} appointments`} onClick={()=>setSelected(day)}><span className="calendar-date-number">{i+1}</span>{items.length>0&&<><small>{items.length}<span className="calendar-count-label"> booked</span></small><span className="calendar-attendee">{items[0].attendee}</span></>}</button>;})}
   </div>
  </div><aside className="calendar-agenda" aria-label="Selected day agenda"><p className="calendar-eyebrow">YOUR DAY AT A GLANCE</p><h3>{label(selected)}</h3><p className="calendar-zone">Times in {zone}</p>{availability&&<section aria-label="Scheduled working hours" className="calendar-working"><h4>Scheduled working hours</h4><p>Pattern preview, not free slots. Booking checks conflicts, buffers, notice, limits and connected calendars.</p>{working.length?working.map(r=><article key={r.id}><strong>{r.title}</strong><p>{minutes(r.start_minute)} - {minutes(r.end_minute)} in {r.timezone}</p><a href={managementPath+'#availability-rule-'+r.id}>Manage hours for {r.title}</a></article>):<p>No active working-hour pattern on this date in {zone}.</p>}{otherZones.length>0&&<div><p>Other schedules use these timezones:</p>{otherZones.map(z=><button key={z} type="button" onClick={()=>setZone(z)}>View hours in {z}</button>)}</div>}</section>}<h4>Saved appointments</h4><div aria-live="polite">{agenda.length===0?<div className="calendar-empty"><strong>A little breathing room.</strong><p>{search?'No matching appointments on this day.':'No appointments on this day.'}</p><a href={managementPath+"#new-booking"}>Plan an appointment →</a></div>:agenda.map(b=><article key={b.id}><p className="calendar-time">{clock(b.starts_at)} – {clock(b.ends_at)}{calendarDate(b.ends_at,zone)!==selected?' (+ next day)':''}</p><h4>{b.attendee}</h4><p className="calendar-status">{b.status==='confirmed'?'Confirmed':'Canceled'}</p><a href={managementPath+'#booking-'+b.id}>View booking details →</a></article>)}</div></aside></div>
  <p className="calendar-footnote">Saved MFH bookings only; external calendar events are not shown here. Text reminders are not enabled.</p>
 </section>;
}
