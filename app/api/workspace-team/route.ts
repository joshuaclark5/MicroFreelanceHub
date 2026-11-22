import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {createHash,randomBytes} from 'node:crypto';
import {teamInput,teamUuid} from '../../lib/workspaceTeam';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
const failure=(code:string)=>code==='54000'?reply({error:'Supported team limit reached (100 workspaces per account, 1000 members or active pending invitations per team). Reload current details. Revoke a pending invitation or wait for expiry to free invitation capacity; a nonowner can leave a team to free membership capacity.'},409):code==='42501'?reply({error:'This action is not available for this account or workspace.'},403):code==='40001'||code==='23505'?reply({error:'Operation changed or already used. Reload saved details. For an invitation, revoke the old invitation and create a new one; the token cannot be recovered.'},409):['22023','22P02','23514'].includes(code)?reply({error:'Check the team details.'},400):null;
export async function GET(request:Request){try{
 const p=new URL(request.url).searchParams;
 if([...p.keys()].some(k=>!['workspaceId','expectedActorId'].includes(k)||p.getAll(k).length!==1)||[...p.values()].some(v=>!teamUuid(v)))return reply({error:'Invalid team filter.'},400);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
 if(p.has('expectedActorId')&&p.get('expectedActorId')!==user.id)return reply({error:'Account changed. Return to the original account.'},409);
 const r=await db.rpc('team_snapshot',{expected_actor_id:user.id,selected_workspace_id:p.get('workspaceId')});
 if(r.error){const mapped=failure(r.error.code);if(mapped)return mapped;throw r.error;}
 return reply(r.data);
 }catch{return reply({error:'Team unavailable. Reload to verify current access.'},503);}}
export async function POST(request:Request){let action='';try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 if(new URL(request.url).search)return reply({error:'Mutation filters are not supported.'},400);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
 let payload:Record<string,unknown>;try{const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);payload=teamInput(JSON.parse(raw));}catch{return reply({error:'Invalid team request.'},400);}
 if(payload.expectedActorId!==user.id)return reply({error:'Account changed. Return to the original account.'},409);
 action=String(payload.action);let token:string|undefined;
 if(action==='invite'){token=randomBytes(32).toString('base64url');payload.tokenHash=hash(token);}
 if(action==='accept'){payload.tokenHash=hash(String(payload.token));delete payload.token;}
 const r=await db.rpc('team_mutate',{payload});
 if(r.error){const mapped=failure(r.error.code);if(mapped)return mapped;throw r.error;}
 // Never emit a generated token for a replayed receipt or mismatched issuance.
 if(action==='invite'&&(!r.data?.inviteId||r.data?.replayed))return reply({error:'Invitation token unavailable. Reload, revoke that invitation, then create a new invitation.'},409);
 return reply({actorId:user.id,record:r.data,...(token?{token}:{})});
 }catch{return reply({error:action==='invite'?'Invitation outcome is unconfirmed. Reload invitations, revoke the old invitation, and create a new one. Do not retry issuance blindly.':'Save outcome is unconfirmed. Reload current details before retrying. Ownership acceptance cannot be replayed.'},503);}}
