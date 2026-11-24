// Owner-only MFH local scheduling. No capability tokens or external sends.
export type WeeklyRecurrence={weekdays:number[];intervalWeeks:1|2;startDate:string;endDate:string|null;excludedDates:string[]};
export type IntakeField={id:string;label:string;required:boolean};
export type Availability={id:string;title:string;timezone:string;weekday:number;start_minute:number;end_minute:number;duration:number;buffer:number;notice_hours:number;horizon_days:number;daily_cap:number;active:boolean;version:number;recurrence?:WeeklyRecurrence|null};
export type Intake={id:string;title:string;consent:string;fields:IntakeField[];version:number};
export type Booking={id:string;attendee:string;starts_at:string;ends_at:string;timezone:string;status:'confirmed'|'canceled';version:number;intake_id:string;answers:Record<string,string>};
export type SchedulingData={actorId:string;availability:Availability[];intakes:Intake[];bookings:Booking[];truncated:boolean};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validId=(v:unknown):v is string=>typeof v==='string'&&uuid.test(v);
function obj(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Object required.');return v as Record<string,unknown>;}
function closed(v:Record<string,unknown>,keys:string[]){if(Object.keys(v).some(k=>!keys.includes(k))||keys.some(k=>!(k in v)))throw Error('Missing or unsupported fields.');}
function str(v:unknown,max:number,min=1){if(typeof v!=='string'||v.trim().length<min||v.length>max)throw Error('Text is missing or too long.');return v;}
function int(v:unknown,min:number,max:number){if(!Number.isInteger(v)||Number(v)<min||Number(v)>max)throw Error('Number is out of range.');}
export function validLocalDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith('0000-'))return false;
 const instant=Date.parse(value+'T00:00:00.000Z');return Number.isFinite(instant)&&new Date(instant).toISOString().slice(0,10)===value;
}
export function weeklyRecurrence(input:unknown):WeeklyRecurrence {
 const r=obj(input);closed(r,['weekdays','intervalWeeks','startDate','endDate','excludedDates']);
 if(!Array.isArray(r.weekdays)||r.weekdays.length<1||r.weekdays.length>7||r.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(r.weekdays).size!==r.weekdays.length)throw Error('Choose one or more different weekdays.');
 if(r.intervalWeeks!==1&&r.intervalWeeks!==2)throw Error('Choose weekly or every other week.');
 if(!validLocalDate(r.startDate)||!(r.endDate===null||validLocalDate(r.endDate)&&r.endDate>=r.startDate))throw Error('Choose valid start and end dates.');
 const start=r.startDate,end=r.endDate as string|null;
 if(!Array.isArray(r.excludedDates)||r.excludedDates.length>366||r.excludedDates.some(d=>!validLocalDate(d)||d<start||end!==null&&d>end)||new Set(r.excludedDates).size!==r.excludedDates.length)throw Error('Days off must be unique dates within the schedule.');
 return {weekdays:r.weekdays as number[],intervalWeeks:r.intervalWeeks,startDate:start,endDate:end,excludedDates:r.excludedDates as string[]};
}
// Preview only: the database independently applies the same local-date rule at booking time.
export function availabilityMatches(weekday:number,recurrence:WeeklyRecurrence|null|undefined,day:string):boolean {
 if(!validLocalDate(day))return false;
 const instant=Date.parse(day+'T00:00:00.000Z'),dow=new Date(instant).getUTCDay();
 if(!recurrence)return dow===weekday;
 const r=weeklyRecurrence(recurrence);if(day<r.startDate||r.endDate!==null&&day>r.endDate||!r.weekdays.includes(dow)||r.excludedDates.includes(day))return false;
 const start=Date.parse(r.startDate+'T00:00:00.000Z'),monday=start-((new Date(start).getUTCDay()+6)%7)*86400000;
 return Math.floor((instant-monday)/604800000)%r.intervalWeeks===0;
}
export function schedulingInput(input:unknown){
 const b=obj(input);str(b.action,30);if(!validId(b.operationId)||!validId(b.expectedActorId))throw Error('Valid operation and actor IDs required.');
 const common=['action','operationId','expectedActorId'];
 if(b.action==='availability'){
  closed(b,[...common,'title','timezone','weekday','startMinute','endMinute','duration','buffer','noticeHours','horizonDays','dailyCap',...('recurrence' in b?['recurrence']:[])]);
  if('recurrence' in b)weeklyRecurrence(b.recurrence);
  str(b.title,100);const tz=str(b.timezone,80);try{new Intl.DateTimeFormat('en',{timeZone:tz}).format();}catch{throw Error('Valid IANA timezone required.');}
  int(b.weekday,0,6);int(b.startMinute,0,1439);int(b.endMinute,1,1440);int(b.duration,15,240);int(b.buffer,0,120);int(b.noticeHours,0,720);int(b.horizonDays,1,180);int(b.dailyCap,1,50);
  if(Number(b.endMinute)-Number(b.startMinute)<Number(b.duration))throw Error('Window must fit the duration; overnight windows require separate rules.');
 }else if(b.action==='toggle'){
  closed(b,[...common,'id','expectedVersion','active']);if(!validId(b.id)||typeof b.active!=='boolean')throw Error('Invalid rule.');int(b.expectedVersion,1,2147483647);
 }else if(b.action==='publish'){
  closed(b,[...common,'title','consent','fields']);str(b.title,100);str(b.consent,2000);if(!Array.isArray(b.fields)||b.fields.length<1||b.fields.length>8)throw Error('Use 1–8 text questions.');
  const ids=new Set();for(const item of b.fields){const f=obj(item);closed(f,['id','label','required']);if(typeof f.id!=='string'||!/^q[1-8]$/.test(f.id)||ids.has(f.id)||typeof f.required!=='boolean')throw Error('Invalid question.');ids.add(f.id);str(f.label,160);}
 }else if(b.action==='book'){
  closed(b,[...common,'availabilityId','expectedVersion','intakeId','startsAt','attendee','answers','consented']);if(!validId(b.availabilityId)||!validId(b.intakeId))throw Error('Select availability and intake.');int(b.expectedVersion,1,2147483647);str(b.attendee,160);
  if(typeof b.startsAt!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:00[.]000Z$/.test(b.startsAt)||!Number.isFinite(Date.parse(b.startsAt)))throw Error('Choose an exact slot.');
  if(b.consented!==true)throw Error('Review and accept the intake privacy text.');const a=obj(b.answers);if(Object.keys(a).length>8)throw Error('Too many answers.');for(const [k,v]of Object.entries(a)){if(!/^q[1-8]$/.test(k))throw Error('Invalid answer field.');str(v,2000,0);}
 }else if(b.action==='cancel'){
  closed(b,[...common,'id','expectedVersion']);if(!validId(b.id))throw Error('Invalid booking.');int(b.expectedVersion,1,2147483647);
 }else throw Error('Unsupported action.');
 return b;
}
// Enumerate UTC instants rather than coercing local dates: gaps yield zero and folds two distinct choices.
export function localInstants(date:string,minute:number,zone:string):string[]{
 if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||!Number.isInteger(minute)||minute<0||minute>1439)return [];
 const base=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(base)||new Date(base).toISOString().slice(0,10)!==date)return [];
 const target=date+'T'+String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');const found=[];
 // Current IANA offsets are quarter-hour aligned; enumerate all minutes to also support historical offsets.
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(let t=base-14*3600000;t<=base+38*3600000;t+=60000){const p=Object.fromEntries(formatter.formatToParts(new Date(t)).map(x=>[x.type,x.value]));if(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute===target)found.push(new Date(t).toISOString());}return found;
}
export function slotLabel(iso:string,zone:string){return new Intl.DateTimeFormat('en-US',{timeZone:zone,dateStyle:'medium',timeStyle:'long'}).format(new Date(iso))+' ('+zone+')';}
