'use client';
import {useEffect,useRef,useState} from 'react';
import SchedulingCalendar from '../../../components/SchedulingCalendar';
import WorkspaceNav from '../../../components/WorkspaceNav';
import {SchedulingData} from '../../../lib/workspaceScheduling';
import '../../../components/workspace-editorial.css';
export default function CalendarPage(){
 const [data,setData]=useState<SchedulingData|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const actor=useRef('');
 async function refresh(){
  setBusy(true);setError('');setData(null);
  try{
   const response=await fetch('/api/workspace-scheduling',{cache:'no-store'}),body=await response.json();
   if(!response.ok)throw Error(body.error||'Unable to load your calendar.');
   if(actor.current&&body.actorId!==actor.current)throw Error('Account changed. Reload this page to view the new account.');
   actor.current=body.actorId;
   if(body.truncated)throw Error('This account exceeds the current calendar record limit. A complete calendar cannot be shown. Open scheduling management to review its bounded records.');
   setData(body);
  }catch(e){setError(e instanceof Error?e.message:'Unable to load your calendar. Please retry.');}finally{setBusy(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <div className="editorial-shell"><WorkspaceNav active="scheduling"/><main className="editorial-main">
  <header className="editorial-header"><div><p className="editorial-eyebrow">YOUR WORKSPACE / CALENDAR</p><h1>Your day, in one place.</h1><p>Browse saved bookings and scheduled working-hour patterns. Select a day, then open its management controls.</p></div></header>
  <nav aria-label="Calendar actions" className="flex flex-wrap gap-4"><a href="/workspace/scheduling#availability">Set working hours</a><a href="/workspace/scheduling/public">Manage customer booking link</a><a href="/workspace/scheduling">Scheduling management</a></nav>
  <button disabled={busy} onClick={()=>void refresh()}>{busy?'Loading calendar...':'Refresh calendar'}</button>
  {error&&<p role="alert">{error}</p>}
  {busy&&<p role="status">Loading private calendar records...</p>}
  {data&&<SchedulingCalendar bookings={data.bookings} availability={data.availability} managementPath="/workspace/scheduling"/>}
 </main></div>;
}
