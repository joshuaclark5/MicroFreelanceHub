'use client';
import {useEffect,useRef,useState} from 'react';
import SchedulingCalendar from '../../../components/SchedulingCalendar';
import WorkspaceNav from '../../../components/WorkspaceNav';
import {SchedulingData,calendarMonthBounds} from '../../../lib/workspaceScheduling';
import '../../../components/workspace-editorial.css';
export default function CalendarPage(){
 const [data,setData]=useState<SchedulingData|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const [month,setMonth]=useState('');
 const actor=useRef(''),generation=useRef(0);
 async function refresh(){
  if(!month)return;const request=++generation.current;
  setBusy(true);setError('');setData(null);
  try{
   const response=await fetch('/api/workspace-scheduling?calendarMonth='+encodeURIComponent(month),{cache:'no-store'}),body=await response.json();
   if(request!==generation.current)return;
   if(!response.ok)throw Error(body.error||'Unable to load your calendar.');
   if(actor.current&&body.actorId!==actor.current)throw Error('Account changed. Reload this page to view the new account.');
   actor.current=body.actorId;
   if(body.calendarMonth!==month)throw Error('Calendar month did not match. Please refresh.');
   if(body.truncated)throw Error('There are too many bookings or active schedules to show this month completely (500-record limit). Choose another month or open scheduling management.');
   setData(body);
  }catch(e){if(request!==generation.current)return;setError(e instanceof Error?e.message:'Unable to load your calendar. Please retry.');}finally{if(request===generation.current)setBusy(false);}
 }
 useEffect(()=>{const now=new Date();setMonth(String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0'));},[]);
 useEffect(()=>{void refresh();return ()=>{generation.current++;};},[month]);
 function changeMonth(value:string){try{calendarMonthBounds(value);}catch(e){setError((e as Error).message);return;}if(value===month){void refresh();return;}setBusy(true);setError('');setData(null);generation.current++;setMonth(value);}
 return <div className="editorial-shell"><WorkspaceNav active="scheduling"/><main className="editorial-main">
  <header className="editorial-header"><div><p className="editorial-eyebrow">YOUR WORKSPACE / CALENDAR</p><h1>Your day, in one place.</h1><p>Browse saved bookings and scheduled working-hour patterns. Select a day, then open its management controls.</p></div></header>
  <nav aria-label="Calendar actions" className="flex flex-wrap gap-4"><a href="/workspace/scheduling#availability">Set working hours</a><a href="/workspace/scheduling/public">Manage customer booking link</a><a href="/workspace/scheduling">Scheduling management</a></nav>
  <label className="block">View month<input className="block rounded border p-2" type="month" min="1900-01" max="2199-12" value={month} onChange={e=>changeMonth(e.target.value)}/></label>
  <button disabled={busy} onClick={()=>void refresh()}>{busy?'Loading calendar...':'Refresh calendar'}</button>
  {error&&<p role="alert">{error}</p>}
  {busy&&<p role="status">Loading private calendar records...</p>}
  <div hidden={busy||!!error||!data}><SchedulingCalendar bookings={data?.bookings||[]} availability={data?.availability||[]} managementPath="/workspace/scheduling" displayMonth={month} onMonthChange={changeMonth}/></div>
 </main></div>;
}
