import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { fields, isEntity, validId, workspaceInput } from '../../../lib/connectedWorkspace';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request, entity:string) {
 try {
  if(!isEntity(entity) && entity!=='available-agreements') return reply({error:'Not found.'},404);
  if(request.method!=='GET') {
   const origin=request.headers.get('origin');
   if(!origin||origin!==new URL(request.url).origin) return reply({error:'Request origin not allowed.'},403);
   if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return reply({error:'JSON required.'},415);
  }
  const cookieStore=cookies();
  // Cookie session only: never service-role credentials or client-supplied identity.
  const db=createRouteHandlerClient({cookies:()=>cookieStore});
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user) return reply({error:'Sign in required.'},401);
  if(entity==='available-agreements') {
   if(request.method!=='GET')return reply({error:'Not found.'},404);
   const {data,error}=await db.from('sow_documents').select('id,title,client_name').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1001);
   if(error)throw error;
   return reply({records:(data||[]).slice(0,1000),truncated:(data||[]).length>1000});
  }
  const columns=['id',...fields[entity],'created_at','updated_at'].join(',');
  const table='workspace_'+entity;
  if(request.method==='GET') {
   const {data,error}=await db.from(table).select(columns).eq('owner_id',user.id).order(entity==='stages'?'position':'created_at',{ascending:entity==='stages'}).limit(1001);
   if(error)throw error;
   return reply({records:(data||[]).slice(0,1000),truncated:(data||[]).length>1000});
  }
  let body:unknown;
  try {const raw=await request.text();if(raw.length>12000)return reply({error:'Record is too large.'},413);body=JSON.parse(raw);}catch{return reply({error:'Invalid JSON.'},400);}
  const id=new URL(request.url).searchParams.get('id');
  if(request.method!=='POST'&&!validId(id))return reply({error:'Valid record ID required.'},400);
  let values:Record<string,unknown>={};
  try {if(request.method==='DELETE'){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length)throw Error('Delete takes no record fields.');}else values=workspaceInput(entity,body,request.method==='PATCH');}catch(error){return reply({error:(error as Error).message},400);}
  let result;
  if(request.method==='POST') result=await db.from(table).insert({...values,owner_id:user.id}).select(columns).single();
  else if(request.method==='PATCH') result=await db.from(table).update(values).eq('owner_id',user.id).eq('id',id).select(columns).maybeSingle();
  else result=await db.from(table).delete().eq('owner_id',user.id).eq('id',id).select('id').maybeSingle();
  if(result.error) {
   if(['23503','23505','23001'].includes(result.error.code))return reply({error:'Related records must belong to you. Remove existing links before deleting; an agreement can link to one project only.'},409);
   throw result.error;
  }
  if(!result.data)return reply({error:'Record not found. Refresh and try again.'},404);
  return reply({record:result.data},request.method==='POST'?201:200);
 }catch{return reply({error:'Workspace unavailable. Your unsaved details are still in this form. Please retry.'},503);}
}
export const GET=(r:Request,{params}:{params:{entity:string}})=>handle(r,params.entity);
export const POST=GET;
export const PATCH=GET;
export const DELETE=GET;
