'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {workspaceCsv} from '../lib/workspaceExport';
import WorkspaceNav from '../components/WorkspaceNav';
import ClientTimeline, {TimelineDraft} from '../components/ClientTimeline';
import { Entity, entities, fields, taskNextAction, workspaceInput, validId } from '../lib/connectedWorkspace';
import './workspace.css';
type Row = {id:string; [key:string]:any};
type Data = Record<Entity|'available-agreements',Row[]>;
const empty:Data={clients:[],projects:[],stages:[],tasks:[],agreements:[],'available-agreements':[]};
const titles:Record<Entity,string>={clients:'Clients',projects:'Projects',stages:'Pipeline stages',tasks:'Tasks',agreements:'Agreement links'};
const labels:Record<string,string>={name:'Name',phone:'Phone (optional)',email:'Email (optional)',notes:'Notes (optional)',position:'Stage order',client_id:'Client',stage_id:'Pipeline stage',status:'Status',title:'Task title',project_id:'Project',agreement_id:'Agreement',due_date:'Due date (optional)'};
export default function Workspace({section}:{section:Entity}) {
 const [data,setData]=useState<Data>(empty),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[signedOut,setSignedOut]=useState(false),[limited,setLimited]=useState(false);
 const [editing,setEditing]=useState<Row|null>(null),[form,setForm]=useState<Record<string,any>|null>(null),[busy,setBusy]=useState(false);
 const [loaded,setLoaded]=useState(false),[exporting,setExporting]=useState(false);
 const owner=useRef<string|null>(null),loadGeneration=useRef(0);
 // Filtering removes cards; keep exact note retry identity in the owner/client-scoped workspace.
 const timelineDrafts=useRef(new Map<string,TimelineDraft>());
 const [conflict,setConflict]=useState(false),[reconciled,setReconciled]=useState(false);
 const [uncertain,setUncertain]=useState(false),[authExpired,setAuthExpired]=useState(false);
 const searchParams=useSearchParams();
 // Keep list controls in the current history entry so record navigation and Back
 // restore the same view. No browser storage or private record cache is added.
 const search=searchParams.get('q')||'',projectFilter=searchParams.get('project')||'';
 const view=searchParams.get('view')==='pipeline'?'pipeline':'list';
 function updateListQuery(key:string,value:string){
  const url=new URL(window.location.href);
  if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
  window.history.replaceState(null,'',url.pathname+url.search+url.hash);
 }
 const setSearch=(value:string)=>updateListQuery('q',value);
 const setProjectFilter=(value:string)=>updateListQuery('project',value);
 const setView=(value:'list'|'pipeline')=>updateListQuery('view',value==='pipeline'?value:'');
 // A task address is a record view, not a list filter. Never fall back to other tasks.
 const taskAddress=section==='tasks'&&searchParams.has('task');
 const taskId=taskAddress&&searchParams.getAll('task').length===1?searchParams.get('task')||'':'';
 const taskReady=loaded&&!loading&&!authExpired&&!signedOut&&!error;
 const selectedTask=taskAddress&&taskReady&&validId(taskId)?data.tasks.find(t=>t.id.toLowerCase()===taskId.toLowerCase()):undefined;
 const taskHeading=useRef<HTMLHeadingElement|null>(null);
 useEffect(()=>{if(selectedTask&&!form)taskHeading.current?.focus();},[taskAddress,taskId,selectedTask?.id,taskReady]);
 const clientFilter=taskAddress?'':searchParams.get('client')||'';
 const focusedClient=data.clients.find(c=>c.id===clientFilter);
 const recordContext=taskAddress||!!clientFilter||!!projectFilter;
 const breadcrumbReady=loaded&&!loading&&!authExpired&&!signedOut&&!error;
 const contextProject=breadcrumbReady?data.projects.find(p=>p.id===projectFilter):undefined;
 const breadcrumbLabel=!breadcrumbReady?(loading?'Loading record...':'Record unavailable'):
  taskAddress?(selectedTask?.title||'Task unavailable'):
  clientFilter?(focusedClient?((section==='clients'?'':titles[section]+' for ')+focusedClient.name):'Customer unavailable'):
  contextProject?((section==='projects'?'':titles[section]+' for ')+contextProject.name):'Project unavailable';
 const [deleteId,setDeleteId]=useState('');
 const firstField=useRef<HTMLInputElement|null>(null),heading=useRef<HTMLHeadingElement|null>(null);
 const formElement=useRef<HTMLFormElement|null>(null);
 async function checkSession(){
  const response=await fetch('/api/workspace/session',{cache:'no-store',headers:owner.current?{'x-workspace-owner':owner.current}:{}});
  const body=await response.json();
  if(response.status===401||body.code==='account_changed'){setAuthExpired(true);throw Error(body.error||'Sign in to open your workspace.');}
  if(!response.ok||!validId(body.ownerId))throw Error(body.error||'Session identity could not be verified.');
  if(owner.current&&owner.current!==body.ownerId){setAuthExpired(true);throw Error('Return to the original account to continue this draft.');}
  owner.current=body.ownerId;return body.ownerId as string;
 }
 async function load(){const generation=++loadGeneration.current;setLoading(true);setError('');setReconciled(false);try{
  const ownerId=await checkSession();
  const results=await Promise.all([...entities,'available-agreements'].map(async e=>{
   const records:Row[]=[];let after='';let complete=false;
   // Bound work/memory to 50 pages per category. Never call clipped data complete.
   for(let page=0;page<50;page++){
    const response=await fetch('/api/workspace/'+e+'?limit=200'+(after?'&after='+after:''),{cache:'no-store',headers:{'x-workspace-owner':ownerId}});
    const body=await response.json();
    if(response.status===401||body.code==='account_changed'){setAuthExpired(true);throw Error(body.error||'Your session expired. Keep this draft tab open and sign in in a new tab.');}
    if(!response.ok||body.ownerId!==ownerId||!Array.isArray(body.records)||typeof body.complete!=='boolean'||typeof body.hasMore!=='boolean'||body.hasMore===body.complete)throw Error(body.error||'Unable to verify workspace completeness.');
    for(const row of body.records){if(!validId(row.id)||(after&&row.id<=after))throw Error('Invalid workspace page order.');after=row.id;records.push(row);}
    if(body.complete){complete=true;break;}
    if(!body.records.length||body.nextCursor!==after)throw Error('Workspace pagination did not advance.');
   }
   return [e,{records,complete}] as const;
  }));
  await checkSession();
  if(generation!==loadGeneration.current)return;
  const next={...empty};for(const [e,b]of results)next[e as keyof Data]=b.records;setData(next);setLimited(results.some(([,b])=>!b.complete));setSignedOut(false);setLoaded(true);setReconciled(true);
 }catch(e){if(generation===loadGeneration.current){setError((e as Error).message);if(!owner.current&&((e as Error).message.includes('Sign in')||(e as Error).message.includes('Sign-in')))setSignedOut(true);}}finally{if(generation===loadGeneration.current)setLoading(false);}}
 useEffect(()=>{load();},[]);
 useEffect(()=>{if(form)(formElement.current?.querySelector('input,select,textarea') as HTMLElement|null)?.focus();},[!!form]);
 function start(row?:Row){setConflict(false);setUncertain(false);setAuthExpired(false);setNotice('');setError('');setDeleteId('');setEditing(row||null);const initial:Record<string,any>={};for(const f of fields[section])initial[f]=row?.[f]??(f==='position'?0:f==='status'?(section==='projects'?'active':'open'):'');if(!row && data.projects.some(p=>p.id===projectFilter))initial.project_id=projectFilter;
 if(!row && section==='agreements' && data['available-agreements'].some(a=>a.id===searchParams.get('agreement')))initial.agreement_id=searchParams.get('agreement');
 if(!row&&section==='projects'&&focusedClient)initial.client_id=focusedClient.id;
 setForm(initial);}
 async function mutate(method:string,values:Record<string,any>,id?:string){
  if(uncertain||authExpired||conflict||!owner.current||loading)return;
  setBusy(true);setReconciled(false);setError('');setNotice('');let confirmedFailure=false;
  try{const response=await fetch('/api/workspace/'+section+(id?'?id='+encodeURIComponent(id):''),{method,headers:{'Content-Type':'application/json','x-workspace-owner':owner.current,...(id?{'if-match':String((editing?.id===id?editing:data[section].find(r=>r.id===id))?.version||'')}: {})},body:JSON.stringify(values)});const body=await response.json();if(response.status===401){confirmedFailure=true;setAuthExpired(true);throw Error('Your session expired. Keep this tab open and sign in in a new tab, then check your session here. Your draft remains in this tab.');}if(body.code==='account_changed'){confirmedFailure=true;setAuthExpired(true);throw Error(body.error);}if(body.code==='version_conflict'||body.code==='version_required'){confirmedFailure=true;setConflict(true);setReconciled(false);throw Error(body.error);}if(!response.ok){confirmedFailure=response.status<500;throw Error(body.error||'The change was not confirmed.');}if(body.ownerId!==owner.current||!body.record?.id)throw Error('The change was not confirmed.');
   setData(old=>({...old,[section]:method==='DELETE'?old[section].filter(r=>r.id!==id):method==='PATCH'?old[section].map(r=>r.id===id?body.record:r):[body.record,...old[section]]}));
   setForm(null);setEditing(null);setDeleteId('');setNotice(method==='DELETE'?'Deleted.':'Saved to your workspace.');heading.current?.focus();
  }catch(e){if(!confirmedFailure)setUncertain(true);setError((e as Error).message+(!confirmedFailure?' This may already have saved. Saving is paused: reload the record list and inspect it before choosing whether to retry.':''));}finally{setBusy(false);}}
 const name=(entity:keyof Data,id:string)=>data[entity].find(r=>r.id===id)?.name||data[entity].find(r=>r.id===id)?.title||'Record unavailable';
 const rows=taskAddress?(selectedTask?[selectedTask]:[]):data[section].filter(r=>(!projectFilter||r.project_id===projectFilter||r.id===projectFilter)&&(!clientFilter||(section==='clients'?r.id===clientFilter:section==='projects'?r.client_id===clientFilter:true))&&[r.name,r.title,r.email,r.phone,r.notes,name('clients',r.client_id||''),name('stages',r.stage_id||''),name('projects',r.project_id||'')].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a,b)=>section==='stages'?a.position-b.position:0);
 async function exportShown(){
  if(!loaded||loading||limited||authExpired||uncertain||conflict||busy||exporting||!rows.length)return;
  const generation=loadGeneration.current,records=[...rows],snapshot=data;setExporting(true);setError('');
  try{await checkSession();if(generation!==loadGeneration.current)throw Error('The workspace changed while preparing the export. Review the records and try again.');
   const csv=workspaceCsv(section,records,snapshot),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='mfh-'+section+'-shown-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('CSV downloaded: '+records.length+' saved records from this view. Private conversation history, attachments and unsaved edits are not included.');
  }catch(e){setError((e as Error).message);}finally{setExporting(false);}
 }
 const relation=(field:string)=>field==='client_id'?'clients':field==='stage_id'?'stages':field==='project_id'?'projects':'available-agreements';
 const missingRelations=fields[section].filter(f=>f.endsWith('_id')&&!data[relation(f)].length);
 const prerequisiteLinks:Record<string,{href:string;label:string}>={client_id:{href:'/workspace/clients',label:'Add a client'},stage_id:{href:'/workspace/stages',label:'Add a pipeline stage'},project_id:{href:'/workspace/projects',label:'Add a project'},agreement_id:{href:'/create',label:'Create an agreement'}};
 return <div className="d4-app-shell suite-shell"><WorkspaceNav active={section==='tasks'?'tasks':'workspace'}/><div className="suite-main">
  {section==='agreements' && data.projects.some(p=>p.id===projectFilter) && <Link href={'/create?project='+projectFilter}>New agreement for this project</Link>}
  <nav aria-label="Breadcrumb" className="suite-breadcrumb"><ol><li><Link href="/workspace">Overview</Link></li><li>{recordContext?<Link href={'/workspace/'+section}>{titles[section]}</Link>:<span aria-current="page">{titles[section]}</span>}</li>{recordContext&&<li><span aria-current="page">{breadcrumbLabel}</span></li>}</ol></nav>
  <header className="suite-header"><p className="suite-eyebrow">CONNECTED WORKSPACE</p><h1 ref={heading} tabIndex={-1}>{titles[section]}</h1><p>Keep client context, project progress and the next action together.</p><Link href="/dashboard">Open agreements →</Link></header>
  {clientFilter&&<section className="suite-account-context"><Link href="/workspace/clients">All customers</Link><h2>{focusedClient?focusedClient.name:loading?'Loading customer...':'Customer unavailable'}</h2>{focusedClient&&<><p>Customer workspace: review the conversation, then move the work forward.</p><div className="suite-actions"><Link href={'/workspace/clients?client='+clientFilter}>Communication history</Link><Link href={'/workspace/projects?client='+clientFilter}>Customer projects</Link></div></>}</section>}
  <nav className="suite-tabs" aria-label="Connected workspace">{entities.map(e=><Link key={e} href={'/workspace/'+e} aria-current={e===section?'page':undefined}>{titles[e]}</Link>)}<Link href="/workspace/time">Time</Link><Link href="/workspace/scheduling">Scheduling</Link><Link href="/workspace/invoices">Invoices</Link></nav>
  <div role="status" aria-live="polite">{loading?'Loading your saved workspace…':notice}</div>
  {error&&<div className="suite-error" role="alert"><p>{error}</p>{signedOut?<Link href={'/login?mode=signin&returnTo='+encodeURIComponent('/workspace/'+section)}>Sign in</Link>:<button type="button" disabled={busy||authExpired} onClick={load}>Retry loading</button>}</div>}
  {authExpired&&<div className="suite-confirm"><a href="/login?mode=signin" target="_blank" rel="noopener noreferrer">Sign in in a new tab</a><p>Use the same account. This draft is not stored on disk; keep this tab open.</p><button type="button" disabled={busy} onClick={async()=>{try{await checkSession();setAuthExpired(false);setError('');setNotice('Session available. Review your draft before saving.');}catch{setError('Sign-in is not confirmed. Keep this draft tab open and finish signing in.');}}}>Check session</button></div>}
  {uncertain&&<div className="suite-confirm"><p>No retry has been sent. Your draft is still here. Inspect the saved list below after reloading it.</p><button type="button" disabled={busy||loading} onClick={load}>Reload saved records</button><button type="button" disabled={busy||loading||!reconciled} onClick={()=>{setUncertain(false);setError('');}}>I checked the saved records; allow retry</button></div>}
  {conflict&&<div className="suite-confirm"><p>Your draft was not applied. Reload saved records and compare them below. Applying your draft uses the refreshed version; no automatic merge is performed.</p><button type="button" disabled={busy||loading} onClick={load}>Reload saved records</button><button type="button" disabled={busy||loading||!reconciled} onClick={()=>{const current=data[section].find(r=>r.id===editing?.id);if(editing&&!current){setError('This record is no longer available. Keep or cancel your draft; it cannot overwrite a deleted record.');return;}if(current)setEditing(current);setConflict(false);setDeleteId('');setError('');}}>I reviewed changes; allow my draft</button></div>}
  {!taskAddress && loaded && projectFilter && !data.projects.some(p=>p.id===projectFilter) && <p role="alert">This project is unavailable in your loaded workspace. Choose an available project before creating or linking an agreement.</p>}
  {section==='agreements' && searchParams.get('agreement') && data['available-agreements'].some(a=>a.id===searchParams.get('agreement')) && <p role="status">Agreement saved. Choose Link agreement to review the selected project and agreement, then save the link. Nothing has been sent.</p>}
  {taskAddress&&<section className="suite-account-context" aria-label="Task navigation"><Link href="/workspace/tasks">All tasks</Link>{selectedTask&&data.projects.some(p=>p.id===selectedTask.project_id)&&<> · <Link href={'/workspace/projects?project='+encodeURIComponent(selectedTask.project_id)}>Parent project</Link></>}{!loading&&!selectedTask&&<p role="status">{!validId(taskId)?'Invalid task link. Choose a task from All tasks.':!taskReady?'This task could not be verified. Reconnect or retry loading your workspace.':limited?'This task was not found in the loaded records. The workspace load is incomplete; refresh to try again.':'Task unavailable. It may have been deleted or you may not have access.'}</p>}</section>}
  <p className="suite-export-note">Export shown CSV downloads saved records matching this view and its filters. It is not a complete account backup; conversations and attachments are not included.</p>
  {limited?<p role="status">Incomplete workspace: the bounded load stopped after 50 pages per category. Search, related counts and next actions cover loaded records only. Some related records may not be visible.</p>:loaded&&<p role="status">Loaded all pages. This is a live view, not a point-in-time snapshot; refresh after changes in another session.</p>}
  {(!loading||!!form)&&!signedOut&&loaded&&<>
   {!taskAddress&&<div className="suite-toolbar"><button type="button" onClick={()=>void exportShown()} disabled={!loaded||loading||limited||authExpired||uncertain||conflict||busy||exporting||!rows.length}>{exporting?'Preparing CSV...':'Export shown CSV'}</button>{section==='projects'&&<button type="button" aria-pressed={view==='pipeline'} onClick={()=>setView(view==='list'?'pipeline':'list')}>{view==='list'?'View pipeline':'View list'}</button>}{projectFilter&&section==='projects'&&<button type="button" onClick={()=>setProjectFilter('')}>Show all projects</button>}<label>Search {titles[section].toLowerCase()}<input value={search} onChange={e=>setSearch(e.target.value)} type="search"/></label>{['tasks','agreements'].includes(section)&&<label>Filter by project<select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="">All projects</option>{data.projects.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>}<button className="suite-primary" disabled={busy||!!form||authExpired||conflict||uncertain||loading} onClick={()=>start()}>{section==='agreements'?'Link agreement':'Add '+(section==='stages'?'stage':section.slice(0,-1))}</button></div>}
   {form&&<form ref={formElement} className="suite-form" onSubmit={e=>{e.preventDefault();try{const values=workspaceInput(section,form);mutate(editing?'PATCH':'POST',values,editing?.id);}catch(e){setError((e as Error).message);}}}>
    <h2>{editing?'Edit':'New'} {section==='stages'?'stage':section==='agreements'?'agreement link':section.slice(0,-1)}</h2>
    {missingRelations.length>0&&<div className="suite-confirm" role="status"><p>Set up the missing records before saving. These links open a new tab so your draft stays here.</p><ul>{missingRelations.map(f=><li key={f}><Link href={prerequisiteLinks[f].href} target="_blank" rel="noopener noreferrer">{prerequisiteLinks[f].label} (new tab)</Link></li>)}</ul><p>After saving the missing records, refresh the choices here and select them.</p><button type="button" disabled={busy||loading||authExpired} onClick={load}>{loading?'Refreshing choices...':'Refresh choices'}</button></div>}
    {section==='agreements'&&<p>Choose the exact agreement you reviewed. Similar names do not establish a client identity. Linking never changes its scope, signature or payment details.</p>}
    {fields[section].map((f,index)=><label key={f} htmlFor={'workspace-'+f}><span>{labels[f]}</span>{f.endsWith('_id')?<select aria-label={labels[f]} id={'workspace-'+f} required value={form[f]} disabled={busy||!data[relation(f)].length} onChange={e=>setForm({...form,[f]:e.target.value})}><option value="">{data[relation(f)].length?'Choose '+labels[f].toLowerCase():'No saved '+labels[f].toLowerCase()+' available'}</option>{data[relation(f)].map(r=><option key={r.id} value={r.id}>{r.name||r.title||'Untitled agreement'}{f==='agreement_id'?' · '+(r.client_name||'Client not set')+' · '+r.id.slice(0,8):''}</option>)}</select>:f==='status'?<select aria-label={labels[f]} id={'workspace-'+f} value={form[f]} disabled={busy} onChange={e=>setForm({...form,[f]:e.target.value})}>{(section==='projects'?['active','archived']:['open','done']).map(s=><option key={s}>{s}</option>)}</select>:f==='notes'?<textarea id={'workspace-'+f} maxLength={4000} rows={3} value={form[f]} disabled={busy} onChange={e=>setForm({...form,[f]:e.target.value})}/>:<input id={'workspace-'+f} ref={index===0?firstField:undefined} type={f==='phone'?'tel':f==='email'?'email':f==='due_date'?'date':f==='position'?'number':'text'} required={['name','title','position'].includes(f)} maxLength={f==='phone'?80:f==='email'?254:section==='stages'?80:160} min={f==='position'?0:undefined} max={f==='position'?999:undefined} value={form[f]} disabled={busy} onChange={e=>setForm({...form,[f]:f==='position'?Number(e.target.value):e.target.value})}/>}</label>)}
    <div className="suite-actions"><button className="suite-primary" disabled={busy||uncertain||authExpired||conflict||loading||missingRelations.length>0}>{busy?'Saving…':'Save'}</button><button type="button" disabled={busy} onClick={()=>{setForm(null);setEditing(null);heading.current?.focus();}}>Cancel</button></div>
   </form>}
   {section==='projects'&&view==='pipeline'&&<section className="project-board" aria-label="Project pipeline">{!data.stages.length&&!rows.length&&<div className="suite-empty"><h2>Build your first pipeline</h2><p>Start with stages such as Inquiry, Proposal and In progress.</p><Link href="/workspace/stages">Set up stages</Link></div>}{[...data.stages].sort((a,b)=>a.position-b.position).concat(rows.some(p=>!data.stages.some(s=>s.id===p.stage_id))?[{id:'unavailable',name:'Stage unavailable'}]:[]).map(stage=>{const projects=rows.filter(p=>stage.id==='unavailable'?!data.stages.some(s=>s.id===p.stage_id):p.stage_id===stage.id);return <section className="project-lane" key={stage.id} aria-label={stage.name}><header><h2>{stage.name}</h2><span>{projects.length}</span></header>{!projects.length&&<p className="lane-empty">No matching projects in this stage.</p>}{projects.map(project=>{const tasks=data.tasks.filter(t=>t.project_id===project.id),next=taskNextAction(tasks as any);return <article className="project-tile" key={project.id}><p className="suite-eyebrow">{project.status}</p><h3><Link href={'/workspace/projects?project='+project.id}>{project.name}</Link></h3><Link href={'/workspace/clients?client='+project.client_id}>{name('clients',project.client_id)}</Link><p className="suite-next">{next?next.title:'Choose your next step'}{next?.due_date&&<small>Due {next.due_date}</small>}</p><p>{tasks.filter(t=>t.status==='done').length}/{tasks.length} tasks complete</p><div className="suite-actions"><Link href={'/workspace/tasks?project='+project.id}>Tasks</Link><Link href={'/workspace/agreements?project='+project.id}>Agreements</Link><button disabled={busy||!!form||authExpired||conflict||uncertain||loading} onClick={()=>start(project)} aria-label={'Edit '+project.name}>Edit project</button></div></article>})}</section>})}</section>}
   {!(section==='projects'&&view==='pipeline')&&(!rows.length?taskAddress?null:<section className="suite-empty"><h2>{search||projectFilter||clientFilter?'No matching records':'No '+titles[section].toLowerCase()+' yet'}</h2><p>{section==='clients'?'Start with a client you know. Existing agreement names are not imported automatically.':section==='stages'?'Create your pipeline stages, such as Inquiry, Proposal and In progress.':section==='projects'?'Create a project after adding a client and a pipeline stage.':section==='tasks'?'Add a task to a saved project to make the next action clear.':'Link an existing agreement to the project it belongs to.'}</p></section>:<ul className="suite-records">{(view==='pipeline'&&section==='projects'?[...rows].sort((a,b)=>(data.stages.find(s=>s.id===a.stage_id)?.position||0)-(data.stages.find(s=>s.id===b.stage_id)?.position||0)):rows).map(row=>{
    const next=section==='projects'?taskNextAction(data.tasks.filter(t=>t.project_id===row.id) as any):null;
    const linked=section==='projects'?data.agreements.filter(a=>a.project_id===row.id):[];
    return <li className="suite-card" key={row.id}><div>{view==='pipeline'&&section==='projects'&&<p className="suite-eyebrow">{name('stages',row.stage_id)}</p>}<h2 ref={taskAddress?taskHeading:undefined} tabIndex={taskAddress?-1:undefined}>{row.name||row.title||name('available-agreements',row.agreement_id)}</h2>
     {section==='clients'&&<><div className="suite-account-actions"><Link href={'/workspace/clients?client='+row.id}>Open customer</Link><Link href={'/workspace/projects?client='+row.id}>Projects for this customer</Link></div><div className="client-contact-header"><p><strong>Email: </strong>{row.email?<a href={'mailto:'+row.email}>{row.email}</a>:'Not added'}</p><p><strong>Phone: </strong>{row.phone?<a href={'tel:'+row.phone.replace(/[^+0-9]/g,'')}>{row.phone}</a>:'Not added'}</p></div><p>{limited?'At least ':''}{data.projects.filter(p=>p.client_id===row.id).length} linked projects</p><ul>{data.projects.filter(p=>p.client_id===row.id).map(p=><li key={p.id}><Link href={'/workspace/projects?project='+p.id}>{p.name}</Link></li>)}</ul></>}
     {section==='stages'&&<p>Order {row.position} · {limited?'At least ':''}{data.projects.filter(p=>p.stage_id===row.id).length} projects</p>}
     {section==='projects'&&<><p><Link href={'/workspace/clients?client='+row.client_id}>{name('clients',row.client_id)}</Link> · <strong>{name('stages',row.stage_id)}</strong> · {row.status}</p><p className="suite-next">{limited?'Next in loaded tasks: ':'Next: '}{next?next.title+(next.due_date?' · '+next.due_date:''):'Add a task or review your agreements'}</p><Link href={'/workspace/tasks?project='+row.id}>Manage tasks</Link><ul>{linked.map(a=><li key={a.id}><Link href={'/sow/'+a.agreement_id}>{name('available-agreements',a.agreement_id)}</Link></li>)}</ul>{!linked.length&&<p>No agreement linked. <Link href={'/workspace/agreements?project='+row.id}>Link an agreement</Link></p>}</>}
     {section==='tasks'&&<><p>{name('projects',row.project_id)} · {row.status}</p><p>{row.due_date?'Due '+row.due_date:'No due date'}</p></>}
     {section==='agreements'&&<><p>{name('projects',row.project_id)}</p><Link href={'/sow/'+row.agreement_id}>Review agreement</Link></>}
     {row.notes&&<p className="suite-notes">{row.notes}</p>}{section==='clients'&&owner.current&&<ClientTimeline key={owner.current+row.id} clientId={row.id} clientName={row.name} ownerId={owner.current} drafts={timelineDrafts.current} initiallyOpen={clientFilter===row.id}/>}</div><div className="suite-actions"><button disabled={busy||!!form||authExpired||conflict||uncertain||loading} onClick={()=>start(row)} aria-label={'Edit '+(row.name||row.title||'agreement link')}>Edit</button>{section==='tasks'&&<button disabled={busy||!!form||authExpired||conflict||uncertain||loading} onClick={()=>mutate('PATCH',{status:row.status==='done'?'open':'done'},row.id)}>{row.status==='done'?'Reopen':'Complete'}</button>}<button disabled={busy||!!form||authExpired||conflict||uncertain||loading} onClick={()=>setDeleteId(row.id)} aria-label={'Delete '+(row.name||row.title||'agreement link')}>{section==='agreements'?'Unlink':'Delete'}</button></div>
     {deleteId===row.id&&<div className="suite-confirm" role="group" aria-label="Confirm deletion"><p>{section==='agreements'?'Remove this link? The agreement itself is kept.':'Delete this record? Remove its dependent links first. This cannot be undone.'}</p><button disabled={busy||authExpired||conflict||uncertain||loading} onClick={()=>mutate('DELETE',{},row.id)}>Confirm {section==='agreements'?'unlink':'delete'}</button><button disabled={busy} onClick={()=>setDeleteId('')}>Keep record</button></div>}
    </li>;})}</ul>)}
  </>}
 </div></div>;
}
