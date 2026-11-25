'use client';
import {useEffect,useRef,useState} from 'react';
import {Availability,availabilityMatches} from '../lib/workspaceScheduling';
import {calendarDate} from './SchedulingCalendar';

const dateKey=(date:Date)=>date.toISOString().slice(0,10);
const label=(day:string)=>new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'});

/** Dates stay in the host timezone; browser timezone never shifts a selected day. */
export default function AppointmentDatePicker({value,onChange,availability,disabled}:{value:string[];onChange:(dates:string[])=>void;availability?:Availability;disabled?:boolean}){
 const [open,setOpen]=useState(false),[month,setMonth]=useState(''),[focused,setFocused]=useState('');
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),previousZone=useRef('');
 useEffect(()=>{const zone=availability?.timezone;if(!zone||previousZone.current===zone)return;previousZone.current=zone;const today=calendarDate(new Date().toISOString(),zone);setMonth(today.slice(0,7));setFocused(today);},[availability?.timezone]);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
 useEffect(()=>{if(open&&focused)root.current?.querySelector<HTMLButtonElement>('[data-date="'+focused+'"]')?.focus();},[open,month,focused]);
 const [year,number]=month.split('-').map(Number),first=new Date(Date.UTC(year,number-1,1)),length=new Date(Date.UTC(year,number,0)).getUTCDate();
 function moveMonth(offset:number){const next=new Date(Date.UTC(year,number-1+offset,1));setMonth(dateKey(next).slice(0,7));setFocused(dateKey(next));}
 function toggle(day:string){onChange(value.includes(day)?value.filter(d=>d!==day):[...value,day].sort());}
 return <div className="appointment-date-picker" ref={root} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);trigger.current?.focus();}}} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}>
  <span id="appointment-date-label">Appointment dates</span>
  <button ref={trigger} type="button" aria-labelledby="appointment-date-label appointment-date-value" aria-haspopup="dialog" aria-expanded={open} aria-controls="appointment-date-popup" disabled={disabled||!availability||!month} onClick={()=>setOpen(!open)}><span id="appointment-date-value">{value.length===0?'Choose a day or days':value.length===1?label(value[0]):value.length+' days selected'}</span><span aria-hidden="true">▾</span></button>
  {open&&<div id="appointment-date-popup" role="dialog" aria-label="Choose appointment dates" className="appointment-date-popup">
   <div className="appointment-picker-toolbar"><button type="button" aria-label="Previous appointment month" disabled={month<='1900-01'} onClick={()=>moveMonth(-1)}>←</button><strong aria-live="polite">{first.toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'})}</strong><button type="button" aria-label="Next appointment month" disabled={month>='2199-12'} onClick={()=>moveMonth(1)}>→</button></div>
   <p>Choose up to 31 dates in {availability?.timezone}. Shaded days are outside this working-hour pattern. Availability is checked when saving.</p>
   <div className="appointment-picker-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day} aria-hidden="true">{day}</span>)}{Array.from({length:first.getUTCDay()},(_,i)=><span key={'blank'+i}/>)}{Array.from({length},(_,i)=>{const day=dateKey(new Date(Date.UTC(year,number-1,i+1))),available=!!availability&&availabilityMatches(availability.weekday,availability.recurrence,day),selected=value.includes(day);return <button key={day} type="button" data-date={day} tabIndex={focused===day?0:-1} aria-label={label(day)+(available?'':', outside working hours')} aria-pressed={selected} aria-disabled={!available||!selected&&value.length>=31} onFocus={()=>setFocused(day)} onClick={()=>{if(available&&(selected||value.length<31))toggle(day);}} onKeyDown={e=>{const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-new Date(day+'T12:00:00Z').getUTCDay(),End:6-new Date(day+'T12:00:00Z').getUTCDay()};if(e.key in offsets){e.preventDefault();const next=dateKey(new Date(Date.parse(day+'T12:00:00Z')+offsets[e.key]*86400000));if(next<'1900-01-01'||next>'2199-12-31')return;setMonth(next.slice(0,7));setFocused(next);}else if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();moveMonth(e.key==='PageUp'?-1:1);}}}>{i+1}</button>;})}</div>
   <div className="appointment-picker-actions"><span aria-live="polite">{value.length} selected</span><button type="button" aria-disabled={!value.length} onClick={()=>{if(value.length)onChange([]);}}>Clear dates</button><button type="button" onClick={()=>{setOpen(false);trigger.current?.focus();}}>Done</button></div>
  </div>}
  {value.length>0&&<ul className="appointment-selected-dates" aria-label="Selected appointment dates">{value.map(day=><li key={day}><span>{label(day)}</span><button type="button" disabled={disabled} aria-label={'Remove '+label(day)} onClick={()=>toggle(day)}>×</button></li>)}</ul>}
 </div>;
}
