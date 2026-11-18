import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {resourcesInput,resourceUuid,resourceWeek} from '../../lib/workspaceResources';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
function failure(code:string){if(code==='54000')return reply({error:'This planning view exceeds its complete-list limit. No partial totals are shown.'},422);if(code==='42501')return reply({error:'This workspace is unavailable or your role no longer permits this action. Reload your team.'},403);if(code==='P0002')return reply({error:'Planning record not found in this workspace.'},404);if(['40001','23503','23505'].includes(code))return reply({error:'Account, membership or saved version changed. Reload and review before saving again.'},409);if(['22023','22007','22008','22P02','23514','22003'].includes(code))return reply({error:'Check the planning details and limits.'},400);return reply({error:'Outcome is unconfirmed. Keep this tab open and retry the same operation.'},503);}
export async function GET(request:Request){try{
 const c=cookies(),db=createRouteHandlerClient({cookies:()=>c});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
 const p=new URL(request.url).searchParams;if([...p.keys()].some(k=>!['expectedActorId','workspaceId','week'].includes(k)||p.getAll(k).length!==1)||!resourceUuid(p.get('workspaceId'))||!resourceWeek(p.get('week')))return reply({error:'Choose a workspace and a Monday.'},400);
 if(p.get('expectedActorId')!==user.id)return reply({error:'Account changed. Return to the original account, then reload.'},409);
 const r=await db.rpc('workspace_resources_snapshot',{expected_actor_id:user.id,selected_workspace_id:p.get('workspaceId'),selected_week:p.get('week')});if(r.error)return failure(r.error.code);
 const current=await db.auth.getUser();if(current.error||current.data.user?.id!==user.id)return reply({error:'Account changed. Reload your team.'},409);
 return reply(r.data);
 }catch{return reply({error:'Planning is unavailable. Reload to check access.'},503);}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 if(new URL(request.url).search)return reply({error:'Mutation filters are not supported.'},400);
 const c=cookies(),db=createRouteHandlerClient({cookies:()=>c});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
 let payload;try{const raw=await request.text();if(raw.length>4096)return reply({error:'Planning request is too large.'},413);payload=resourcesInput(JSON.parse(raw));}catch(e){return reply({error:e instanceof SyntaxError?'Invalid JSON.':(e as Error).message},400);}
 if(payload.expectedActorId!==user.id)return reply({error:'Account changed. Return to the original account before saving.'},409);
 const r=await db.rpc('workspace_resources_mutate',{payload});if(r.error)return failure(r.error.code);return reply({actorId:user.id,workspaceId:payload.workspaceId,record:r.data});
 }catch{return reply({error:'Save outcome is unconfirmed. Retry the same operation to recover safely.'},503);}}
