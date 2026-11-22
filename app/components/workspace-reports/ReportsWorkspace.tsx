'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ReportKind,ReportRow,summarizeReports,reportMoney,reportDuration,reportPeriod,ReportPeriod,reportInput} from '../../lib/workspaceReports';
import './reports.css';
import WorkspaceNav from '../WorkspaceNav';
import '../workspace-editorial.css';
type Data={actorId:string;records:ReportRow[];count:number|null;proven:boolean;complete:boolean;nextCursor:string|null;readAt:string;consistency:string};
const status=(s:string)=>s==='self_approved'?'Self-approved':s==='draft'?'Draft':s==='issued'?'Issued':s==='void'?'Void':'Running';
export default function ReportsWorkspace(){
 const [kind,setKind]=useState<ReportKind>('invoices'),[from,setFrom]=useState(''),[to,setTo]=useState('');
 const [data,setData]=useState<Data|null>(null),[rows,setRows]=useState<ReportRow[]>([]),[total,setTotal]=useState<number|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[signedOut,setSignedOut]=useState(false),[exporting,setExporting]=useState(false);
 const actor=useRef<string|null>(null),seq=useRef(0),downloadSeq=useRef(0);
 let dateError='';try{if(!from||!to)throw Error('Choose both a start and end date.');reportInput(new URLSearchParams({kind,from,to}));}catch(e){dateError=(e as Error).message;}
 const params=()=>new URLSearchParams({kind,from,to,...(actor.current?{expectedActorId:actor.current}:{})});
 async function load(more=false){
  const id=++seq.current;downloadSeq.current++;setExporting(false);setLoading(true);setError('');setSignedOut(false);
  if(dateError){setLoading(false);setData(null);setRows([]);setTotal(null);return;}
  const p=params();if(more&&data?.nextCursor)p.set('after',data.nextCursor);else{setRows([]);setData(null);setTotal(null);}
  try{const response=await fetch('/api/workspace-reports?'+p,{cache:'no-store'}),r:Data&{error?:string}=await response.json();if(id!==seq.current)return;
   if(response.status===401)setSignedOut(true);if(!response.ok)throw Error(r.error||'Could not load reports.');
   if(actor.current&&actor.current!==r.actorId)throw Error('Account changed. Reload this page to start a report for the current account.');
   if(!r.actorId||!Array.isArray(r.records))throw Error('Report response incomplete. Try again.');actor.current=r.actorId;
   if(more&&(total===null||r.count===null||total!==rows.length+r.count))throw Error('Records changed or counts are missing. Reload the report; totals are withheld.');
   const next=more?[...rows,...r.records]:r.records;if(new Set(next.map(x=>x.id)).size!==next.length)throw Error('Records changed. Reload the report.');
   if(!more)setTotal(r.count);setRows(next);setData(r);
  }catch(e){if(id===seq.current){setData(null);setRows([]);setTotal(null);setError((e as Error).message);}}finally{if(id===seq.current)setLoading(false);}
 }
 function choosePeriod(period:ReportPeriod){const range=reportPeriod(period);setFrom(range.from);setTo(range.to);}
 useEffect(()=>{choosePeriod('month');},[]);
 useEffect(()=>{void load();return()=>{seq.current++;downloadSeq.current++;};},[kind,from,to]); // Each filter change replaces the previous result.
 async function download(){
  if(dateError)return;
  const id=++downloadSeq.current;setExporting(true);setError('');
  try{const p=params();p.set('format','csv');const response=await fetch('/api/workspace-reports?'+p,{cache:'no-store'});if(!response.ok){const r=await response.json();throw Error(r.error||'Export unavailable.');}const blob=await response.blob();if(id!==downloadSeq.current)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='workspace-'+kind+'-'+from+'-'+to+'.csv';a.click();URL.revokeObjectURL(url);}catch(e){if(id===downloadSeq.current)setError((e as Error).message);}finally{if(id===downloadSeq.current)setExporting(false);}
 }
 const complete=!!data?.proven&&data.complete&&total===rows.length,groups=complete?summarizeReports(rows):[];
 return <div className="editorial-shell"><WorkspaceNav active="reports"/><div className="wr-shell"><header className="wr-heading"><p className="wr-eyebrow">Workspace / Reports</p><h1>A clearer view<br/><em>of your work.</em></h1><p>Read the invoices and time you have recorded. No estimates passed off as income.</p></header>
 <section className="wr-panel" aria-labelledby="report-controls"><h2 id="report-controls">Choose your view</h2><div className="wr-filters"><label>Report<select aria-label="Report" value={kind} onChange={e=>setKind(e.target.value as ReportKind)}><option value="invoices">Invoice face value</option><option value="time">Recorded time</option></select></label><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Through<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><button onClick={()=>void load()} disabled={loading||!!dateError}>Reload report</button></div>
 <div className="wr-periods" role="group" aria-label="Quick date ranges"><button onClick={()=>choosePeriod('month')}>This month</button><button onClick={()=>choosePeriod('previous-month')}>Last month</button><button onClick={()=>choosePeriod('30-days')}>Last 30 days</button></div><p className="wr-note">Quick ranges use today in UTC. This month and last 30 days include today; last month is the full previous calendar month. You can also choose custom dates above.</p>
 <p className="wr-note">{kind==='invoices'?'Grouped by current draft, issued and void status, in each original currency. Dates use the invoice issue date. Face value is not payments, outstanding balance or revenue.':'Completed work grouped by review status, billability and recorded currency. Whole entries belong to their UTC start date, including work crossing midnight. Running timers have no recorded duration and are excluded from hours.'}</p></section>
 {dateError&&<p role="alert" className="wr-error">{dateError}</p>}
 {loading&&<p role="status">Loading recorded work…</p>}{error&&<div role="alert" className="wr-error">{error}{signedOut&&<> <Link href="/login">Sign in</Link></>}</div>}
 {data&&!dateError&&<><section className="wr-panel" aria-labelledby="summary-title"><div className="wr-section-heading"><div><p className="wr-eyebrow">{from} — {to}</p><h2 id="summary-title">{kind==='invoices'?'Invoice face value':'Recorded hours'}</h2></div><button onClick={()=>void download()} disabled={!data.proven||loading||exporting}>{exporting?'Preparing CSV…':'Export complete period CSV'}</button></div>
 <p className="wr-note">{rows.length} records loaded{total!==null?' of '+total:'. Total count unavailable'}. Read at {data.readAt.replace('T',' ').slice(0,19)} UTC.</p>
 {!complete?<p role="status" className="wr-warning">Summary withheld: {data.proven?'load the remaining records to verify the full period.':'the record count could not be verified. Reload to try again.'}</p>:rows.length===0?<p>No recorded {kind==='invoices'?'invoices':'time'} in this period. Try different dates or add a record in the linked workspace.</p>:<div className="wr-cards">{groups.map(g=><article key={[g.currency,g.status,g.billable].join(':')} className="wr-card"><p>{status(g.status)}{g.billable!==null?' · '+(g.billable?'Billable':'Nonbillable'):''} · {g.currency}</p><h3>{g.amountMinor!==null?reportMoney(g.amountMinor,g.currency):g.seconds!==null?reportDuration(g.seconds):'Duration not recorded'}</h3><p>{g.count} {g.count===1?'record':'records'}</p></article>)}</div>}
 <p className="wr-note">{data.consistency} CSV is a file export, not an accounting connection. No payments, costs, refunds, tax or invoice allocation are inferred.</p></section>
 <section className="wr-panel" aria-labelledby="details-title"><h2 id="details-title">The records behind the numbers</h2><ul className="wr-records">{rows.map(r=><li key={r.id}><div><h3>{r.label}</h3><p>{r.date.replace('T',' ').replace('Z',' UTC')} · {status(r.status)}{r.billable!==null?' · '+(r.billable?'Billable':'Nonbillable'):''}</p><p className="wr-record-id">Record {r.id}{r.projectId?' · Project '+r.projectId:''}</p></div><strong>{r.amountMinor!==null?reportMoney(r.amountMinor,r.currency):r.seconds!==null?reportDuration(r.seconds):'Running — excluded'}</strong></li>)}</ul>{data.nextCursor&&<button onClick={()=>void load(true)} disabled={loading}>Load more records</button>}</section></>}
 </div></div>;
}
