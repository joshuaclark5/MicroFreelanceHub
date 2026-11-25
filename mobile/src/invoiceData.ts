import type {SupabaseClient} from '@supabase/supabase-js';
import {documentInput, mutationInput, totalMinor, uuid, type InvoiceDocument} from '../../app/lib/workspaceInvoices';
import {parseMajorToMinor} from '../../app/lib/workspacePresentation';

export type Invoice = {id:string;owner_id:string;client_id:string;project_id:string|null;version:number;status:'draft'|'issued'|'void';number:number|null;document:InvoiceDocument;total_minor:number;snapshot:Record<string,unknown>|null};
export type InvoiceRef = {id:string;owner_id:string;name:string;client_id?:string};
export type Page<T> = {rows:T[];next:string|null};
export type DraftForm = Omit<InvoiceDocument,'lines'> & {lines:{description:string;quantity:string;price:string}[]};
export type DraftOperation = {action:'create';operationId:string;expectedActorId:string;document:InvoiceDocument};
const columns='id,owner_id,client_id,project_id,version,status,number,document,total_minor,snapshot';

export class InvoiceAccountChanged extends Error {}
async function actorCheck(db:SupabaseClient,actor:string){
 if(!uuid(actor))throw Error('Invalid invoice account.');
 const {data,error}=await db.auth.getUser();
 if(error)throw Error('Your invoice account could not be verified. Check your connection and retry.');
 if(!data||!('user' in data))throw Error('Your invoice account could not be verified. Check your connection and retry.');
 if(data.user?.id!==actor)throw new InvoiceAccountChanged('Your invoice account changed. Return to the original account before viewing or retrying this draft.');
}
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const sameDocument=(a:InvoiceDocument,b:InvoiceDocument)=>a.clientId===b.clientId&&a.projectId===b.projectId&&a.seller===b.seller&&a.currency===b.currency&&a.issueDate===b.issueDate&&a.dueDate===b.dueDate&&a.memo===b.memo&&a.lines.length===b.lines.length&&a.lines.every((l,i)=>l.description===b.lines[i].description&&l.quantity===b.lines[i].quantity&&l.unitMinor===b.lines[i].unitMinor);
export function validInvoice(row:unknown,actor:string):row is Invoice {
 if(!object(row)||!uuid(row.id)||row.owner_id!==actor||!Number.isSafeInteger(row.version)||Number(row.version)<1||!['draft','issued','void'].includes(String(row.status)))return false;
 try {
  const d=documentInput(row.document);
  if(row.client_id!==d.clientId||row.project_id!==d.projectId||row.total_minor!==totalMinor(d))return false;
  if(row.status==='draft')return row.number===null&&row.snapshot===null;
  const snapshot=row.snapshot;
  if(!Number.isSafeInteger(row.number)||Number(row.number)<1||!object(snapshot)||snapshot.number!==row.number||snapshot.totalMinor!==row.total_minor||!object(snapshot.clientSnapshot)||typeof snapshot.clientSnapshot.name!=='string'||snapshot.clientSnapshot.name.length>160||typeof snapshot.clientSnapshot.email!=='string'||snapshot.clientSnapshot.email.length>254||typeof snapshot.issuedAt!=='string'||!Number.isFinite(Date.parse(snapshot.issuedAt)))return false;
  const {clientSnapshot,totalMinor:unusedTotal,number:unusedNumber,issuedAt,...details}=snapshot;
  return sameDocument(documentInput(details),d);
 }catch{return false;}
}
function checkedPage<T>(data:unknown,count:number|null,after:string|null,valid:(r:unknown)=>r is T):Page<T>{
 if(!Array.isArray(data)||!data.every(valid)||!Number.isSafeInteger(count)||Number(count)<data.length||(Number(count)>data.length&&data.length<101)||data.length>101)throw Error('The complete invoice page could not be verified. Refresh and retry.');
 const ids=data.map(r=>(r as {id:string}).id);
 if(ids.some((id,i)=>id<=(i?ids[i-1]:after||'')))throw Error('Invoice ordering could not be verified. Refresh and retry.');
 return {rows:data.slice(0,100),next:data.length>100?ids[99]:null};
}
export async function loadInvoices(db:SupabaseClient,actor:string,after:string|null=null):Promise<Page<Invoice>>{
 if(after&&!uuid(after))throw Error('Invalid invoice cursor.');
 await actorCheck(db,actor);
 let q=db.from('workspace_invoice_drafts').select(columns,{count:'exact'}).eq('owner_id',actor).order('id',{ascending:true}).limit(101);
 if(after)q=q.gt('id',after);
 const {data,error,count}=await q;
 await actorCheck(db,actor);
 if(error)throw Error('Invoices could not be loaded. Check your connection and retry.');
 return checkedPage(data,count,after,(r):r is Invoice=>validInvoice(r,actor));
}
export async function loadInvoiceRefs(db:SupabaseClient,actor:string,kind:'clients'|'projects',after:string|null=null):Promise<Page<InvoiceRef>>{
 if(!['clients','projects'].includes(kind)||(after&&!uuid(after)))throw Error('Invalid invoice reference request.');
 await actorCheck(db,actor);
 let q=db.from('workspace_'+kind).select(kind==='clients'?'id,owner_id,name':'id,owner_id,name,client_id',{count:'exact'}).eq('owner_id',actor).order('id',{ascending:true}).limit(101);
 if(after)q=q.gt('id',after);
 const {data,error,count}=await q;
 await actorCheck(db,actor);
 if(error)throw Error('Clients and projects could not be loaded. Refresh and retry.');
 return checkedPage(data,count,after,(r):r is InvoiceRef=>object(r)&&uuid(r.id)&&r.owner_id===actor&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=160&&(kind==='clients'||uuid(r.client_id)));
}
export function freshInvoice(now=new Date()):DraftForm{
 const date=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 return {clientId:'',projectId:null,seller:'',currency:'USD',issueDate:date,dueDate:date,memo:'',lines:[{description:'',quantity:'1',price:''}]};
}
export function prepareInvoiceDraft(actor:string,operationId:string,form:DraftForm):DraftOperation{
 const document=documentInput({...form,lines:form.lines.map(l=>{
  if(!/^[1-9][0-9]{0,4}$/.test(l.quantity))throw Error('Use whole quantities from 1 to 10,000.');
  return {description:l.description,quantity:Number(l.quantity),unitMinor:parseMajorToMinor(l.price,form.currency)};
 })});
 const op=mutationInput({action:'create',operationId,expectedActorId:actor,document}) as DraftOperation;
 // The reviewed payload is independent from the editable form and stays fixed
 // after an uncertain response; the RPC durably deduplicates this identity.
 const copy=JSON.parse(JSON.stringify(op)) as DraftOperation;
 copy.document.lines.forEach(Object.freeze);Object.freeze(copy.document.lines);Object.freeze(copy.document);return Object.freeze(copy);
}
export async function createInvoiceDraft(db:SupabaseClient,op:DraftOperation):Promise<Invoice>{
 mutationInput(op);if(op.action!=='create')throw Error('This screen creates drafts only.');
 await actorCheck(db,op.expectedActorId);
 const {data,error}=await db.rpc('workspace_invoice_mutate',{p:op});
 await actorCheck(db,op.expectedActorId);
 if(error||!validInvoice(data,op.expectedActorId)||data.status!=='draft'||data.version!==1||!sameDocument(data.document,op.document))throw Error('Draft save was not confirmed. Retry the same operation; it may already be saved. Client and project relationships must still be valid.');
 return data;
}

// Stored/AI-authored text is not marketing approval. Keep the original record
// unchanged while making the native read surface neutral.
export function invoiceText(value:string):string{
 return value.replace(/legal(?:ly)?\s+(?:binding\s+)?protection|protect\s+(?:yourself|you)\s+legally/gi,'clear business terms')
  .replace(/guarantee(?:d|s)?\s+payments?|force[sd]?\s+payments?/gi,'payment details')
  .replace(/limit(?:s|ed|ing)?\s+(?:your\s+)?liability|prevent(?:s|ing)?\s+lawsuits?/gi,'clarify responsibilities')
  .replace(/legally\s+binding|enforceable\s+contracts?/gi,'business agreement');
}
