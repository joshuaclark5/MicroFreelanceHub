import {validId,validLocalDate} from './workspaceScheduling';
export const validHandle=(v:string)=>/^[a-f0-9]{64}$/.test(v);
function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid request.');return v as Record<string,unknown>;}
function closed(b:Record<string,unknown>,keys:string[]){if(Object.keys(b).length!==keys.length||keys.some(k=>!Object.hasOwn(b,k)))throw Error('Invalid fields.');}
export function bookingConfigInput(v:unknown){const b=object(v);closed(b,['expectedActorId','expectedVersion','availabilityId','intakeId','enabled','rotate']);
 if(!validId(b.expectedActorId)||!validId(b.availabilityId)||!validId(b.intakeId)||!Number.isInteger(b.expectedVersion)||Number(b.expectedVersion)<0||Number(b.expectedVersion)>2147483646||typeof b.enabled!=='boolean'||typeof b.rotate!=='boolean')throw Error('Invalid settings.');return b;
}
export function publicBookingInput(v:unknown){const b=object(v);closed(b,['operationId','startsAt','attendee','answers','consented','portalVersion','challenge','website']);
 if(typeof b.operationId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.operationId))throw Error('Invalid request identifier.');
 if(typeof b.startsAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/.test(b.startsAt)||!Number.isFinite(Date.parse(b.startsAt))||new Date(b.startsAt).toISOString()!==b.startsAt)throw Error('Select an available time.');
 if(typeof b.attendee!=='string'||!b.attendee.trim()||b.attendee.length>160||/[\x00-\x1f]/.test(b.attendee)||b.consented!==true)throw Error('Name and consent required.');
 if(!Number.isInteger(b.portalVersion)||Number(b.portalVersion)<1||Number(b.portalVersion)>2147483647||b.website!==''||typeof b.challenge!=='string'||b.challenge.length>180)throw Error('Invalid submission.');
 const a=object(b.answers);if(Object.keys(a).length>8)throw Error('Too many answers.');for(const [k,v]of Object.entries(a))if(!/^q[1-8]$/.test(k)||typeof v!=='string'||v.length>2000||v.includes('\u0000'))throw Error('Invalid answer.');
 return b;
}
export async function boundedJson(request:Request,max=22000){if(Number(request.headers.get('content-length')||0)>max)throw Error('Request too large.');
 const reader=request.body?.getReader();if(!reader)throw Error('Missing body.');let total=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw Error('Request too large.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}

export function publicBookingStart(params:URLSearchParams):string|null {
 if(!params.toString())return null;
 if(Array.from(params.keys()).some(k=>k!=='start')||params.getAll('start').length!==1||!validLocalDate(params.get('start')))throw Error('Invalid booking date window.');
 return params.get('start');
}
