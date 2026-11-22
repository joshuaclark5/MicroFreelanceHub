export const currencies = ['USD','EUR','GBP','CAD','AUD','JPY','KWD'] as const;
export type InvoiceDocument = { clientId:string; projectId:string|null; seller:string; currency:string; issueDate:string; dueDate:string; memo:string; lines:{description:string; quantity:number; unitMinor:number}[] };
export const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function closed(v:unknown,keys:string[]):asserts v is Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Unexpected fields.');}
function str(v:unknown,max:number,required=false):asserts v is string{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Invalid text.');}
export function date(v:unknown):asserts v is string{if(typeof v!=='string'||!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Use a valid date in 2000–2099.');}
export function documentInput(v:unknown):InvoiceDocument{
 closed(v,['clientId','projectId','seller','currency','issueDate','dueDate','memo','lines']);
 if(!uuid(v.clientId)||(v.projectId!==null&&!uuid(v.projectId)))throw Error('Select a client and optional project.');
 str(v.seller,1000,true);str(v.memo,2000);if(!currencies.includes(v.currency as typeof currencies[number]))throw Error('Unsupported currency.');date(v.issueDate);date(v.dueDate);if(v.dueDate<v.issueDate)throw Error('Due date precedes issue date.');
 if(!Array.isArray(v.lines)||v.lines.length<1||v.lines.length>30)throw Error('Use 1–30 lines.');
 let total=0;for(const l of v.lines){closed(l,['description','quantity','unitMinor']);str(l.description,300,true);if(!Number.isInteger(l.quantity)||Number(l.quantity)<1||Number(l.quantity)>10000||!Number.isInteger(l.unitMinor)||Number(l.unitMinor)<0||Number(l.unitMinor)>100000000)throw Error('Use whole quantities and nonnegative integer minor-unit rates.');total+=Number(l.quantity)*Number(l.unitMinor);}
 if(total>100000000000)throw Error('Total exceeds supported limit.');return v as InvoiceDocument;
}
export function totalMinor(d:InvoiceDocument){return d.lines.reduce((n,l)=>n+l.quantity*l.unitMinor,0);}
export function money(n:number,currency:string){const digits=currency==='JPY'?0:currency==='KWD'?3:2;return currency+' '+(n/10**digits).toFixed(digits)+' ('+n+' minor units)';}
export function mutationInput(v:unknown):Record<string,unknown>{
 closed(v,['action','operationId','expectedActorId','id','version','document','reviewedTotalMinor','reason','frequency','anchor','occurrence','currency','amountMinor']);
 if(!uuid(v.operationId)||!uuid(v.expectedActorId))throw Error('Valid operation and actor required.');
 const fields:Record<string,string[]>={create:['document'],edit:['id','version','document'],delete:['id','version'],issue:['id','version','reviewedTotalMinor'],void:['id','version','reason'],schedule:['document','frequency','anchor'],generate:['id','occurrence'],pause:['id','version'],resume:['id','version'],allowance:['currency','amountMinor','reason']};
 if(typeof v.action!=='string'||!fields[v.action])throw Error('Unknown action.');const allowed=['action','operationId','expectedActorId',...fields[v.action]];if(Object.keys(v).some(k=>!allowed.includes(k))||allowed.some(k=>!(k in v)))throw Error('Missing or unexpected action fields.');
 if('id'in v&&!uuid(v.id))throw Error('Invalid ID.');if('version'in v&&(!Number.isInteger(v.version)||Number(v.version)<1))throw Error('Expected version required.');
 if('document'in v)documentInput(v.document);if('reviewedTotalMinor'in v&&(!Number.isSafeInteger(v.reviewedTotalMinor)||Number(v.reviewedTotalMinor)<0))throw Error('Review exact total.');
 if('reason'in v)str(v.reason,500,true);if('frequency'in v&&!['weekly','monthly'].includes(String(v.frequency)))throw Error('Weekly or monthly only.');if('anchor'in v)date(v.anchor);if('occurrence'in v)date(v.occurrence);
 if('currency'in v&&!currencies.includes(v.currency as typeof currencies[number]))throw Error('Unsupported currency.');if('amountMinor'in v&&(!Number.isSafeInteger(v.amountMinor)||!Number(v.amountMinor)||Math.abs(Number(v.amountMinor))>100000000))throw Error('Nonzero signed minor-unit amount required.');return v;
}
