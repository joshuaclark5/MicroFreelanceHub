import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {workspacePreferences,businessDetailFields} from '../../lib/workspaceExperience';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request){try{
 if(request.method==='POST'&&(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('content-type')?.split(';')[0]!=='application/json'))return reply({error:'Request not allowed.'},403);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in to personalize your workspace.'},401);
 if(request.method==='GET')return reply({ownerId:user.id,preferences:workspacePreferences(user.user_metadata?.mfh_workspace)});
 const raw=await request.text();if(raw.length>4000)return reply({error:'Setup details are too long.'},413);
 let input;try{input=JSON.parse(raw);}catch{return reply({error:'Enter valid setup details.'},400);}
 if(!input||input.expectedOwner!==user.id)return reply({error:'Account changed. Reload setup before saving.'},409);
 // Preserve explicitly saved fields when older clients omit them; explicit empty strings clear optional values.
 const existing=workspacePreferences(user.user_metadata?.mfh_workspace),supplied=input.preferences;
 const merged=supplied&&typeof supplied==='object'&&!Array.isArray(supplied)?{...supplied}:supplied;
 if(merged&&typeof merged==='object'&&!Array.isArray(merged)&&existing)for(const key of ['timezone',...businessDetailFields] as const)if(merged[key]===undefined&&existing[key]!==undefined)merged[key]=existing[key];
 const preferences=workspacePreferences(merged);if(!preferences)return reply({error:'Check your business details, starting point and timezone.'},400);
 const result=await db.auth.updateUser({data:{mfh_workspace:preferences}});
 if(result.error||result.data.user?.id!==user.id)return reply({error:'Setup could not be confirmed. Your form is kept; retry to save the same details.'},503);
 return reply({ownerId:user.id,preferences:workspacePreferences(result.data.user.user_metadata?.mfh_workspace)});
 }catch{return reply({error:'Setup is unavailable. Your form is kept; please retry.'},503);}}
export const GET=handle;export const POST=handle;
