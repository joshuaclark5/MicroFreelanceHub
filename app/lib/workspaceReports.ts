// Recorded workspace summaries only: no payment, revenue, aging or profitability inference.
export type ReportKind = 'invoices' | 'time';
export type ReportRow = {id:string; date:string; status:string; currency:string; amountMinor:string|null; seconds:number|null; billable:boolean|null; label:string; projectId:string|null};
export type ReportGroup = {currency:string; status:string; billable:boolean|null; count:number; amountMinor:string|null; seconds:number|null};
export const reportTables = {invoices:'workspace_invoice_drafts',time:'workspace_time_entries'} as const;
export const reportColumns = {invoices:'id,project_id,status,number,document,snapshot,total_minor',time:'id,project_id,description,started_at,stopped_at,seconds,billable,currency,review_status'} as const;
const currencies=['USD','EUR','GBP','CAD','AUD','JPY','KWD'];
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function reportInput(p:URLSearchParams){
 const allowed=['kind','after','from','to','expectedActorId','format'];
 if([...p.keys()].some(k=>!allowed.includes(k)||p.getAll(k).length!==1))throw Error('Unsupported report filter.');
 const kind=p.get('kind')||'invoices',after=p.get('after'),actor=p.get('expectedActorId'),format=p.get('format')||'json';
 if(!['invoices','time'].includes(kind)||!['json','csv'].includes(format)||(after&&!uuid(after))||(actor&&!uuid(actor)))throw Error('Invalid report request.');
 if(after&&!actor)throw Error('Reload the report before continuing.');
 if(format==='csv'&&after)throw Error('Exports always read the full selected period.');
 const from=p.get('from')||new Date().toISOString().slice(0,7)+'-01',to=p.get('to')||new Date().toISOString().slice(0,10);
 for(const d of [from,to])if(!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('Choose valid dates in 2000–2099.');
 if(from>to)throw Error('End date must be on or after start date.');
 return {kind:kind as ReportKind,after,actor,format,from,to,end:new Date(Date.parse(to)+86400000).toISOString()};
}
function integer(v:unknown,max:bigint){if((typeof v!=='string'&&typeof v!=='number')||!/^\d+$/.test(String(v))||(typeof v==='number'&&!Number.isSafeInteger(v)))throw Error('Invalid recorded amount.');const n=BigInt(v);if(n>max)throw Error('Invalid recorded amount.');return n.toString();}
export function reportRow(kind:ReportKind,r:Record<string,any>):ReportRow{
 if(typeof r.id!=='string'||!uuid(r.id)||(r.project_id!==null&&(typeof r.project_id!=='string'||!uuid(r.project_id))))throw Error('Invalid record.');
 if(kind==='invoices'){
  if(!['draft','issued','void'].includes(r.status))throw Error('Unknown invoice state.');
  // Issued and void documents retain the immutable snapshot; drafts use the current document.
  const d=r.status==='draft'?r.document:r.snapshot;
  if(!d||!currencies.includes(d.currency)||typeof d.issueDate!=='string'||!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(d.issueDate)||!Number.isFinite(Date.parse(d.issueDate))||new Date(d.issueDate).toISOString().slice(0,10)!==d.issueDate)throw Error('Incomplete invoice.');
  if(r.status==='draft'?r.number!==null:r.number===null||integer(r.number,BigInt(Number.MAX_SAFE_INTEGER))==='0')throw Error('Incomplete invoice number.');
  const amount=integer(r.total_minor,BigInt(100000000000));
  if(r.status!=='draft'&&integer(d.totalMinor,BigInt(100000000000))!==amount)throw Error('Inconsistent invoice snapshot.');
  return {id:r.id,date:d.issueDate,status:r.status,currency:d.currency,amountMinor:amount,seconds:null,billable:null,label:r.number===null?'Draft invoice':'Invoice #'+r.number,projectId:r.project_id};
 }
 if(!currencies.includes(r.currency)||!['draft','self_approved'].includes(r.review_status)||typeof r.description!=='string'||typeof r.billable!=='boolean'||typeof r.started_at!=='string')throw Error('Incomplete time record.');
 if(!Number.isFinite(Date.parse(r.started_at))||(r.stopped_at!==null&&(typeof r.stopped_at!=='string'||!Number.isFinite(Date.parse(r.stopped_at)))))throw Error('Incomplete time dates.');
 const running=r.stopped_at===null;
 if(running&&r.seconds!==null)throw Error('Incomplete running duration.');
 if(!running&&(!Number.isInteger(r.seconds)||r.seconds<1||r.seconds>2678400))throw Error('Invalid recorded duration.');
 return {id:r.id,date:r.started_at,status:running?'running':r.review_status,currency:r.currency,amountMinor:null,seconds:running?null:r.seconds,billable:r.billable,label:r.description||'Recorded time',projectId:r.project_id};
}
export function summarizeReports(rows:ReportRow[]):ReportGroup[]{
 const groups=new Map<string,ReportGroup>();
 for(const r of rows){const key=[r.currency,r.status,r.billable].join(':');const g=groups.get(key)||{currency:r.currency,status:r.status,billable:r.billable,count:0,amountMinor:r.amountMinor===null?null:'0',seconds:r.seconds===null?null:0};g.count++;if(r.amountMinor!==null)g.amountMinor=(BigInt(g.amountMinor!)+BigInt(r.amountMinor)).toString();if(r.seconds!==null)g.seconds!+=r.seconds;groups.set(key,g);}
 return [...groups.values()].sort((a,b)=>[a.currency,a.status,a.billable].join(':').localeCompare([b.currency,b.status,b.billable].join(':')));
}
export function decimalMoney(value:string|number,currency:string){const d=currency==='JPY'?0:currency==='KWD'?3:2,n=BigInt(value),s=n.toString().padStart(d+1,'0');return d?s.slice(0,-d)+'.'+s.slice(-d):s;}
// Local presentation equivalent; deliberately preserves large exact totals without Number conversion.
export const reportMoney=(value:string|number,currency:string)=>currency+' '+decimalMoney(value,currency);
export const reportDuration=(s:number)=>Math.floor(s/3600)+' hrs '+Math.floor(s%3600/60)+' mins'+(s%60?' '+s%60+' secs':'');
export function csvCell(value:unknown){const s=String(value??'');return '"'+(/^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';}
export function reportCsv(rows:ReportRow[],kind:ReportKind,from:string,to:string,readAt:string){
 const header=['record_id','recorded_date_utc_or_issue_date','status','description','project_id','currency','invoice_face_value_decimal','invoice_face_value_minor_units','recorded_seconds','billable','period_from','period_to_inclusive','read_at_utc','basis'];
 const basis=kind==='invoices'?'Current invoice status; face value only, not payments or revenue':'Whole record allocated to UTC start; running durations excluded; not invoiced hours';
 return [header,...rows.map(r=>[r.id,r.date,r.status,r.label,r.projectId,r.currency,r.amountMinor===null?'':decimalMoney(r.amountMinor,r.currency),r.amountMinor,r.seconds,r.billable===null?'':String(r.billable),from,to,readAt,basis])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
