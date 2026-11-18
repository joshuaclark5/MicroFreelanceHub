'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {currencies,money,TimeEntry,TimeProject,timeTotals} from '../../lib/workspaceTime';
import './time.css';
import '../workspace-editorial.css';
import WorkspaceNav from '../WorkspaceNav';
import {parseMajorToMinor,minorToMajor,formatMoney,formatDuration,localDateTime,localToUtc,localInstantLabel,durationToSeconds} from '../../lib/workspacePresentation';
type Data={actorId:string;records:TimeEntry[];projects:TimeProject[];running:TimeEntry|null;serverNow:string;truncated:boolean;projectsTruncated:boolean;totals:ReturnType<typeof timeTotals>|null};
type Draft={projectId:string;description:string;startedAt:string;hours:string;minutes:string;remainder:number;billable:boolean;rateMajor:string;currency:string};
const blank=():Draft=>({projectId:'',description:'',startedAt:localDateTime(new Date(Date.now()-3600000).toISOString()),hours:'1',minutes:'0',remainder:0,billable:true,rateMajor:'0.00',currency:'USD'});
const duration=formatDuration;
export default function TimeWorkspace(){
 const [data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [draft,setDraft]=useState<Draft>(blank),[editing,setEditing]=useState<TimeEntry|null>(null),[mode,setMode]=useState('manual');
 const [from,setFrom]=useState(()=>new Date().toISOString().slice(0,10)),[days,setDays]=useState('7'),[project,setProject]=useState(''),[billable,setBillable]=useState('');
 const actor=useRef<string|null>(null),pending=useRef<Record<string,unknown>|null>(null),[uncertain,setUncertain]=useState(false),[accountChanged,setAccountChanged]=useState(false);
 const anchor=useRef({server:0,mono:0}),[elapsed,setElapsed]=useState(0),sequence=useRef(0);
 const load=useCallback(async()=>{
 const seq=++sequence.current;setLoading(true);setError('');
 try{const params=new URLSearchParams({from,days});if(project)params.set('projectId',project);if(billable)params.set('billable',billable);
 const response=await fetch('/api/workspace-time?'+params,{cache:'no-store'}),result=await response.json();if(seq!==sequence.current)return;
 if(!response.ok)throw Error(result.error||'Cannot load saved time.');
 if(actor.current&&actor.current!==result.actorId){setAccountChanged(true);setData(null);throw Error('Account changed. Your draft is preserved. Sign back into the original account, then reload.');}
 actor.current=result.actorId;setAccountChanged(false);anchor.current={server:Date.parse(result.serverNow),mono:performance.now()};setData(result);
 }catch(e){if(seq===sequence.current){setData(null);setError((e as Error).message);}}finally{if(seq===sequence.current)setLoading(false);}
 },[from,days,project,billable]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{const tick=()=>{if(data?.running)setElapsed(Math.max(0,Math.floor((anchor.current.server+performance.now()-anchor.current.mono-Date.parse(data.running.started_at))/1000)));};tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[data]);
 function change(key:keyof Draft,value:string|boolean){setDraft(d=>({...d,[key]:value}));}
 async function send(payload:Record<string,unknown>){
 if(busy)return;pending.current=payload;setBusy(true);setError('');setNotice('');setUncertain(false);
 try{const response=await fetch('/api/workspace-time',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const result=await response.json();
 if(!response.ok){if(response.status>=500)setUncertain(true);else pending.current=null;throw Error(result.error||'Save failed.');}
 if(result.actorId!==actor.current||!result.record?.id){setUncertain(true);throw Error('Save outcome unconfirmed. Retry the same operation.');}
 pending.current=null;if(['manual','start','edit'].includes(String(payload.action))){setEditing(null);setDraft(blank());}setNotice('Saved. No invoice was created.');await load();
 }catch(e){if(pending.current)setUncertain(true);setError((e as Error).message||'Save outcome unconfirmed. Retry the same operation.');}finally{setBusy(false);}
 }
 function action(action:string,row?:TimeEntry){
 if(!actor.current)return;
 try { let details:Record<string,unknown>={};
 if(row)details={id:row.id,expectedVersion:row.version};
 else if(editing)details={id:editing.id,expectedVersion:editing.version,description:draft.description,billable:draft.billable,startedAt:(editing&&draft.startedAt===localDateTime(editing.started_at)?editing.started_at.replace('.000Z','Z'):localToUtc(draft.startedAt)),seconds:durationToSeconds(draft.hours,draft.minutes,draft.remainder)};
 else details={projectId:draft.projectId,description:draft.description,billable:draft.billable,rateMinor:parseMajorToMinor(draft.rateMajor,draft.currency),currency:draft.currency,...(action==='manual'?{startedAt:localToUtc(draft.startedAt),seconds:durationToSeconds(draft.hours,draft.minutes,draft.remainder)}:{})};
 void send({action,operationId:crypto.randomUUID(),expectedActorId:actor.current,...details});}catch(e){setError((e as Error).message);}
 }
 function editRow(row:TimeEntry){setEditing(row);setDraft({projectId:row.project_id,description:row.description,startedAt:localDateTime(row.started_at),hours:String(Math.floor((row.seconds||0)/3600)),minutes:String(Math.floor((row.seconds||0)%3600/60)),remainder:(row.seconds||0)%60,billable:row.billable,rateMajor:minorToMajor(row.rate_minor,row.currency),currency:row.currency});document.getElementById('time-description')?.focus();}
 const blocked=busy||loading||!data||accountChanged||uncertain;
 return <div className="editorial-shell"><WorkspaceNav active="time"/><div className="editorial-main time-workspace"><header className="editorial-header"><div><p className="editorial-eyebrow">YOUR WORKSPACE / TIME</p><h1>Make time for<br/><em>your best work.</em></h1><p>Capture the work. Review your week. Keep every detail connected to the right project.</p></div><a className="primary-action" href="#add-time">Add time ↗</a></header><p className="quiet-note">Time estimates stay separate from invoices and payments. Only you can see and approve these records.</p>
 {error&&<div role="alert" className="time-error">{error} Your form has not been cleared. <a href="/login" target="_blank" rel="noreferrer">Sign in in a new tab</a></div>}
 {notice&&<p role="status">{notice}</p>}
 <div className="time-actions"><button type="button" onClick={()=>void load()} disabled={busy}>Reload saved time</button>{uncertain&&<button type="button" disabled={busy||accountChanged} onClick={()=>pending.current&&void send(pending.current)}>Retry same operation</button>}</div>
 {uncertain&&<p>Resolve the pending operation before changing this form. Retrying uses the same operation ID and details, preventing duplicate time.</p>}
 {data?.running&&<section className="time-panel" aria-label="Running timer"><p className="editorial-eyebrow">IN PROGRESS</p><h2>Timer running</h2><p>{data.projects.find(p=>p.id===data.running?.project_id)?.name||'Saved project'} · {data.running.description||'No description'}</p><p className="time-clock">{duration(elapsed)}</p><p>Started {localInstantLabel(data.running.started_at)}</p><details><summary>Timer details</summary><p>Saved UTC start: {data.running.started_at}. The display is an estimate; stopping uses the server clock. Timers stop at 31 days and then need a correction.</p></details><button disabled={blocked} onClick={()=>action('stop',data.running!)}>Stop timer</button></section>}
 <div className="time-grid"><section className="time-panel" id="add-time"><h2>{editing?'Edit saved time':'Add time'}</h2>
 <form onSubmit={e=>{e.preventDefault();action(editing?'edit':mode);}}><fieldset disabled={blocked}><legend>{editing?'Edits reopen self-approved time as draft.':'Choose how to capture your work'}</legend>
 {!editing&&<label>Entry type<select aria-label="Entry type" value={mode} onChange={e=>setMode(e.target.value)}><option value="manual">Manual time</option><option value="start">Start timer</option></select></label>}
 <label>Project<select aria-label="Project" required value={draft.projectId} disabled={!!editing} onChange={e=>change('projectId',e.target.value)}><option value="">Choose a project</option>{data?.projects.filter(p=>p.status==='active'||p.id===draft.projectId).map(p=><option key={p.id} value={p.id}>{p.name}{p.status!=='active'?' (archived)':''}</option>)}</select></label>
 {data&&!data.projects.some(p=>p.status==='active')&&<p>Create or reopen a project before adding time. <Link href="/workspace/projects">Open projects</Link></p>}
 {data?.projectsTruncated&&<p role="status">The project list is incomplete or its completeness could not be verified (up to 1,000 shown).</p>}
 <label htmlFor="time-description">Description</label><textarea id="time-description" value={draft.description} maxLength={2000} onChange={e=>change('description',e.target.value)}/>
 {(editing||mode==='manual')&&<><label>Start time<input type="datetime-local" step="1" required value={draft.startedAt} onChange={e=>change('startedAt',e.target.value.length===16?e.target.value+':00':e.target.value)}/></label><p className="fine-print">Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Saved as an exact UTC instant. During a repeated daylight-saving hour, a new entry uses the earlier occurrence.</p><div className="time-duration"><label>Hours<input type="number" min="0" max="744" step="1" required value={draft.hours} onChange={e=>change('hours',e.target.value)}/></label><label>Minutes<input type="number" min="0" max="59" step="1" required value={draft.minutes} onChange={e=>change('minutes',e.target.value)}/></label></div>{draft.remainder>0&&<p className="fine-print">The saved {draft.remainder} remaining seconds are preserved when you edit.</p>}</>}
 <label className="time-check"><input type="checkbox" checked={draft.billable} onChange={e=>change('billable',e.target.checked)}/> Billable</label>
 <label>Hourly rate ({draft.currency})<input type="text" inputMode="decimal" required value={draft.rateMajor} disabled={!!editing} onChange={e=>change('rateMajor',e.target.value)}/></label>
 <label>Currency<select aria-label="Currency" value={draft.currency} disabled={!!editing} onChange={e=>change('currency',e.target.value)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label>
 <p className="fine-print">Enter your usual hourly price, such as 125.00 USD. Rate, currency and project are locked after saving.</p>
 <div className="time-actions"><button className="primary-action" type="submit" disabled={!editing&&mode==='start'&&!!data?.running}>{busy?'Saving…':editing?'Save correction':mode==='start'?'Start timer':'Save manual time'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setDraft(blank());}}>Cancel edit</button>}</div>
 </fieldset></form></section>
 <section className="time-panel"><h2>Timesheet</h2><div className="time-filters"><label>First date (UTC)<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>View<select aria-label="View" value={days} onChange={e=>setDays(e.target.value)}><option value="1">Day</option><option value="7">Seven days</option></select></label><label>Filter project<select aria-label="Filter project" value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{data?.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Filter billability<select aria-label="Filter billability" value={billable} onChange={e=>setBillable(e.target.value)}><option value="">All time</option><option value="true">Billable</option><option value="false">Nonbillable</option></select></label></div>
 <details><summary>How this timesheet is calculated</summary><p>Dates use UTC, not your local day. Each entry belongs to its UTC start date, including work crossing midnight. Overlapping entries count separately; running timers are excluded. Values are estimates, not invoices or collected revenue, rounded once per currency and billability.</p></details>
 {loading?<p role="status">Loading saved time…</p>:data&&<>{data.truncated?<p role="alert">The entry list is incomplete or its completeness could not be verified. Totals are unavailable; narrow to a day or project. At most 1,000 entries are shown.</p>:<div className="time-totals">{data.totals?.map(t=><p key={t.currency+':'+t.billable}><strong>{t.currency} · {t.billable?'Billable':'Nonbillable'}</strong><br/>{duration(t.seconds)} · estimated value {formatMoney(t.valueMinor,t.currency)}</p>)}</div>}
 {!data.records.length?<p>No completed time in this range. Add time or choose another date.</p>:<ul className="time-list">{data.records.map(row=><li key={row.id}><h3>{data.projects.find(p=>p.id===row.project_id)?.name||'Saved project'}</h3><p>{row.description||'No description'}</p><p>{localInstantLabel(row.started_at)} · {duration(row.seconds||0)}</p><p>{row.billable?'Billable':'Nonbillable'} · {formatMoney(row.rate_minor,row.currency)}/hour · {row.review_status==='self_approved'?'Self-approved':'Draft'}</p><details><summary>Saved time details</summary><p>UTC start: {row.started_at} · revision {row.version}</p></details><div className="time-actions"><button disabled={blocked} onClick={()=>editRow(row)} aria-label={'Edit time '+row.description}>Edit</button>{row.review_status==='draft'&&<button disabled={blocked} onClick={()=>action('approve',row)}>Self-approve</button>}</div></li>)}</ul>}</>}
 </section></div><p>No team approvals, automatic invoices, payroll or currency conversion. Saved history is retained.</p></div></div>;
}
