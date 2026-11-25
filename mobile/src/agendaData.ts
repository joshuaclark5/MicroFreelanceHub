import type {SupabaseClient} from '@supabase/supabase-js';
import {availabilityMatches,calendarMonthBounds,validId,validLocalDate,weeklyRecurrence,type Availability} from '../../app/lib/workspaceScheduling';
import {verifyActor} from './workflow';
export type AgendaTask={id:string;title:string;due_date:string|null;status:'open';owner_id:string};
// Read only the appointment display fields and ownership/version metadata.
// Intake answers and form identifiers are not needed by this read-only agenda.
export type AgendaBooking={id:string;owner_id:string;version:number;attendee:string;starts_at:string;ends_at:string;timezone:string;status:'confirmed'|'canceled'};
export type AgendaSnapshot={month:string;availability:Availability[];bookings:AgendaBooking[];tasks:AgendaTask[];truncated:boolean};
const formatters=new Map<string,Intl.DateTimeFormat>();
function formatter(zone:string){let found=formatters.get(zone);if(!found){found=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});if(formatters.size>=64)formatters.clear();formatters.set(zone,found);}return found;}
export function localDay(instant:string,zone:string){const parts=formatter(zone).formatToParts(new Date(instant));return ['year','month','day'].map(k=>parts.find(p=>p.type===k)!.value).join('-');}
export function canonicalZone(zone:string){return formatter(zone).resolvedOptions().timeZone;}
export function appointmentTimeLabel(start:string,end:string,zone:string){
 const clock=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit',timeZoneName:'short'});
 const minutes=new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format((Date.parse(end)-Date.parse(start))/60000);
 return `${clock.format(new Date(start))} – ${clock.format(new Date(end))} · ${minutes} min`;
}
export function daySummary(snapshot:AgendaSnapshot,day:string,zone:string){
 if(!validLocalDate(day))throw Error('Choose a valid day.');
 const canonical=canonicalZone(zone);
 return {bookings:snapshot.bookings.filter(b=>b.status==='confirmed'&&localDay(b.starts_at,zone)===day),working:snapshot.availability.filter(r=>r.active&&canonicalZone(r.timezone)===canonical&&availabilityMatches(r.weekday,r.recurrence,day)),tasks:snapshot.tasks.filter(t=>t.due_date===day)};
}
const object=(r:unknown):r is Record<string,unknown>=>!!r&&typeof r==='object'&&!Array.isArray(r);
const integer=(n:unknown,min:number,max:number)=>Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max;
function validZone(z:unknown){try{return typeof z==='string'&&!!canonicalZone(z);}catch{return false;}}
function base(row:unknown,actor:string):row is Record<string,unknown>{return object(row)&&validId(row.id)&&row.owner_id===actor&&integer(row.version,1,2147483647);}
function validRule(row:unknown,actor:string){
 if(!base(row,actor)||typeof row.title!=='string'||!validZone(row.timezone)||typeof row.active!=='boolean'||!integer(row.weekday,0,6)||!integer(row.start_minute,0,1439)||!integer(row.end_minute,1,1440)||Number(row.end_minute)<=Number(row.start_minute))return false;
 try{if(row.recurrence)weeklyRecurrence(row.recurrence);return true;}catch{return false;}
}
function validBooking(row:unknown,actor:string){return base(row,actor)&&typeof row.attendee==='string'&&typeof row.starts_at==='string'&&typeof row.ends_at==='string'&&Number.isFinite(Date.parse(row.starts_at))&&Date.parse(row.ends_at)>Date.parse(row.starts_at)&&validZone(row.timezone)&&['confirmed','canceled'].includes(String(row.status));}
function validTask(row:unknown,actor:string){return base(row,actor)&&typeof row.title==='string'&&row.status==='open'&&(row.due_date===null||validLocalDate(row.due_date));}
export async function loadAgenda(db:SupabaseClient,actor:string,month:string):Promise<AgendaSnapshot>{
 if(!validId(actor))throw Error('Sign in to view your agenda.');
 const bounds=calendarMonthBounds(month);await verifyActor(db,actor);
 const results=await Promise.all([
  db.from('workspace_scheduling_availability').select('id,owner_id,title,timezone,weekday,start_minute,end_minute,duration,buffer,notice_hours,horizon_days,daily_cap,active,version,recurrence',{count:'exact'}).eq('owner_id',actor).eq('active',true).order('id').limit(501),
  db.from('workspace_scheduling_bookings').select('id,owner_id,attendee,starts_at,ends_at,timezone,status,version',{count:'exact'}).eq('owner_id',actor).gte('starts_at',bounds.start).lt('starts_at',bounds.end).order('starts_at').order('id').limit(501),
  db.from('workspace_tasks').select('id,owner_id,version,title,due_date,status',{count:'exact'}).eq('owner_id',actor).eq('status','open').order('due_date',{ascending:true,nullsFirst:false}).order('id').limit(501)
 ]);
 await verifyActor(db,actor);
 const validators=[validRule,validBooking,validTask];
 for(let i=0;i<results.length;i++){const r=results[i];if(r.error||!Array.isArray(r.data)||r.count===null||!Number.isSafeInteger(r.count)||r.count<r.data.length||(r.count>r.data.length&&r.data.length<501)||!r.data.every(row=>validators[i](row,actor))||new Set(r.data.map(row=>row.id)).size!==r.data.length)throw Error('Agenda could not be verified. Refresh to try again.');}
 return {month,availability:results[0].data!.slice(0,500) as unknown as Availability[],bookings:results[1].data!.slice(0,500) as unknown as AgendaBooking[],tasks:results[2].data!.slice(0,500) as unknown as AgendaTask[],truncated:results.some(r=>r.count!>500)};
}
