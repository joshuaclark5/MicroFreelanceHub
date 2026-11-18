'use client';
import { useEffect, useRef, useState } from 'react';
import { SchedulingData, IntakeField, localInstants, slotLabel } from '../../lib/workspaceScheduling';
const control='w-full rounded border border-slate-400 p-2 text-slate-950 bg-white';
const button='rounded bg-slate-900 px-4 py-3 text-white disabled:opacity-50';
const section='rounded-xl border border-slate-300 bg-white p-4 space-y-4';
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const time=(m:number)=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const minute=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
export default function Scheduling(){
 const [data,setData]=useState<SchedulingData|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 const actor=useRef(''), pending=useRef<{key:string;id:string;body:Record<string,unknown>}|null>(null);
 const [rule,setRule]=useState({title:'Consultation',timezone:'America/New_York',weekday:1,startMinute:540,endMinute:1020,duration:30,buffer:0,noticeHours:24,horizonDays:60,dailyCap:8});
 const [title,setTitle]=useState('Consultation intake'),[consent,setConsent]=useState('These answers are stored privately in the owner’s MFH workspace. No reminders or calendar invitations are sent.'),[fields,setFields]=useState<IntakeField[]>([{id:'q1',label:'What would you like to discuss?',required:true}]);
 const [ruleId,setRuleId]=useState(''),[intakeId,setIntakeId]=useState(''),[date,setDate]=useState(''),[at,setAt]=useState('09:00'),[slots,setSlots]=useState<string[]>([]),[selected,setSelected]=useState(''),[attendee,setAttendee]=useState(''),[answers,setAnswers]=useState<Record<string,string>>({}),[consented,setConsented]=useState(false);
 const activeRule=data?.availability.find(r=>r.id===ruleId),intake=data?.intakes.find(i=>i.id===intakeId);
 async function refresh(){
  const res=await fetch('/api/workspace-scheduling',{cache:'no-store'});const body=await res.json();if(!res.ok)throw Error(body.error||'Unable to load.');
  if(actor.current&&actor.current!==body.actorId){setData(null);throw Error('Account changed. Your draft remains here. Sign back into the original account or reload to discard it.');}
  actor.current=body.actorId;setData(body);
 }
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[]);
 async function mutate(body:Record<string,unknown>){
  if(busy||!data)return;setBusy(true);setError('');setStatus('');
  const payload={...body,expectedActorId:actor.current};const key=JSON.stringify(payload);
  if(pending.current&&pending.current.key!==key){setError('The previous result is unknown. Retry the unchanged action before making a different change.');setBusy(false);return;}
  if(!pending.current)pending.current={key,id:crypto.randomUUID(),body};
  try{
   const res=await fetch('/api/workspace-scheduling',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,operationId:pending.current.id})});const result=await res.json();
   if(!res.ok){if(res.status<500)pending.current=null;throw Error(result.error||'Unable to save.');}
   if(!result.record?.id)throw Error('Save outcome is unconfirmed. Retry the unchanged action; your draft is preserved.');
   pending.current=null;setStatus('Saved in MFH. No email, reminder, or calendar invitation was sent.');await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Connection failed. Retry the unchanged action; your draft is preserved.');}finally{setBusy(false);}
 }
 function findSlots(){setError('');setSelected('');if(!activeRule)return;
  try{const m=minute(at);if(new Date(date+'T12:00:00Z').getUTCDay()!==activeRule.weekday||m<activeRule.start_minute||m+activeRule.duration>activeRule.end_minute||(m-activeRule.start_minute)%activeRule.duration!==0)throw Error('Choose the rule’s weekday and a duration-aligned start within its window.');
   const choices=localInstants(date,m,activeRule.timezone);setSlots(choices);if(!choices.length)throw Error('This local time does not exist (daylight-saving gap), or the date is invalid. Choose another time.');if(choices.length===1)setSelected(choices[0]);
  }catch(e){setSlots([]);setError((e as Error).message);}
 }
 const disabled=busy||!data;
 return <div className="mx-auto max-w-5xl p-3 sm:p-6 text-slate-900 space-y-6">
  <nav aria-label="Suite sections" className="flex flex-wrap gap-3 text-sm underline"><a href="/workspace/clients">Clients</a><a href="/workspace/projects">Projects</a><a href="/workspace/time">Time</a><a href="/workspace/scheduling">Scheduling</a><a href="/workspace/invoices">Invoices</a><a href="/dashboard">Agreements</a></nav>
  <h1 className="text-2xl font-bold">Local scheduling &amp; intake</h1>
  <p>Owner-managed <strong>MFH bookings only</strong>. External calendars are not checked. No emails, reminders, or invitations are sent. Intake answers are owner-only; there is no public booking link.</p>
  <p className="text-sm">Weekly same-day windows; 15–240 minute appointments. Publish a new immutable intake version for changes. Disable a rule and create a replacement to change its timezone or hours; existing booking instants stay unchanged.</p>
  {error&&<p role="alert" className="rounded border border-red-700 bg-red-50 p-3">{error}</p>}
  {status&&<p role="status" className="rounded bg-green-50 p-3">{status}</p>}
  {pending.current&&<button className={button} disabled={disabled} onClick={()=>pending.current&&void mutate(pending.current.body)}>Retry same operation</button>}
  <button className={button} disabled={busy} onClick={()=>refresh().then(()=>setError('')).catch(e=>setError(e.message))}>Refresh records (keep draft)</button>
  {!data&&!error&&<p role="status">Loading private scheduling records…</p>}
  {data?.truncated&&<p role="alert">Showing the latest 500 records in each section. Older records are not shown. This bounded view is not a complete export.</p>}
  <div className="grid gap-6 lg:grid-cols-2">
   <form className={section} onSubmit={e=>{e.preventDefault();mutate({action:'availability',...rule});}}>
    <h2 className="text-xl font-semibold">1. Create availability</h2>
    <label className="block">Event title<input className={control} required maxLength={100} value={rule.title} onChange={e=>setRule({...rule,title:e.target.value})}/></label>
    <label className="block">Host IANA timezone<input className={control} required value={rule.timezone} onChange={e=>setRule({...rule,timezone:e.target.value})}/></label>
    <label className="block">Weekday<select className={control} value={rule.weekday} onChange={e=>setRule({...rule,weekday:Number(e.target.value)})}>{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3">{(['startMinute','endMinute'] as const).map(k=><label key={k}>{k==='startMinute'?'Window starts':'Window ends'}<input className={control} type="time" required value={time(rule[k])} onChange={e=>setRule({...rule,[k]:minute(e.target.value)})}/></label>)}</div>
    {([['duration','Duration (minutes)',15,240],['buffer','Buffer before & after (minutes)',0,120],['noticeHours','Minimum notice (hours)',0,720],['horizonDays','Booking horizon (days)',1,180],['dailyCap','Host daily cap',1,50]] as const).map(([k,label,min,max])=><label className="block" key={k}>{label}<input className={control} type="number" required min={min} max={max} value={rule[k]} onChange={e=>setRule({...rule,[k]:Number(e.target.value)})}/></label>)}
    <button className={button} disabled={disabled}>Create availability</button>
   </form>
   <form className={section} onSubmit={e=>{e.preventDefault();mutate({action:'publish',title,consent,fields});}}>
    <h2 className="text-xl font-semibold">2. Publish intake version</h2>
    <p>Preview the questions below. Publication is immutable and private to your workspace. This bounded builder supports 1–8 text questions, each up to 2,000 answer characters.</p>
    <label className="block">Intake title<input className={control} required maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="block">Privacy / consent text<textarea className={control} required maxLength={2000} value={consent} onChange={e=>setConsent(e.target.value)}/></label>
    {fields.map((f,index)=><fieldset key={f.id} className="border p-3 space-y-2"><legend>Question {index+1}</legend><label className="block">Question text<input className={control} required maxLength={160} value={f.label} onChange={e=>setFields(fields.map((v,i)=>i===index?{...v,label:e.target.value}:v))}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={f.required} onChange={e=>setFields(fields.map((v,i)=>i===index?{...v,required:e.target.checked}:v))}/>Required answer</label></fieldset>)}
    <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={fields.length>=8} onClick={()=>setFields([...fields,{id:'q'+(fields.length+1),label:'',required:false}])}>Add question</button>{fields.length>1&&<button type="button" className={button} onClick={()=>setFields(fields.slice(0,-1))}>Remove last question</button>}<button className={button} disabled={disabled}>Publish immutable version</button></div>
   </form>
  </div>
  <section className={section}><h2 className="text-xl font-semibold">Availability rules</h2>{data?.availability.length===0&&<p>No rules yet.</p>}{data?.availability.map(r=><div key={r.id} className="border-b py-3 space-y-2"><p className="break-words"><strong>{r.title}</strong> · {days[r.weekday]} {time(r.start_minute)}–{time(r.end_minute)} · {r.timezone} · {r.duration} min · {r.buffer} min buffer · {r.notice_hours}h notice · {r.horizon_days}d horizon · cap {r.daily_cap} · {r.active?'Active':'Disabled'}</p><button className={button} disabled={disabled} onClick={()=>mutate({action:'toggle',id:r.id,expectedVersion:r.version,active:!r.active})}>{r.active?'Disable':'Enable'} {r.title}</button></div>)}</section>
  <form className={section} onSubmit={e=>{e.preventDefault();if(activeRule)mutate({action:'book',availabilityId:activeRule.id,expectedVersion:activeRule.version,intakeId,startsAt:selected,attendee,answers,consented});}}>
   <h2 className="text-xl font-semibold">3. Record a local booking</h2>
   <label className="block">Availability<select className={control} required value={ruleId} onChange={e=>{setRuleId(e.target.value);setSlots([]);setSelected('');}}><option value="">Choose a rule</option>{data?.availability.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.title} · {days[r.weekday]} · {r.timezone}</option>)}</select></label>
   <label className="block">Published intake<select className={control} required value={intakeId} onChange={e=>{setIntakeId(e.target.value);setAnswers({});setConsented(false);}}><option value="">Choose a version</option>{data?.intakes.map(i=><option key={i.id} value={i.id}>{i.title} · version {i.version}</option>)}</select></label>
   <label className="block">Attendee label (private)<input className={control} required maxLength={160} value={attendee} onChange={e=>setAttendee(e.target.value)}/></label>
   {intake&&<fieldset className="space-y-3"><legend>Intake version {intake.version} · {intake.title}</legend>{intake.fields.map(f=><label className="block" key={f.id}>{f.label}{f.required?' (required)':''}<textarea className={control} required={f.required} maxLength={2000} value={answers[f.id]||''} onChange={e=>setAnswers({...answers,[f.id]:e.target.value})}/></label>)}<p className="whitespace-pre-wrap break-words">{intake.consent}</p><label className="flex gap-2 items-start"><input type="checkbox" required checked={consented} onChange={e=>setConsented(e.target.checked)}/>I reviewed this privacy text with the attendee and have permission to record these answers.</label></fieldset>}
   <div className="grid gap-3 sm:grid-cols-2"><label>Host local date<input className={control} type="date" required value={date} onChange={e=>{setDate(e.target.value);setSelected('');setSlots([]);}}/></label><label>Host local start time<input className={control} type="time" required value={at} onChange={e=>{setAt(e.target.value);setSelected('');setSlots([]);}}/></label></div>
   <button type="button" className={button} disabled={!activeRule||!date} onClick={findSlots}>Resolve timezone &amp; review time</button>
   {slots.length>0&&activeRule&&<fieldset className="space-y-3"><legend>Choose exact instant. Repeated DST times appear separately.</legend>{slots.map(s=><label key={s} className="flex items-start gap-2 border p-3 break-words"><input type="radio" name="slot" required checked={selected===s} onChange={()=>setSelected(s)}/><span>{slotLabel(s,activeRule.timezone)}<br/>UTC: {s}<br/>Your browser timezone: {slotLabel(s,Intl.DateTimeFormat().resolvedOptions().timeZone)}</span></label>)}</fieldset>}
   <p>Availability, buffers, notice, daily cap, and overlapping MFH bookings are checked atomically when saving. A time crossing a DST offset change is not accepted.</p>
   <button className={button} disabled={disabled||!selected||!intake}>Confirm local booking</button>
  </form>
  <section className={section}><h2 className="text-xl font-semibold">Private bookings &amp; submissions</h2>{data?.bookings.length===0&&<p>No bookings yet.</p>}{data?.bookings.map(b=><article key={b.id} className="border-b py-4 space-y-3 break-words"><h3 className="font-semibold">{b.attendee} · {b.status}</h3><p>{slotLabel(b.starts_at,b.timezone)} – {slotLabel(b.ends_at,b.timezone)}</p><details><summary className="cursor-pointer">Owner-only intake answers</summary><p>Published intake ID: {b.intake_id}</p>{Object.entries(b.answers).map(([k,v])=><p className="whitespace-pre-wrap" key={k}><strong>{data.intakes.find(i=>i.id===b.intake_id)?.fields.find(f=>f.id===k)?.label||k}:</strong> {v}</p>)}</details>{b.status==='confirmed'&&<button className={button} disabled={disabled} onClick={()=>mutate({action:'cancel',id:b.id,expectedVersion:b.version})}>Cancel booking for {b.attendee}</button>}</article>)}</section>
 </div>;
}
