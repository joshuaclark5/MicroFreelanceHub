'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {currencies,money,TimeEntry,TimeProject,timeTotals} from '../../lib/workspaceTime';
import './time.css';
type Data={actorId:string;records:TimeEntry[];projects:TimeProject[];running:TimeEntry|null;serverNow:string;truncated:boolean;projectsTruncated:boolean;totals:ReturnType<typeof timeTotals>|null};
type Draft={projectId:string;description:string;startedAt:string;seconds:string;billable:boolean;rateMinor:string;currency:string};
const blank=():Draft=>({projectId:'',description:'',startedAt:new Date(Date.now()-3600000).toISOString().slice(0,19),seconds:'3600',billable:true,rateMinor:'0',currency:'USD'});
const duration=(s:number)=>Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m '+s%60+'s';
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
 let details:Record<string,unknown>={};
 if(row)details={id:row.id,expectedVersion:row.version};
 else if(editing)details={id:editing.id,expectedVersion:editing.version,description:draft.description,billable:draft.billable,startedAt:draft.startedAt+'Z',seconds:Number(draft.seconds)};
 else details={projectId:draft.projectId,description:draft.description,billable:draft.billable,rateMinor:Number(draft.rateMinor),currency:draft.currency,...(action==='manual'?{startedAt:draft.startedAt+'Z',seconds:Number(draft.seconds)}:{})};
 void send({action,operationId:crypto.randomUUID(),expectedActorId:actor.current,...details});
 }
 function editRow(row:TimeEntry){setEditing(row);setDraft({projectId:row.project_id,description:row.description,startedAt:new Date(row.started_at).toISOString().slice(0,19),seconds:String(row.seconds),billable:row.billable,rateMinor:String(row.rate_minor),currency:row.currency});document.getElementById('time-description')?.focus();}
 const blocked=busy||loading||!data||accountChanged||uncertain;
 return <div className="time-workspace"><nav aria-label="Workspace"><Link href="/workspace/projects">Projects</Link> / Time</nav>
 <header><p className="time-eyebrow">SOLO WORKSPACE</p><h1>Time & timesheets</h1><p>Track work, review your week, keep the details. Owner-only records; self-approval is not independent review.</p></header>
 {error&&<div role="alert" className="time-error">{error} Your form has not been cleared. <a href="/login" target="_blank" rel="noreferrer">Sign in in a new tab</a></div>}
 {notice&&<p role="status">{notice}</p>}
 <div className="time-actions"><button type="button" onClick={()=>void load()} disabled={busy}>Reload saved time</button>{uncertain&&<button type="button" disabled={busy||accountChanged} onClick={()=>pending.current&&void send(pending.current)}>Retry same operation</button>}</div>
 {uncertain&&<p>Resolve the pending operation before changing this form. Retrying uses the same operation ID and details, preventing duplicate time.</p>}
 {data?.running&&<section className="time-panel" aria-label="Running timer"><h2>Timer running</h2><p>{data.projects.find(p=>p.id===data.running?.project_id)?.name||'Saved project'} · {data.running.description||'No description'}</p><p className="time-clock">{duration(elapsed)}</p><p>Started {new Date(data.running.started_at).toISOString()} · display estimate; stop uses the server clock. Timers longer than 31 days stop at 31 days and need an audited correction.</p><button disabled={blocked} onClick={()=>action('stop',data.running!)}>Stop timer</button></section>}
 <div className="time-grid"><section className="time-panel"><h2>{editing?'Edit saved time':'Add time'}</h2>
 <form onSubmit={e=>{e.preventDefault();action(editing?'edit':mode);}}><fieldset disabled={blocked}><legend>{editing?'Edits reopen self-approved time as draft.':'Manual entry or persistent timer'}</legend>
 {!editing&&<label>Entry type<select aria-label="Entry type" value={mode} onChange={e=>setMode(e.target.value)}><option value="manual">Manual time</option><option value="start">Start timer</option></select></label>}
 <label>Project<select aria-label="Project" required value={draft.projectId} disabled={!!editing} onChange={e=>change('projectId',e.target.value)}><option value="">Choose a project</option>{data?.projects.filter(p=>p.status==='active'||p.id===draft.projectId).map(p=><option key={p.id} value={p.id}>{p.name}{p.status!=='active'?' (archived)':''}</option>)}</select></label>
 {data&&!data.projects.some(p=>p.status==='active')&&<p>Create or reopen a project before adding time. <Link href="/workspace/projects">Open projects</Link></p>}
 {data?.projectsTruncated&&<p role="status">Only the first 1,000 projects are available here.</p>}
 <label htmlFor="time-description">Description</label><textarea id="time-description" value={draft.description} maxLength={2000} onChange={e=>change('description',e.target.value)}/>
 {(editing||mode==='manual')&&<><label>Start (UTC)<input type="datetime-local" step="1" required value={draft.startedAt} onChange={e=>change('startedAt',e.target.value.length===16?e.target.value+':00':e.target.value)}/></label><label>Duration in exact seconds<input type="number" min="1" max="2678400" step="1" required value={draft.seconds} onChange={e=>change('seconds',e.target.value)}/></label></>}
 <label className="time-check"><input type="checkbox" checked={draft.billable} onChange={e=>change('billable',e.target.checked)}/> Billable</label>
 <label>Hourly rate in minor units<input type="number" min="0" max="100000000" step="1" required value={draft.rateMinor} disabled={!!editing} onChange={e=>change('rateMinor',e.target.value)}/></label>
 <label>Currency<select aria-label="Currency" value={draft.currency} disabled={!!editing} onChange={e=>change('currency',e.target.value)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label>
 <p>Snapshot: {money(draft.rateMinor||0,draft.currency)}/hour. USD 100 = $1; JPY 1 = ¥1; KWD 1000 = KWD 1. Rate, currency and project cannot be rewritten after saving.</p>
 <div className="time-actions"><button type="submit" disabled={!editing&&mode==='start'&&!!data?.running}>{busy?'Saving…':editing?'Save correction':mode==='start'?'Start timer':'Save manual time'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setDraft(blank());}}>Cancel edit</button>}</div>
 </fieldset></form></section>
 <section className="time-panel"><h2>Timesheet</h2><div className="time-filters"><label>First date (UTC)<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>View<select aria-label="View" value={days} onChange={e=>setDays(e.target.value)}><option value="1">Day</option><option value="7">Seven days</option></select></label><label>Filter project<select aria-label="Filter project" value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{data?.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Filter billability<select aria-label="Filter billability" value={billable} onChange={e=>setBillable(e.target.value)}><option value="">All time</option><option value="true">Billable</option><option value="false">Nonbillable</option></select></label></div>
 <p>UTC start-date allocation: a cross-midnight entry belongs entirely to its start day. Overlapping manual entries are allowed and counted separately. Running time is excluded. Values are estimates, not invoices or collected revenue; rounded once per currency and billability.</p>
 {loading?<p role="status">Loading saved time…</p>:data&&<>{data.truncated?<p role="alert">More than 1,000 entries match. Totals are unavailable; narrow to a day or project. Showing only 1,000 entries.</p>:<div className="time-totals">{data.totals?.map(t=><p key={t.currency+':'+t.billable}><strong>{t.currency} · {t.billable?'Billable':'Nonbillable'}</strong><br/>{duration(t.seconds)} · estimated value {money(t.valueMinor,t.currency)}</p>)}</div>}
 {!data.records.length?<p>No completed time in this range. Add time or choose another date.</p>:<ul className="time-list">{data.records.map(row=><li key={row.id}><h3>{data.projects.find(p=>p.id===row.project_id)?.name||'Saved project'}</h3><p>{row.description||'No description'}</p><p>{new Date(row.started_at).toISOString()} · {duration(row.seconds||0)}</p><p>{row.billable?'Billable':'Nonbillable'} · {money(row.rate_minor,row.currency)}/hour · {row.review_status==='self_approved'?'Self-approved':'Draft'} · version {row.version}</p><div className="time-actions"><button disabled={blocked} onClick={()=>editRow(row)} aria-label={'Edit time '+row.description}>Edit</button>{row.review_status==='draft'&&<button disabled={blocked} onClick={()=>action('approve',row)}>Self-approve</button>}</div></li>)}</ul>}</>}
 </section></div><p>No team approvals, automatic invoices, payroll or currency conversion. Saved history is retained.</p></div>;
}
