import {validId} from './connectedWorkspace';
export type CalendarTask={id:string;title:string;due_date:string|null;status:'open'|'done'};
export async function loadCalendarTasks(actorId:string,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<CalendarTask[]>{
 if(!validId(actorId))throw Error('Reload your calendar before loading tasks.');
 const records:CalendarTask[]=[],seen=new Set<string>();let after='';
 for(let page=0;page<10;page++){
  const response=await fetcher('/api/workspace/tasks?limit=200'+(after?'&after='+encodeURIComponent(after):''),{cache:'no-store',headers:{'x-workspace-owner':actorId},signal});
  const body=await response.json();
  if(!response.ok)throw Error(response.status===409?'Account changed. Reload your calendar before viewing tasks.':'Tasks could not be loaded. Your calendar bookings are unchanged.');
  if(body.ownerId!==actorId)throw Error('Account changed. Reload your calendar before viewing tasks.');
  if(!Array.isArray(body.records)||typeof body.hasMore!=='boolean'||body.complete!==!body.hasMore)throw Error('Task completeness could not be verified. Open Tasks or retry.');
  for(const row of body.records){
   if(!validId(row.id)||seen.has(row.id)||typeof row.title!=='string'||!['open','done'].includes(row.status)||(row.due_date!==null&&(typeof row.due_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.due_date))))throw Error('Task records could not be verified. Open Tasks or retry.');
   seen.add(row.id);records.push({id:row.id,title:row.title,due_date:row.due_date,status:row.status});
  }
  if(!body.hasMore)return records.filter(r=>r.status==='open').sort((a,b)=>(a.due_date||'9999-99-99').localeCompare(b.due_date||'9999-99-99')||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
  if(!body.records.length||body.nextCursor!==body.records[body.records.length-1].id||body.nextCursor===after)throw Error('Task page could not be verified. Open Tasks or retry.');
  after=body.nextCursor;
 }
 throw Error("The task queue exceeds this view's loading limit. Open Tasks to browse it; a partial due-next list is not shown.");
}
