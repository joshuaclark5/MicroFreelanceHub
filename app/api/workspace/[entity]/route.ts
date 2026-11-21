import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { fields, isEntity, validId, workspaceInput } from '../../../lib/connectedWorkspace';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request, entity:string) {
 try {
  if(!isEntity(entity) && entity!=='available-agreements' && entity!=='session') return reply({error:'Not found.'},404);
  if(request.method!=='GET') {
   const origin=request.headers.get('origin');
   if(!origin||origin!==new URL(request.url).origin) return reply({error:'Request origin not allowed.'},403);
   if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return reply({error:'JSON required.'},415);
  }
  const cookieStore=cookies();
  const db=createRouteHandlerClient({cookies:()=>cookieStore});
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user) return reply({error:'Sign in required.'},401);
  const expectedOwner=request.headers.get('x-workspace-owner');
  // A continuity precondition, never authorization: identity still comes from getUser.
  if((request.method!=='GET'&&!expectedOwner)||(expectedOwner&&expectedOwner!==user.id))
   return reply({code:'account_changed',error:'The signed-in account changed. Return to the original account; this draft has not been sent.'},409);
  if(entity==='session')return request.method==='GET'?reply({ownerId:user.id}):reply({error:'Not found.'},404);
  if(entity==='available-agreements'&&request.method!=='GET')return reply({error:'Not found.'},404);
  const columns=entity==='available-agreements'?'id,title,client_name':['id',...fields[entity],'created_at','updated_at','version'].join(',');
  const table=entity==='available-agreements'?'sow_documents':'workspace_'+entity;
  const url=new URL(request.url);
  if(request.method==='GET') {
   const after=url.searchParams.get('after');
   const size=url.searchParams.get('limit')||'200';
   if((after&&!validId(after))||!/^([1-9][0-9]{0,2})$/.test(size)||Number(size)>200)return reply({error:'Invalid page cursor or size.'},400);
   const limit=Number(size);
   // Immutable UUID order avoids skips from mutable names/stage positions. This is
   // a live traversal, not a multi-request snapshot; concurrent inserts can require refresh.
   let query=db.from(table).select(columns,{count:'exact'}).eq(entity==='available-agreements'?'user_id':'owner_id',user.id).order('id',{ascending:true}).limit(limit);
   if(after)query=query.gt('id',after);
   const {data,error,count}=await query;
   if(error)throw error;
   const records=(data||[]) as unknown as {id:string}[];
   if(!Number.isSafeInteger(count)||count===null||count<records.length||(count>0&&!records.length))
    return reply({error:'Workspace completeness could not be verified. Refresh before relying on these records.'},503);
   const hasMore=count>records.length;
   return reply({ownerId:user.id,records,truncated:hasMore,hasMore,nextCursor:hasMore?records[records.length-1].id:null,complete:!hasMore,consistency:'live-id-traversal'});
  }
  let body:unknown;
  try {const raw=await request.text();if(raw.length>12000)return reply({error:'Record is too large.'},413);body=JSON.parse(raw);}catch{return reply({error:'Invalid JSON.'},400);}
  const id=url.searchParams.get('id');
  if(request.method!=='POST'&&!validId(id))return reply({error:'Valid record ID required.'},400);
  const versionText=request.headers.get('if-match');
  const version=Number(versionText);
  if(request.method!=='POST'&&(!versionText||!/^([1-9][0-9]*)$/.test(versionText)||!Number.isSafeInteger(version)||version>2147483646))return reply({code:'version_required',error:'Reload this record before changing it. A current version is required.'},428);
  let values:Record<string,unknown>={};
  try {if(request.method==='DELETE'){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length)throw Error('Delete takes no record fields.');}else values=workspaceInput(entity as Exclude<typeof entity,'available-agreements'>,body,request.method==='PATCH');}catch(error){return reply({error:(error as Error).message},400);}
  let result;
  if(request.method==='POST') result=await db.from(table).insert({...values,owner_id:user.id}).select(columns).single();
  else if(request.method==='PATCH') result=await db.from(table).update(values).eq('owner_id',user.id).eq('id',id).eq('version',version).select(columns).maybeSingle();
  else result=await db.from(table).delete().eq('owner_id',user.id).eq('id',id).eq('version',version).select('id').maybeSingle();
  if(result.error) {
   if(['23503','23505','23001'].includes(result.error.code))return reply({error:'Related records must belong to you. Remove existing links before deleting; an agreement can link to one project only.'},409);
   throw result.error;
  }
  if(!result.data)return reply({code:'version_conflict',error:'This record changed or is no longer available. Your draft is kept. Reload and review before applying it again.'},409);
  return reply({ownerId:user.id,record:result.data},request.method==='POST'?201:200);
 }catch{return reply({error:'Workspace unavailable. Your unsaved details are still in this form. Please retry.'},503);}
}
export const GET=(r:Request,{params}:{params:{entity:string}})=>handle(r,params.entity);
export const POST=GET;
export const PATCH=GET;
export const DELETE=GET;
