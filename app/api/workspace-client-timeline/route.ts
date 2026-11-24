import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {validId} from '../../lib/connectedWorkspace';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request){
 try{
 const url=new URL(request.url),editing=request.method==='PATCH',writing=request.method==='POST'||editing;
 if(writing&&request.headers.get('origin')!==url.origin)return reply({error:'Request origin not allowed.'},403);
 if(writing&&request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 const jar=cookies(),db=createRouteHandlerClient({cookies:()=>jar});
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in to the original account to continue.'},401);
 if(request.headers.get('x-workspace-owner')!==user.id)return reply({error:'Account changed. Return to the original account.'},409);
 if(writing){
 if(url.search)return reply({error:'Unsupported filters.'},400);
 let payload;
 try{const raw=await request.text();if(raw.length>12000)return reply({error:'Note too large.'},413);payload=JSON.parse(raw);
 if(!payload||Array.isArray(payload)||Object.keys(payload).sort().join(',')!==(editing?'body,clientId,expectedActorId,expectedVersion,noteId,operationId':'body,clientId,expectedActorId,operationId')||(editing&&(!validId(payload.noteId)||!Number.isSafeInteger(payload.expectedVersion)||payload.expectedVersion<1||payload.expectedVersion>999999999))||!validId(payload.clientId)||!validId(payload.operationId)||typeof payload.body!=='string'||!payload.body.trim()||payload.body.length>2000)return reply({error:'Choose a client and enter a note up to 2,000 characters.'},400);
 }catch{return reply({error:'Invalid JSON.'},400);}
 if(payload.expectedActorId!==user.id)return reply({error:'Account changed. No note sent.'},409);
 const result=await db.rpc(editing?'workspace_client_note_edit':'workspace_client_note',{payload});
 if(result.error){if(result.error.code==='P0002')return reply({error:'Client unavailable.'},404);if(result.error.code==='40001')return reply({code:'note_conflict',error:'This note or operation changed. Refresh the history and review before editing again.'},409);if(['22023','22P02','23514'].includes(result.error.code))return reply({error:'Check the note details.'},400);throw result.error;}
 return reply({actorId:user.id,record:result.data});
 }
 if([...url.searchParams.keys()].some(k=>k!=='clientId')||url.searchParams.getAll('clientId').length!==1||!validId(url.searchParams.get('clientId')))return reply({error:'Choose one client.'},400);
 const clientId=url.searchParams.get('clientId')!;
 const client=await db.from('workspace_clients').select('id').eq('id',clientId).eq('owner_id',user.id).maybeSingle();
 if(client.error)throw client.error;if(!client.data)return reply({error:'Client unavailable.'},404);
 const result=await db.rpc('workspace_client_timeline',{client:clientId});if(result.error)throw result.error;
 return reply({actorId:user.id,...result.data});
 }catch{return reply({error:'Client timeline unavailable. Keep this tab open. If a save was unconfirmed, retry the same note to recover without duplicates.'},503);}
}
export const GET=handle;
export const POST=handle;

export const PATCH=handle;
