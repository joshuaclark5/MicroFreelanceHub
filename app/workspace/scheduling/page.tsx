'use client';
import { useEffect, useRef, useState } from 'react';
import { SchedulingData, IntakeField, WeeklyRecurrence, validId, weeklyRecurrence, availabilityMatches, localInstants, slotLabel } from '../../lib/workspaceScheduling';
import TimezoneSelect from '../../components/TimezoneSelect';
import SchedulingCalendar,{calendarDate} from '../../components/SchedulingCalendar';
import AvailabilityRecurrenceFields from '../../components/AvailabilityRecurrenceFields';
import WorkspaceNav from '../../components/WorkspaceNav';
import '../../components/workspace-editorial.css';
const control='min-w-0 max-w-full w-full rounded border border-slate-400 p-2 text-slate-950 bg-white';
const button='primary-action';
const section='editorial-card space-y-4';
const presets:Record<string,number[]>={duration:[15,30,45,60,90,120,180,240],buffer:[0,5,10,15,30,60,120],noticeHours:[0,1,2,4,12,24,48,72,168],horizonDays:[7,14,30,60,90,180],dailyCap:[1,2,3,4,5,6,8,10,12,20,50]};
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const time=(m:number)=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const minute=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
export default function Scheduling(){
 const [data,setData]=useState<SchedulingData|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState(''),[busyAction,setBusyAction]=useState('');
 const loadGeneration=useRef(0);
 const actor=useRef(''), pending=useRef<{key:string;id:string;body:Record<string,unknown>}|null>(null);
 const [rule,setRule]=useState({title:'Consultation',timezone:'America/New_York',weekday:1,startMinute:540,endMinute:1020,duration:30,buffer:0,noticeHours:24,horizonDays:60,dailyCap:8});
 const [recurrence,setRecurrence]=useState<WeeklyRecurrence>({weekdays:[1],intervalWeeks:1,startDate:'',endDate:null,excludedDates:[]}),[hostToday,setHostToday]=useState('');
 useEffect(()=>{const day=calendarDate(new Date().toISOString(),rule.timezone);setHostToday(day);setRecurrence(previous=>previous.startDate?previous:{...previous,startDate:day});},[rule.timezone]);
 const [title,setTitle]=useState('Consultation intake'),[consent,setConsent]=useState('These answers are stored privately in the owner’s MFH workspace. No reminders or calendar invitations are sent.'),[fields,setFields]=useState<IntakeField[]>([{id:'q1',label:'What would you like to discuss?',required:true}]);
 const [ruleId,setRuleId]=useState(''),[intakeId,setIntakeId]=useState(''),[date,setDate]=useState(''),[at,setAt]=useState('09:00'),[slots,setSlots]=useState<string[]>([]),[selected,setSelected]=useState(''),[attendee,setAttendee]=useState(''),[answers,setAnswers]=useState<Record<string,string>>({}),[consented,setConsented]=useState(false);
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
 useEffect(()=>{const load=()=>{setError('');void refresh().catch(e=>setError(e.message));};load();window.addEventListener('hashchange',load);return ()=>{window.removeEventListener('hashchange',load);loadGeneration.current++;};},[]);
 useEffect(()=>{if(data&&window.location.hash){const target=document.getElementById(window.location.hash.slice(1));target?.scrollIntoView({block:'start'});}},[data]);
 async function mutate(body:Record<string,unknown>){
  if(busy||!data)return;setBusy(true);setBusyAction(String(body.action));setError('');setStatus('');
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
 function draftChanged(){if(!busy&&!pending.current){setStatus('');setError('');}}
 function findSlots(){setError('');setSelected('');if(!activeRule)return;
  try{const m=minute(at);if(!availabilityMatches(activeRule.weekday,activeRule.recurrence,date)||m<activeRule.start_minute||m+activeRule.duration>activeRule.end_minute||(m-activeRule.start_minute)%activeRule.duration!==0)throw Error('Choose a date in this schedule and a duration-aligned start within its window.');
   const choices=localInstants(date,m,activeRule.timezone);setSlots(choices);if(!choices.length)throw Error('This local time does not exist (daylight-saving gap), or the date is invalid. Choose another time.');if(choices.length===1)setSelected(choices[0]);
  }catch(e){setSlots([]);setError((e as Error).message);}
 }
 function saveAvailability(){try{const checked=weeklyRecurrence(recurrence);void mutate({action:'availability',...rule,weekday:checked.weekdays[0],recurrence:checked});}catch(e){setError((e as Error).message);}}
 const pattern=(r:{weekday:number;recurrence?:WeeklyRecurrence|null})=>r.recurrence?r.recurrence.weekdays.map(day=>days[day]).join(', ')+' · '+(r.recurrence.intervalWeeks===2?'every other week':'every week')+' · from '+r.recurrence.startDate+(r.recurrence.endDate?' through '+r.recurrence.endDate:'')+' · '+r.recurrence.excludedDates.length+' days off':'Every '+days[r.weekday];
 const disabled=busy||!data;
 return <div className="editorial-shell"><WorkspaceNav active="scheduling"/><div className="editorial-main">
 <header className="editorial-header"><div><p className="editorial-eyebrow">YOUR WORKSPACE / SCHEDULING</p><h1>A calmer calendar.<br/><em>A clearer day.</em></h1><p>Set your hours, prepare your questions and keep private booking records in one place.</p></div><a className="primary-action" href="#availability">Set your availability ↗︎</a></header>
 <p className="quiet-note">No emails or invitations are sent. Connected calendars require fresh synchronized availability. <a href="/workspace/scheduling/public">Configure an opt-in public booking link →</a></p>
 <nav aria-label="Scheduling views" className="flex flex-wrap gap-4"><a href="/workspace/scheduling/calendar">Open calendar-only view</a><a href="/workspace/scheduling/time-off">Time off across all services</a></nav>
 <details><summary>About availability and intake versions</summary><p>Choose multiple weekdays and weekly or alternate-week, same-day windows for 15–240 minute appointments. To change hours or timezone, disable the old rule and create a replacement. Existing booking times stay unchanged. Published question sets are saved versions; create a new version to change them.</p></details>
  {error&&<p role="alert" className="sticky top-4 z-30 rounded border border-red-700 bg-red-50 p-3 shadow">{error}</p>}
  {(busy||status)&&<p role="status" className="sticky top-4 z-20 rounded border border-green-700 bg-green-50 p-3 shadow">{busy?'Saving your change... Please wait.':status}</p>}
  {pending.current&&<button className={button} disabled={disabled} onClick={()=>pending.current&&void mutate(pending.current.body)}>Retry same operation</button>}
  <button disabled={busy} onClick={()=>{setStatus('');void refresh().then(()=>{setError('');setStatus('Records refreshed. Your draft is unchanged.');}).catch(e=>setError(e.message));}}>Refresh records (keep draft)</button>
  {!data&&!error&&<p role="status">Loading private scheduling records…</p>}
  {data?.truncated&&<p role="alert">Showing up to 500 recent records per section, plus any specifically linked record. Other older records may be omitted. This bounded view is not a complete export.</p>}
  {data&&<SchedulingCalendar bookings={data.bookings} availability={data.availability}/>}
  <div className="grid gap-6 lg:grid-cols-2">
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
   <form id="intake" onChange={draftChanged} className={section} onSubmit={e=>{e.preventDefault();mutate({action:'publish',title,consent,fields});}}>
    <h2 className="text-xl font-semibold">2. Prepare intake questions</h2>
    <p>Add up to eight text questions. Saving a version keeps its questions unchanged for existing bookings. Answers remain private.</p>
    <label className="block">Intake title<input className={control} required maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="block">Privacy / consent text<textarea className={control} required maxLength={2000} value={consent} onChange={e=>setConsent(e.target.value)}/></label>
    {fields.map((f,index)=><fieldset key={f.id} className="border p-3 space-y-2"><legend>Question {index+1}</legend><label className="block">Question text<input className={control} required maxLength={160} value={f.label} onChange={e=>setFields(fields.map((v,i)=>i===index?{...v,label:e.target.value}:v))}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={f.required} onChange={e=>setFields(fields.map((v,i)=>i===index?{...v,required:e.target.checked}:v))}/>Required answer</label></fieldset>)}
    <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={fields.length>=8} onClick={()=>setFields([...fields,{id:'q'+(fields.length+1),label:'',required:false}])}>Add question</button>{fields.length>1&&<button type="button" className={button} onClick={()=>setFields(fields.slice(0,-1))}>Remove last question</button>}<button className={button} disabled={disabled}>{busy&&busyAction==='publish'?'Saving intake...':'Save intake version'}</button></div>
   </form>
  </div>
  <section id="availability-rules" className={section}><h2 className="text-xl font-semibold">Availability rules</h2>{data?.availability.length===0&&<p>No rules yet.</p>}{data?.availability.map(r=><div id={"availability-rule-"+r.id} key={r.id} className="border-b py-3 space-y-2"><p className="break-words"><strong>{r.title}</strong> · {pattern(r)} {time(r.start_minute)}–{time(r.end_minute)} · {r.timezone} · {r.duration} min · {r.buffer} min buffer · {r.notice_hours}h notice · {r.horizon_days}d horizon · cap {r.daily_cap} · {r.active?'Active':'Disabled'}</p><button className={button} disabled={disabled} onClick={()=>mutate({action:'toggle',id:r.id,expectedVersion:r.version,active:!r.active})}>{r.active?'Disable':'Enable'} {r.title}</button></div>)}</section>
  <form id="new-booking" onChange={draftChanged} className={section} onSubmit={e=>{e.preventDefault();if(activeRule)mutate({action:'book',availabilityId:activeRule.id,expectedVersion:activeRule.version,intakeId,startsAt:selected,attendee,answers,consented});}}>
   <h2 className="text-xl font-semibold">3. Record a local booking</h2>
   <label className="block">Availability<select className={control} required value={ruleId} onChange={e=>{setRuleId(e.target.value);setSlots([]);setSelected('');}}><option value="">{data?.availability.some(r=>r.active)?'Choose availability':'Create availability above first'}</option>{data?.availability.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.title} · {pattern(r)} · {r.timezone}</option>)}</select></label>
   <label className="block">Published intake<select className={control} required value={intakeId} onChange={e=>{setIntakeId(e.target.value);setAnswers({});setConsented(false);}}><option value="">{data?.intakes.length?'Choose intake questions':'Save intake questions above first'}</option>{data?.intakes.map(i=><option key={i.id} value={i.id}>{i.title} · version {i.version}</option>)}</select></label>
   <label className="block">Attendee label (private)<input className={control} required maxLength={160} value={attendee} onChange={e=>setAttendee(e.target.value)}/></label>
   {intake&&<fieldset className="space-y-3"><legend>Intake version {intake.version} · {intake.title}</legend>{intake.fields.map(f=><label className="block" key={f.id}>{f.label}{f.required?' (required)':''}<textarea className={control} required={f.required} maxLength={2000} value={answers[f.id]||''} onChange={e=>setAnswers({...answers,[f.id]:e.target.value})}/></label>)}<p className="whitespace-pre-wrap break-words">{intake.consent}</p><label className="flex gap-2 items-start"><input type="checkbox" required checked={consented} onChange={e=>setConsented(e.target.checked)}/>I reviewed this privacy text with the attendee and have permission to record these answers.</label></fieldset>}
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label>Host local date<input className={control} type="date" required value={date} onChange={e=>{setDate(e.target.value);setSelected('');setSlots([]);}}/></label><label>Host local start time<input className={control} type="time" required value={at} onChange={e=>{setAt(e.target.value);setSelected('');setSlots([]);}}/></label></div>
   <button type="button" className={button} disabled={!activeRule||!date} onClick={findSlots}>Check this time</button>
   {slots.length>0&&activeRule&&<fieldset className="space-y-3"><legend>Review your time. Repeated daylight-saving times appear separately.</legend>{slots.map(s=><label key={s} className="flex items-start gap-2 border p-3 break-words"><input type="radio" name="slot" required checked={selected===s} onChange={()=>setSelected(s)}/><span>{slotLabel(s,activeRule.timezone)}<br/>UTC: {s}<br/>Your browser timezone: {slotLabel(s,Intl.DateTimeFormat().resolvedOptions().timeZone)}</span></label>)}</fieldset>}
   <p>We check your hours, buffer, notice and other MFH bookings before saving. Bookings crossing a daylight-saving clock change are not accepted.</p>
   <button className={button} disabled={disabled||!selected||!intake}>{busy&&busyAction==='book'?'Saving booking...':'Confirm local booking'}</button>
  </form>
  <section className={section}><h2 className="text-xl font-semibold">Private bookings &amp; submissions</h2>{data?.bookings.length===0&&<p>No bookings yet.</p>}{data?.bookings.map(b=><article id={"booking-"+b.id} key={b.id} className="border-b py-4 space-y-3 break-words"><h3 className="font-semibold">{b.attendee} · {b.status}</h3><p>{slotLabel(b.starts_at,b.timezone)} – {slotLabel(b.ends_at,b.timezone)}</p><details><summary className="cursor-pointer">Owner-only intake answers</summary><p>Published intake ID: {b.intake_id}</p>{Object.entries(b.answers).map(([k,v])=><p className="whitespace-pre-wrap" key={k}><strong>{data.intakes.find(i=>i.id===b.intake_id)?.fields.find(f=>f.id===k)?.label||k}:</strong> {v}</p>)}</details>{b.status==='confirmed'&&<button className={button} disabled={disabled} onClick={()=>mutate({action:'cancel',id:b.id,expectedVersion:b.version})}>Cancel booking for {b.attendee}</button>}</article>)}</section>
 </div></div>;
}
