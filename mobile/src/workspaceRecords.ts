import type {SupabaseClient} from '@supabase/supabase-js';
import {fields, validId, workspaceInput} from '../../app/lib/connectedWorkspace';
import {verifyActor} from './workflow';

export const recordSections = ['clients', 'stages', 'projects', 'tasks'] as const;
export type RecordSection = typeof recordSections[number];
export type WorkspaceRow = {id:string; owner_id:string; version:number; [key:string]:unknown};
export type RecordPage = {rows:WorkspaceRow[]; next:string|null};
export type RecordOperation = {section:RecordSection; actor:string; id:string; version:number|null; values:Record<string,unknown>; action:'create'|'update'|'delete'};
export class RecordConflict extends Error {}
const columns=(section:RecordSection)=>['id','owner_id','version',...fields[section]].join(',');
export function validRow(section:RecordSection, row:unknown, actor:string):row is WorkspaceRow {
 if(!row||typeof row!=='object'||Array.isArray(row))return false;
 const r=row as WorkspaceRow;
 if(!validId(r.id)||r.owner_id!==actor||!Number.isSafeInteger(r.version)||r.version<1)return false;
 try {workspaceInput(section,Object.fromEntries(fields[section].map(k=>[k,r[k]])));return true;}catch{return false;}
}
export async function loadRecordPage(db:SupabaseClient, section:RecordSection, actor:string, after:string|null=null):Promise<RecordPage> {
 if(!validId(actor)||(after&&!validId(after)))throw Error('Invalid workspace identity.');
 await verifyActor(db,actor);
 let query=db.from('workspace_'+section).select(columns(section),{count:'exact'}).eq('owner_id',actor).order('id',{ascending:true}).limit(101);
 if(after)query=query.gt('id',after);
 const {data,error,count}=await query;
 await verifyActor(db,actor);
 if(error||!Array.isArray(data)||!data.every(r=>validRow(section,r,actor)))throw Error('Could not load records. Try refreshing.');
 const rows=data as unknown as WorkspaceRow[];
 if(count===null||!Number.isSafeInteger(count)||count<rows.length||(count>rows.length&&rows.length<101))throw Error('Record completeness could not be verified. Refresh the list.');
 if(new Set(rows.map(r=>r.id)).size!==rows.length||rows.some((r,i)=>r.id<=(i?rows[i-1].id:after||'')))throw Error('Record order could not be verified. Refresh the list.');
 return {rows:rows.slice(0,100),next:rows.length>100?rows[99].id:null};
}
export function prepareRecord(section:RecordSection, actor:string, id:string, values:unknown, row:WorkspaceRow|null=null, remove=false):RecordOperation {
 if(!validId(actor)||!validId(id)||!recordSections.includes(section))throw Error('Invalid workspace identity.');
 if(row&&(!validRow(section,row,actor)||row.id!==id||row.version>=2147483647))throw Error('Reload the record before editing.');
 if(remove&&!row)throw Error('Choose an existing record.');
 return {section,actor,id,version:row?.version??null,values:remove?{}:workspaceInput(section,values,!!row),action:remove?'delete':row?'update':'create'};
}
async function readOperation(db:SupabaseClient, op:RecordOperation):Promise<WorkspaceRow|null> {
 const {data,error}=await db.from('workspace_'+op.section).select(columns(op.section)).eq('owner_id',op.actor).eq('id',op.id).maybeSingle();
 if(error||(data&&!validRow(op.section,data,op.actor)))throw Error('Could not check the previous save. Keep this draft and retry.');
 return data as WorkspaceRow|null;
}
const matches=(row:WorkspaceRow,op:RecordOperation)=>Object.entries(op.values).every(([key,value])=>row[key]===value);
// Keep this operation unchanged after an uncertain result. A create reuses its UUID;
// edits/deletes retain the original version. Never upsert over a newer record.
export async function saveRecord(db:SupabaseClient, op:RecordOperation, recovering=false):Promise<WorkspaceRow|null> {
 if(!recordSections.includes(op.section)||!validId(op.actor)||!validId(op.id)||!['create','update','delete'].includes(op.action))throw Error('Invalid operation.');
 if(op.action==='create'?op.version!==null:(!Number.isSafeInteger(op.version)||op.version!<1||op.version!>=2147483647))throw Error('Invalid record version.');
 if(op.action==='delete'){if(Object.keys(op.values).length)throw Error('Delete takes no fields.');}
 else workspaceInput(op.section,op.values,op.action==='update');
 await verifyActor(db,op.actor);
 if(recovering){
  const found=await readOperation(db,op);
  await verifyActor(db,op.actor);
  if(op.action==='delete'&&!found)return null;
  if(op.action!=='delete'&&found&&matches(found,op)&&found.version===(op.version===null?1:op.version+1))return found;
  if((op.action==='create'&&found)||(op.action!=='create'&&(!found||found.version!==op.version)))throw new RecordConflict('The record changed. Keep your draft, refresh and review the latest version before trying again.');
 }
 const table=db.from('workspace_'+op.section);
 const result=op.action==='create'
  ?await table.insert({...op.values,id:op.id,owner_id:op.actor}).select(columns(op.section)).single()
  :op.action==='update'
   ?await table.update(op.values).eq('owner_id',op.actor).eq('id',op.id).eq('version',op.version!).select(columns(op.section)).maybeSingle()
   :await table.delete().eq('owner_id',op.actor).eq('id',op.id).eq('version',op.version!).select('id').maybeSingle();
 await verifyActor(db,op.actor);
 if(result.error)throw Error('Save was not confirmed. Retry the same operation to check its result. Related records and your plan limits still apply.');
 if(!result.data)throw new RecordConflict('The record changed or was removed. Refresh and review the latest version.');
 if(op.action==='delete'){const deleted=result.data as unknown;if(!deleted||typeof deleted!=='object'||!('id' in deleted)||deleted.id!==op.id)throw Error('Deletion could not be confirmed.');return null;}
 if(!validRow(op.section,result.data,op.actor)||result.data.id!==op.id||!matches(result.data,op)||result.data.version!==(op.version===null?1:op.version+1))throw Error('Save receipt could not be confirmed. Retry the same operation.');
 return result.data;
}
