'use client';
import { useEffect, useRef, useState } from 'react';
import { SchedulingData, IntakeField, WeeklyRecurrence, validId, weeklyRecurrence, availabilityMatches, localInstants, slotLabel } from '../../lib/workspaceScheduling';
import TimezoneSelect from '../../components/TimezoneSelect';
import SchedulingCalendar,{calendarDate} from '../../components/SchedulingCalendar';
import AvailabilityRecurrenceFields from '../../components/AvailabilityRecurrenceFields';
import WorkspaceNav from '../../components/WorkspaceNav';
import AppointmentDatePicker from '../../components/AppointmentDatePicker';
import '../../components/workspace-editorial.css';
import './scheduling-sections.css';
const control='min-w-0 max-w-full w-full rounded border border-slate-400 p-2 text-slate-950 bg-white';
const button='primary-action';
const section='editorial-card space-y-4';
const presets:Record<string,number[]>={duration:[15,30,45,60,90,120,180,240],buffer:[0,5,10,15,30,60,120],noticeHours:[0,1,2,4,12,24,48,72,168],horizonDays:[7,14,30,60,90,180],dailyCap:[1,2,3,4,5,6,8,10,12,20,50]};
const sections=[{id:'availability',label:'1. Availability'},{id:'intake',label:'2. Intake questions'},{id:'appointments',label:'3. Add appointment'}] as const;
type SectionId=typeof sections[number]['id'];
type BookingJob={day:string;payload:Record<string,unknown>;uncertain?:boolean};
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const time=(m:number)=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const minute=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
export default function Scheduling(){
 const [data,setData]=useState<SchedulingData|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState(''),[busyAction,setBusyAction]=useState('');
 const loadGeneration=useRef(0);
 const [activeSection,setActiveSection]=useState<SectionId>('availability');
 const [dates,setDates]=useState<string[]>([]),[dateSlots,setDateSlots]=useState<Record<string,string[]>>({}),[chosenSlots,setChosenSlots]=useState<Record<string,string>>({});
 const batch=useRef<{jobs:BookingJob[];next:number}|null>(null);
 const [batchPending,setBatchPending]=useState(false);
 function showSection(id:SectionId){setActiveSection(id);if(window.location.hash)window.history.replaceState(null,'',window.location.pathname+window.location.search);}
 function resetTimes(){setDateSlots({});setChosenSlots({});}
 function changeDates(value:string[]){setDates(value);resetTimes();draftChanged();}
 const actor=useRef(''), pending=useRef<{key:string;id:string;body:Record<string,unknown>}|null>(null);
 const [rule,setRule]=useState({title:'Consultation',timezone:'America/New_York',weekday:1,startMinute:540,endMinute:1020,duration:30,buffer:0,noticeHours:24,horizonDays:60,dailyCap:8});
 const [recurrence,setRecurrence]=useState<WeeklyRecurrence>({weekdays:[1],intervalWeeks:1,startDate:'',endDate:null,excludedDates:[]}),[hostToday,setHostToday]=useState('');
 useEffect(()=>{const day=calendarDate(new Date().toISOString(),rule.timezone);setHostToday(day);setRecurrence(previous=>previous.startDate?previous:{...previous,startDate:day});},[rule.timezone]);
 const [title,setTitle]=useState('Consultation intake'),[consent,setConsent]=useState('These answers are stored privately in the owner’s MFH workspace. No reminders or calendar invitations are sent.'),[fields,setFields]=useState<IntakeField[]>([{id:'q1',label:'What would you like to discuss?',required:true}]);
 const [ruleId,setRuleId]=useState(''),[intakeId,setIntakeId]=useState(''),[at,setAt]=useState('09:00'),[attendee,setAttendee]=useState(''),[answers,setAnswers]=useState<Record<string,string>>({}),[consented,setConsented]=useState(false);
 const activeRule=data?.availability.find(r=>r.id===ruleId),intake=data?.intakes.find(i=>i.id===intakeId);
 async function refresh(){
  const generation=++loadGeneration.current;
  try{
  const hash=window.location.hash;
  const kind=hash.startsWith('#availability-rule-')?'availabilityId':hash.startsWith('#booking-')?'bookingId':null;
  const id=kind?hash.slice(kind==='availabilityId'?19:9):'';
  if(kind&&!validId(id)){setData(null);throw Error('This scheduling record link is invalid. Open scheduling without the record link.');}
  const query=kind?'?'+kind+'='+encodeURIComponent(id):'';
  const res=await fetch('/api/workspace-scheduling'+query,{cache:'no-store'});const body=await res.json();if(generation!==loadGeneration.current)return;if(!res.ok){setData(null);throw Error(body.error||'Unable to load.');}
  if(actor.current&&actor.current!==body.actorId){setData(null);throw Error('Account changed. Your draft remains here. Sign back into the original account or reload to discard it.');}
  actor.current=body.actorId;setData(body);
  }catch(e){if(generation!==loadGeneration.current)return;setData(null);throw e;}
 }
 useEffect(()=>{const load=()=>{const hash=window.location.hash;if(hash.startsWith('#availability'))setActiveSection('availability');else if(hash==='#intake')setActiveSection('intake');else if(hash==='#new-booking'||hash.startsWith('#booking-'))setActiveSection('appointments');setError('');void refresh().catch(e=>setError(e.message));};load();window.addEventListener('hashchange',load);return ()=>{window.removeEventListener('hashchange',load);loadGeneration.current++;};},[]);
 useEffect(()=>{if(data&&window.location.hash){const target=document.getElementById(window.location.hash.slice(1));target?.scrollIntoView({block:'start'});}},[data]);
 async function mutate(body:Record<string,unknown>){
  if(busy||!data)return;if(batch.current){setError('Finish retrying your appointment dates before making another change.');return;}setBusy(true);setBusyAction(String(body.action));setError('');setStatus('');
  const payload={...body,expectedActorId:actor.current};const key=JSON.stringify(payload);
  if(pending.current&&pending.current.key!==key){setError('The previous result is unknown. Retry the unchanged action before making a different change.');setBusy(false);return;}
  if(!pending.current)pending.current={key,id:crypto.randomUUID(),body};
  let confirmed=false;const saved=body.action==='availability'?'Availability saved: '+String(body.title):body.action==='publish'?'Intake questions saved: '+String(body.title):body.action==='book'?'Booking saved: '+String(body.attendee):body.action==='cancel'?'Booking canceled.':body.active?'Availability enabled.':'Availability disabled.';
  try{
   const res=await fetch('/api/workspace-scheduling',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,operationId:pending.current.id})});const result=await res.json();
   if(!res.ok){if(res.status<500)pending.current=null;throw Error(result.error||'Unable to save.');}
   if(!result.record?.id)throw Error('Save outcome is unconfirmed. Retry the unchanged action; your draft is preserved.');
   pending.current=null;confirmed=true;await refresh();setStatus(saved+' No email, reminder, or calendar invitation was sent.');
  }catch(e){if(confirmed){setStatus(saved+' The list could not refresh. Use Refresh records, not Save again.');}else setError(e instanceof Error?e.message:'Connection failed. Retry the unchanged action; your draft is preserved.');}finally{setBusy(false);}
 }
 function draftChanged(){if(!busy&&!pending.current&&!batch.current){setStatus('');setError('');}}
 function findSlots(){setError('');resetTimes();if(!activeRule||!dates.length)return;
  try{const m=minute(at),choices:Record<string,string[]>={},chosen:Record<string,string>={};
   for(const day of dates){if(!availabilityMatches(activeRule.weekday,activeRule.recurrence,day)||m<activeRule.start_minute||m+activeRule.duration>activeRule.end_minute||(m-activeRule.start_minute)%activeRule.duration!==0)throw Error(day+': Choose a date in this schedule and a duration-aligned start within its window.');
    const instants=localInstants(day,m,activeRule.timezone);if(!instants.length)throw Error(day+': This local time does not exist (daylight-saving gap), or the date is invalid. Choose another time.');choices[day]=instants;if(instants.length===1)chosen[day]=instants[0];
   }setDateSlots(choices);setChosenSlots(chosen);
  }catch(e){setError((e as Error).message);}
 }
 async function bookAppointments(){
  if(busy||!data)return;
  if(pending.current){setError('Retry the previous unchanged operation before saving appointments.');return;}
  if(!batch.current){if(!activeRule||!dates.length||dates.some(day=>!chosenSlots[day])||!intake)return;batch.current={next:0,jobs:dates.map(day=>({day,payload:{action:'book',availabilityId:activeRule.id,expectedVersion:activeRule.version,intakeId,startsAt:chosenSlots[day],attendee,answers,consented,expectedActorId:actor.current,operationId:crypto.randomUUID()}}))};}
  const plan=batch.current;setBatchPending(true);setBusy(true);setBusyAction('book');setError('');setStatus('');
  let failure='',uncertain=true;
  try{
   while(plan.next<plan.jobs.length){const job=plan.jobs[plan.next];
    const response=await fetch('/api/workspace-scheduling',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(job.payload)});
    // A malformed or lost response does not establish failure: retain this exact operation ID.
    const result=await response.json();
    if(!response.ok){uncertain=!!job.uncertain||response.status>=500;throw Error(job.day+': '+(result.error||'Unable to save appointment.'));}
    if(!result.record?.id){uncertain=true;throw Error(job.day+': Save outcome is unconfirmed.');}
    plan.next++;setDates(plan.jobs.slice(plan.next).map(item=>item.day));
   }
  }catch(e){failure=e instanceof Error?e.message:'Connection failed.';}
  const count=plan.next,remaining=plan.jobs.length-count;
  if(failure){
   if(uncertain){plan.jobs[plan.next].uncertain=true;setError(failure+' '+count+' saved, '+remaining+' remaining. Use Retry remaining appointments; do not reload this page. The unchanged request will reuse its operation ID.');}
   else{batch.current=null;setBatchPending(false);resetTimes();setError(failure+' '+count+' saved, '+remaining+' remaining. Saved dates were removed. Review the remaining dates and check their times before trying again.');}
  }else{batch.current=null;setBatchPending(false);resetTimes();setStatus(count+' appointment'+(count===1?'':'s')+' saved. No email, reminder, or calendar invitation was sent.');}
  try{await refresh();}catch(e){if(!failure)setStatus(count+' appointments saved. The list could not refresh. Use Refresh records, not Save again.');else setError(previous=>previous+' The list could not refresh.');}
  setBusy(false);
 }
 function saveAvailability(){try{const checked=weeklyRecurrence(recurrence);void mutate({action:'availability',...rule,weekday:checked.weekdays[0],recurrence:checked});}catch(e){setError((e as Error).message);}}
 const pattern=(r:{weekday:number;recurrence?:WeeklyRecurrence|null})=>r.recurrence?r.recurrence.weekdays.map(day=>days[day]).join(', ')+' · '+(r.recurrence.intervalWeeks===2?'every other week':'every week')+' · from '+r.recurrence.startDate+(r.recurrence.endDate?' through '+r.recurrence.endDate:'')+' · '+r.recurrence.excludedDates.length+' days off':'Every '+days[r.weekday];
 const disabled=busy||!data||batchPending;
 return <div className="editorial-shell"><WorkspaceNav active="scheduling"/><div className="editorial-main scheduling-page">
 <header className="editorial-header"><div><p className="editorial-eyebrow">YOUR WORKSPACE / SCHEDULING</p><h1>Your calendar, your way.</h1></div><nav aria-label="Scheduling views"><a href="/workspace/scheduling/calendar">Calendar only</a><a href="/workspace/scheduling/time-off">Time off</a><a href="/workspace/scheduling/public">Customer booking link</a></nav></header>
 <div className="scheduling-tabs" role="tablist" aria-label="Scheduling sections">{sections.map((item,index)=><button key={item.id} id={'tab-'+item.id} role="tab" type="button" aria-selected={activeSection===item.id} aria-controls={'panel-'+item.id} tabIndex={activeSection===item.id?0:-1} onClick={()=>showSection(item.id)} onKeyDown={e=>{let next=index;if(e.key==='ArrowRight')next=(index+1)%sections.length;else if(e.key==='ArrowLeft')next=(index+sections.length-1)%sections.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=sections.length-1;else return;e.preventDefault();showSection(sections[next].id);document.getElementById('tab-'+sections[next].id)?.focus();}}>{item.label}</button>)}</div>
 {data&&<SchedulingCalendar bookings={data.bookings} availability={data.availability} compactControls/>}
 <div className="scheduling-tools"><details><summary>How scheduling works</summary><p>Set working hours, prepare intake questions, then add private appointments. No emails or invitations are sent. Connected calendars require fresh synchronized availability.</p><p>To change hours or timezone, disable the old rule and create a replacement. Existing booking times stay unchanged. Saved intake versions keep their original questions.</p></details><button disabled={busy} onClick={()=>{setStatus('');void refresh().then(()=>{setError('');setStatus('Records refreshed. Your draft is unchanged.');}).catch(e=>setError(e.message));}}>Refresh records (keep draft)</button></div>
  {error&&<p role="alert" className="sticky top-4 z-30 rounded border border-red-700 bg-red-50 p-3 shadow">{error}</p>}
  {(busy||status)&&<p role="status" className="sticky top-4 z-20 rounded border border-green-700 bg-green-50 p-3 shadow">{busy?'Saving your change... Please wait.':status}</p>}
  {pending.current&&<button className={button} disabled={disabled} onClick={()=>pending.current&&void mutate(pending.current.body)}>Retry same operation</button>}
  {!data&&!error&&<p role="status">Loading private scheduling records…</p>}
  {data?.truncated&&<p role="alert">Showing up to 500 recent records per section, plus any specifically linked record. Other older records may be omitted. This bounded view is not a complete export.</p>}
  <div id="panel-availability" role="tabpanel" aria-labelledby="tab-availability" hidden={activeSection!=='availability'} className="scheduling-panel">
   <form id="availability" onChange={draftChanged} className={section} onSubmit={e=>{e.preventDefault();saveAvailability();}}>
    <h2 className="text-xl font-semibold">1. Create availability</h2>
    <label className="block">Event title<input className={control} required maxLength={100} value={rule.title} onChange={e=>setRule({...rule,title:e.target.value})}/></label>
    <TimezoneSelect label="Host timezone" className={control} value={rule.timezone} onChange={timezone=>setRule({...rule,timezone})}/>
    <p className="text-sm">Hours use the selected timezone, including its daylight-saving changes. Existing bookings keep their original times.</p>
    <AvailabilityRecurrenceFields value={recurrence} onChange={value=>{setRecurrence(value);draftChanged();}} timezone={rule.timezone} today={hostToday} disabled={disabled}/>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{(['startMinute','endMinute'] as const).map(k=><label key={k}>{k==='startMinute'?'Window starts':'Window ends'}<input className={control} type="time" required value={time(rule[k])} onChange={e=>setRule({...rule,[k]:minute(e.target.value)})}/></label>)}</div>
    {([['duration','Duration (minutes)',15,240],['buffer','Buffer before & after (minutes)',0,120],['noticeHours','Minimum notice (hours)',0,720],['horizonDays','Book up to (days ahead)',1,180],['dailyCap','Maximum bookings per day',1,50]] as const).map(([k,label,min,max])=><label className="block" key={k}>{label}<select className={control} value={rule[k]} onChange={e=>setRule({...rule,[k]:Number(e.target.value)})}>{Array.from({length:max-min+1},(_,i)=>i+min).filter(n=>presets[k].includes(n)).map(n=><option key={n} value={n}>{n===0?(k==='buffer'?'No buffer':'No minimum notice'):`${n} ${k==='noticeHours'?'hours':k==='horizonDays'?'days':k==='dailyCap'?'bookings':'minutes'}`}</option>)}</select></label>)}
    <button className={button} disabled={disabled}>{busy&&busyAction==='availability'?'Saving availability...':'Create availability'}</button>
   </form>
  <section id="availability-rules" className={section}><h2 className="text-xl font-semibold">Availability rules</h2>{data?.availability.length===0&&<p>No rules yet.</p>}{data?.availability.map(r=><div id={"availability-rule-"+r.id} key={r.id} className="border-b py-3 space-y-2"><p className="break-words"><strong>{r.title}</strong> · {pattern(r)} {time(r.start_minute)}–{time(r.end_minute)} · {r.timezone} · {r.duration} min · {r.buffer} min buffer · {r.notice_hours}h notice · {r.horizon_days}d horizon · cap {r.daily_cap} · {r.active?'Active':'Disabled'}</p><button className={button} disabled={disabled} onClick={()=>mutate({action:'toggle',id:r.id,expectedVersion:r.version,active:!r.active})}>{r.active?'Disable':'Enable'} {r.title}</button></div>)}</section>
  </div>
  <div id="panel-intake" role="tabpanel" aria-labelledby="tab-intake" hidden={activeSection!=='intake'} className="scheduling-panel">
   <form id="intake" onChange={draftChanged} className={section} onSubmit={e=>{e.preventDefault();mutate({action:'publish',title,consent,fields});}}>
    <h2 className="text-xl font-semibold">2. Prepare intake questions</h2>
    <p>Add up to eight text questions. Saving a version keeps its questions unchanged for existing bookings. Answers remain private.</p>
    <label className="block">Intake title<input className={control} required maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="block">Privacy / consent text<textarea className={control} required maxLength={2000} value={consent} onChange={e=>setConsent(e.target.value)}/></label>
    {fields.map((f,index)=><fieldset key={f.id} className="border p-3 space-y-2"><legend>Question {index+1}</legend><label className="block">Question text<input className={control} required maxLength={160} value={f.label} onChange={e=>setFields(fields.map((v,i)=>i===index?{...v,label:e.target.value}:v))}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={f.required} onChange={e=>setFields(fields.map((v,i)=>i===index?{...v,required:e.target.checked}:v))}/>Required answer</label></fieldset>)}
    <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={fields.length>=8} onClick={()=>setFields([...fields,{id:'q'+(fields.length+1),label:'',required:false}])}>Add question</button>{fields.length>1&&<button type="button" className={button} onClick={()=>setFields(fields.slice(0,-1))}>Remove last question</button>}<button className={button} disabled={disabled}>{busy&&busyAction==='publish'?'Saving intake...':'Save intake version'}</button></div>
   </form>
  </div>
  <div id="panel-appointments" role="tabpanel" aria-labelledby="tab-appointments" hidden={activeSection!=='appointments'} className="scheduling-panel">
  <form id="new-booking" onChange={draftChanged} className={section} onSubmit={e=>{e.preventDefault();void bookAppointments();}}>
   <h2 className="text-xl font-semibold">3. Add appointment</h2>
   <p>Choose one or more dates for the same attendee and start time. Each date is saved separately; if a date fails, confirmed appointments stay saved.</p>
   <fieldset disabled={disabled} className="space-y-4"><legend className="sr-only">Appointment details</legend>
   <label className="block">Availability<select className={control} required value={ruleId} onChange={e=>{setRuleId(e.target.value);setDates([]);resetTimes();}}><option value="">{data?.availability.some(r=>r.active)?'Choose availability':'Create availability above first'}</option>{data?.availability.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.title} · {pattern(r)} · {r.timezone}</option>)}</select></label>
   <label className="block">Published intake<select className={control} required value={intakeId} onChange={e=>{setIntakeId(e.target.value);setAnswers({});setConsented(false);}}><option value="">{data?.intakes.length?'Choose intake questions':'Save intake questions above first'}</option>{data?.intakes.map(i=><option key={i.id} value={i.id}>{i.title} · version {i.version}</option>)}</select></label>
   <label className="block">Attendee label (private)<input className={control} required maxLength={160} value={attendee} onChange={e=>setAttendee(e.target.value)}/></label>
   {intake&&<fieldset className="space-y-3"><legend>Intake version {intake.version} · {intake.title}</legend>{intake.fields.map(f=><label className="block" key={f.id}>{f.label}{f.required?' (required)':''}<textarea className={control} required={f.required} maxLength={2000} value={answers[f.id]||''} onChange={e=>setAnswers({...answers,[f.id]:e.target.value})}/></label>)}<p className="whitespace-pre-wrap break-words">{intake.consent}</p><label className="flex gap-2 items-start"><input type="checkbox" required checked={consented} onChange={e=>setConsented(e.target.checked)}/>I reviewed this privacy text with the attendee and have permission to record these answers.</label></fieldset>}
   <AppointmentDatePicker value={dates} availability={activeRule} disabled={disabled} onChange={changeDates}/>
   <label className="block">Host local start time<input className={control} type="time" required value={at} onChange={e=>{setAt(e.target.value);resetTimes();}}/></label>
   <button type="button" className={button} disabled={!activeRule||!dates.length} onClick={findSlots}>Check selected times</button>
   {activeRule&&dates.filter(day=>dateSlots[day]).map(day=><fieldset key={day} className="space-y-3"><legend>{day}: review the time{dateSlots[day].length>1?' - choose which daylight-saving occurrence':''}</legend>{dateSlots[day].map(instant=><label key={instant} className="flex items-start gap-2 border p-3 break-words"><input type="radio" name={'slot-'+day} required checked={chosenSlots[day]===instant} onChange={()=>setChosenSlots({...chosenSlots,[day]:instant})}/><span>{slotLabel(instant,activeRule!.timezone)}<br/>Your browser timezone: {slotLabel(instant,Intl.DateTimeFormat().resolvedOptions().timeZone)}</span></label>)}</fieldset>)}
   <p>We check your hours, buffer, notice and other MFH bookings before saving. Bookings crossing a daylight-saving clock change are not accepted.</p>
   <button className={button} disabled={disabled||!dates.length||dates.some(day=>!chosenSlots[day])||!intake}>{busy&&busyAction==='book'?'Saving appointments...':dates.length>1?'Confirm '+dates.length+' appointments':'Confirm appointment'}</button>
   </fieldset>
   {batchPending&&<button type="button" className={button} disabled={busy||!data} onClick={()=>void bookAppointments()}>Retry remaining appointments</button>}
  </form>
  <section className={section}><h2 className="text-xl font-semibold">Private bookings &amp; submissions</h2>{data?.bookings.length===0&&<p>No bookings yet.</p>}{data?.bookings.map(b=><article id={"booking-"+b.id} key={b.id} className="border-b py-4 space-y-3 break-words"><h3 className="font-semibold">{b.attendee} · {b.status}</h3><p>{slotLabel(b.starts_at,b.timezone)} – {slotLabel(b.ends_at,b.timezone)}</p><details><summary className="cursor-pointer">Owner-only intake answers</summary><p>Published intake ID: {b.intake_id}</p>{Object.entries(b.answers).map(([k,v])=><p className="whitespace-pre-wrap" key={k}><strong>{data.intakes.find(i=>i.id===b.intake_id)?.fields.find(f=>f.id===k)?.label||k}:</strong> {v}</p>)}</details>{b.status==='confirmed'&&<button className={button} disabled={disabled} onClick={()=>mutate({action:'cancel',id:b.id,expectedVersion:b.version})}>Cancel booking for {b.attendee}</button>}</article>)}</section>
 </div>
 </div></div>;
}
