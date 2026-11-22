import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {CalendarConfig,CalendarError,Tokens,exchange,freebusy,seal,unseal} from './calendarProvider';
export function calendarStore(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new CalendarError('unavailable');const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});return async(action:string,actor:string,payload:Record<string,unknown>={})=>{const r=await db.rpc('calendar_service',{action,actor,payload});if(r.error)throw new CalendarError(r.error.code==='40001'?'changed':'storage_unavailable');return r.data;};}
export type CalendarStore=ReturnType<typeof calendarStore>;
export async function syncCalendar(c:CalendarConfig,store:CalendarStore,owner:string,generation:number,recheck:()=>Promise<void>){const leaseId=randomUUID();const claimed=await store('claim',owner,{generation,leaseId});if(!claimed.claimed)throw new CalendarError('busy_or_reconnect');let tokenVersion=claimed.tokenVersion;const scope=()=>({generation,leaseId,tokenVersion});try{
 let tokens=unseal<Tokens>(c,owner,'tokens',claimed.tokenCipher);
 if(tokens.expiresAt<Date.now()+60000){await recheck();await store('refresh_start',owner,scope());tokens=await exchange(c,{refreshToken:tokens.refreshToken});await recheck();const r=await store('tokens',owner,{...scope(),tokenCipher:seal(c,owner,'tokens',tokens)});tokenVersion=r.tokenVersion;}
 await recheck();const start=new Date().toISOString(),end=new Date(Date.parse(start)+31*86400000).toISOString();const busy=await freebusy(tokens.accessToken,start,end);await recheck();await store('snapshot',owner,{...scope(),start,end,busy});return {synced:true};
 }catch(e){const error=e instanceof CalendarError?e:new CalendarError('sync_failed');try{await store('fail',owner,{...scope(),code:error.code,retryAfter:error.retryAfter});}catch{/* Generation/lease changes must never be overwritten by recovery. */}throw error;}}
