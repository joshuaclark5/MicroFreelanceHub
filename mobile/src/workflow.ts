import type { SupabaseClient } from '@supabase/supabase-js';
import { timeInput } from '../../app/lib/workspaceTime';

export type Project = {id:string;name:string;status:string};
export type Entry = {id:string;project_id:string;description:string;seconds:number|null;started_at:string};
export async function verifyActor(db:SupabaseClient, expectedActorId:string) {
  let result;
  try { result=await db.auth.getUser(); }
  catch { throw Error('Could not verify your session. Check your connection and retry the same entry. An earlier save may already have succeeded.'); }
  if(!result || typeof result!=='object' || Array.isArray(result) || !result.data || typeof result.data!=='object' || Array.isArray(result.data) || !('user' in result.data)) throw Error('Could not verify your session. Check your connection and retry the same entry. An earlier save may already have succeeded.');
  const {data:{user},error}=result;
  if(error) throw Error('Could not verify your session. Check your connection and retry the same entry. An earlier save may already have succeeded.');
  if(!user || user.id!==expectedActorId) throw Error('Your session changed. Sign in to the original account and check its latest entries before creating another. An earlier save may already have succeeded.');
}
export async function loadWork(db:SupabaseClient, actor:string) {
  await verifyActor(db,actor);
  try {
    const [projects,entries]=await Promise.all([
      db.from('workspace_projects').select('id,name,status').eq('owner_id',actor).eq('status','active').order('name').limit(201),
      db.from('workspace_time_entries').select('id,project_id,description,seconds,started_at').eq('owner_id',actor).not('stopped_at','is',null).order('started_at',{ascending:false}).limit(20)
    ]);
    if(!projects || !entries || projects.error || entries.error || !Array.isArray(projects.data) || !Array.isArray(entries.data) || !projects.data.every(validProject) || !entries.data.every(validEntry)) throw Error('Could not load your work. Check your connection and retry.');
    return {projects:projects.data.slice(0,200) as Project[],projectsTruncated:projects.data.length>200,entries:entries.data as Entry[]};
  } catch {
    throw Error('Could not load your work. Check your connection and retry.');
  }
}
export function manualTime(actor:string,operationId:string,projectId:string,minutes:string,description:string,now:number) {
  if(!/^[1-9][0-9]{0,3}$/.test(minutes) || Number(minutes)>1440) throw Error('Enter 1 to 1440 whole minutes.');
  const seconds=Number(minutes)*60;
  // Explicitly nonbillable: this capture never creates an invoice or charge.
  return timeInput({action:'manual',operationId,expectedActorId:actor,projectId,description,billable:false,rateMinor:0,currency:'USD',startedAt:new Date(Math.floor(now/1000)*1000-seconds*1000).toISOString().replace('.000Z','Z'),seconds});
}
export async function saveTime(db:SupabaseClient,payload:Record<string,unknown>) {
  const validated=timeInput(payload);
  await verifyActor(db,String(validated.expectedActorId));
  // A transport success alone is not a saved-entry receipt. Keep the same
  // operation ID until the returned row matches the reviewed manual entry.
  try {
    const {data,error}=await db.rpc('workspace_time_mutate',{payload:validated});
    if(error || !confirmedTimeReceipt(data,validated)) throw Error('unconfirmed');
    return data;
  } catch {
    throw Error('Save was not confirmed. Retry this same entry to recover it safely. An earlier save may already have succeeded.');
  }
}

export function confirmedTimeReceipt(row:unknown,payload:Record<string,unknown>):boolean {
  if(!row || typeof row!=='object' || Array.isArray(row))return false;
  const receipt=row as Record<string,unknown>;
  const start=Date.parse(String(receipt.started_at));
  const end=Date.parse(String(receipt.stopped_at));
  return payload.action==='manual' && typeof receipt.id==='string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.id)
    && receipt.owner_id===payload.expectedActorId && receipt.project_id===payload.projectId
    && receipt.source==='manual' && receipt.description===payload.description
    && receipt.seconds===payload.seconds && receipt.billable===payload.billable
    && receipt.rate_minor===payload.rateMinor && receipt.currency===payload.currency
    && Number.isFinite(start) && start===Date.parse(String(payload.startedAt))
    && Number.isFinite(end) && end-start===Number(payload.seconds)*1000;
}

// Reject malformed rows before UI filtering/formatting; callers retain prior data.
export function validProject(row:unknown):row is Project {
  if(!row || typeof row!=='object')return false;
  const p=row as Project;
  return typeof p.id==='string' && p.id.length>0 && typeof p.name==='string' && p.status==='active';
}
export function validEntry(row:unknown):row is Entry {
  if(!row || typeof row!=='object')return false;
  const e=row as Entry;
  return typeof e.id==='string' && e.id.length>0 && typeof e.project_id==='string'
    && typeof e.description==='string' && typeof e.started_at==='string'
    && Number.isFinite(Date.parse(e.started_at))
    && typeof e.seconds==='number' && Number.isSafeInteger(e.seconds) && e.seconds>=0;
}
