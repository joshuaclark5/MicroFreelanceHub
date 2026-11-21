export const currencies = ['USD','EUR','GBP','CAD','AUD','JPY','KWD'] as const;
export type TimeEntry={id:string;project_id:string;description:string;source:'manual'|'timer';started_at:string;stopped_at:string|null;seconds:number|null;billable:boolean;rate_minor:number;currency:string;review_status:'draft'|'self_approved';version:number};
export type TimeProject={id:string;name:string;status:string};
export const validId=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function dateOnly(v:string){return /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
export function timeInput(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Enter valid time details.');
 const b=value as Record<string,unknown>,base=['action','operationId','expectedActorId'];
 const actions:Record<string,string[]>={manual:['projectId','description','billable','rateMinor','currency','startedAt','seconds'],start:['projectId','description','billable','rateMinor','currency'],edit:['id','expectedVersion','description','billable','startedAt','seconds'],stop:['id','expectedVersion'],approve:['id','expectedVersion']};
 const fields=typeof b.action==='string'&&Object.prototype.hasOwnProperty.call(actions,b.action)?actions[b.action]:undefined;
 if(!fields)throw Error('Choose a valid action.');
 const keys=[...base,...fields];
 if(Object.keys(b).length!==keys.length||Object.keys(b).some(k=>!keys.includes(k)))throw Error('Unsupported or missing time fields.');
 for(const key of keys){const v=b[key];
 if(['operationId','expectedActorId','projectId','id'].includes(key)&&!validId(v))throw Error('Choose a valid record.');
 if(key==='description'&&(typeof v!=='string'||v.length>2000))throw Error('Description must be at most 2000 characters.');
 if(key==='billable'&&typeof v!=='boolean')throw Error('Choose billable or nonbillable.');
 if(['rateMinor','seconds','expectedVersion'].includes(key)&&(!Number.isInteger(v)||Number(v)<(key==='rateMinor'?0:1)||Number(v)>(key==='rateMinor'?100000000:key==='seconds'?2678400:2147483647)))throw Error('Check rate, duration and version limits.');
 if(key==='currency'&&!currencies.includes(v as typeof currencies[number]))throw Error('Choose a supported currency.');
 if(key==='startedAt'&&(typeof v!=='string'||!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().replace('.000Z','Z')!==v))throw Error('Enter a valid whole-second UTC start.');
 }
 return b;
}
export function timeRange(params:URLSearchParams){
 const keys=['from','days','projectId','billable'];
 if([...params.keys()].some(k=>!keys.includes(k)||params.getAll(k).length!==1))throw Error('Unsupported filter.');
 const from=params.get('from')||new Date().toISOString().slice(0,10),days=params.get('days')||'7';
 if(!dateOnly(from)||!['1','7'].includes(days))throw Error('Choose a valid UTC day or seven-day range.');
 const projectId=params.get('projectId'),billable=params.get('billable');
 if(projectId&&!validId(projectId))throw Error('Choose a valid project.');
 if(billable!==null&&!['true','false'].includes(billable))throw Error('Choose a valid billable filter.');
 return {from:from+'T00:00:00Z',to:new Date(Date.parse(from)+Number(days)*86400000).toISOString(),projectId,billable};
}
// Exact integer arithmetic, summed then half-up rounded once per currency/billability.
// Whole records are allocated to their UTC start date, never split at midnight.
export function timeTotals(rows:TimeEntry[]){
 const groups=new Map<string,{currency:string;billable:boolean;seconds:number;numerator:bigint}>();
 for(const r of rows){if(r.seconds===null)continue;const k=r.currency+':'+r.billable;const g=groups.get(k)||{currency:r.currency,billable:r.billable,seconds:0,numerator:BigInt(0)};g.seconds+=r.seconds;g.numerator+=BigInt(r.seconds)*BigInt(r.rate_minor);groups.set(k,g);}
 return [...groups.values()].map(g=>({currency:g.currency,billable:g.billable,seconds:g.seconds,valueMinor:((g.numerator+BigInt(1800))/BigInt(3600)).toString()}));
}
export function money(minor:string|number,currency:string){const digits=currency==='JPY'?0:currency==='KWD'?3:2;return new Intl.NumberFormat('en',{style:'currency',currency,minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(minor)/10**digits);}
