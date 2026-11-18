export const crmCurrencies=['USD','EUR','GBP','CAD','AUD','JPY','KWD'] as const;
export const crmStages=['lead','discovery','proposal','won','lost'] as const;
export type Opportunity={id:string;client_id:string;title:string;stage:string;amount_minor:number|null;currency:string;expected_close:string|null;follow_up:string|null;reason:string;version:number;updated_at:string};
export type Activity={id:string;opportunity_id:string;kind:string;body:string;created_at:string};
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const date=(v:unknown)=>v===null||(typeof v==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
export function parseCrmAmount(value:string,currency:string):number|null {
 if(!crmCurrencies.includes(currency as typeof crmCurrencies[number]))throw Error('Choose a supported currency.');
 if(value==='')return null;const digits=currency==='JPY'?0:currency==='KWD'?3:2;
 if(!new RegExp('^\\d{1,10}'+(digits?'(?:\\.\\d{1,'+digits+'})?':'')+'$').test(value))throw Error('Enter a nonnegative amount with at most '+digits+' decimal places.');
 const [whole,part='']=value.split('.');const n=BigInt(whole)*BigInt(10**digits)+BigInt(part.padEnd(digits,'0')||'0');
 if(n>BigInt(100000000000))throw Error('Amount is too large.');return Number(n);
}
export function crmDecimal(value:number,currency:string){if(!Number.isSafeInteger(value)||value<0||!crmCurrencies.includes(currency as typeof crmCurrencies[number]))throw Error('Invalid recorded amount.');const d=currency==='JPY'?0:currency==='KWD'?3:2,s=BigInt(value).toString().padStart(d+1,'0');return d?s.slice(0,-d)+'.'+s.slice(-d):s;}
export function crmMoney(value:number|null,currency:string){return value===null?'Not set':(currency==='USD'?'
const fields=['clientId','title','stage','amountMinor','currency','expectedClose','followUp','reason'];
export function opportunityInput(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid opportunity.');const b=value as Record<string,unknown>;
 if(Object.keys(b).length!==fields.length||Object.keys(b).some(k=>!fields.includes(k)))throw Error('Unsupported or missing opportunity fields.');
 if(!uuid(b.clientId))throw Error('Choose a saved client.');
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>160||b.title!==b.title.trim())throw Error('Title must be 1–160 characters without surrounding spaces.');
 if(!crmStages.includes(b.stage as typeof crmStages[number]))throw Error('Choose a stage.');
 if(b.amountMinor!==null&&(!Number.isSafeInteger(b.amountMinor)||Number(b.amountMinor)<0||Number(b.amountMinor)>100000000000))throw Error('Invalid amount.');
 if(!crmCurrencies.includes(b.currency as typeof crmCurrencies[number]))throw Error('Choose a currency.');
 if(!date(b.expectedClose)||!date(b.followUp))throw Error('Enter valid dates between 2000 and 2099.');
 if(typeof b.reason!=='string'||b.reason.length>1000||(['won','lost'].includes(String(b.stage))&&!b.reason.trim()))throw Error('Add a reason for won or lost opportunities (up to 1000 characters).');return b;
}
export function crmInput(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request.');const b=value as Record<string,unknown>;
 const map:Record<string,string[]>={create:['record'],edit:['id','expectedVersion','record'],note:['id','expectedVersion','body'],import:['records','duplicatePolicy']};
 if(typeof b.action!=='string'||!Object.hasOwn(map,b.action))throw Error('Choose a valid action.');const keys=['action','operationId','expectedActorId',...map[b.action]];
 if(Object.keys(b).length!==keys.length||Object.keys(b).some(k=>!keys.includes(k)))throw Error('Unsupported or missing fields.');
 if(!uuid(b.operationId)||!uuid(b.expectedActorId)||('id'in b&&!uuid(b.id)))throw Error('Invalid record identifier.');
 if('expectedVersion'in b&&(!Number.isInteger(b.expectedVersion)||Number(b.expectedVersion)<1||Number(b.expectedVersion)>2147483647))throw Error('Reload the record version.');
 if('record'in b)opportunityInput(b.record);
 if(b.action==='note'&&(typeof b.body!=='string'||!b.body.trim()||b.body.length>2000))throw Error('Note must be 1–2000 characters.');
 if(b.action==='import'){if(b.duplicatePolicy!=='skip-exact')throw Error('Choose skip-exact duplicate policy.');if(!Array.isArray(b.records)||!b.records.length||b.records.length>200)throw Error('Import 1–200 rows per batch.');b.records.forEach(opportunityInput);}return b;
}
export const csvHeaders=['client_id','title','stage','amount','currency','expected_close','follow_up','reason'];
export function csvCell(value:unknown){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function exportCrm(rows:Opportunity[]){return [csvHeaders.join(','),...rows.map(r=>[r.client_id,r.title,r.stage,r.amount_minor===null?'':crmDecimal(r.amount_minor,r.currency),r.currency,r.expected_close,r.follow_up,r.reason].map(csvCell).join(','))].join('\r\n');}
// Strict bounded RFC4180 subset: escaped quotes, CRLF/LF and multiline quoted fields.
export function previewCrmCsv(input:string){
 if(input.length>200000)throw Error('CSV must be at most 200,000 characters.');let text=input.replace(/^\uFEFF/,''),rows:string[][]=[],row:string[]=[],cell='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
 if(c==='"'){if(cell||closed)throw Error('Unexpected quote.');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else {if(closed)throw Error('Unexpected text after closing quote.');cell+=c;}}
 if(quoted)throw Error('Unclosed quoted field.');if(cell||row.length||closed){row.push(cell);rows.push(row);}if(rows.length>201)throw Error('Import at most 200 rows.');if(JSON.stringify(rows.shift())!==JSON.stringify(csvHeaders))throw Error('Use the exact template headers in order.');
 const records:Record<string,unknown>[]=[],errors:{row:number;message:string}[]=[];
 rows.forEach((r,i)=>{try{if(r.length!==8)throw Error('Expected eight fields.');const [clientId,title,stage,amount,currency,expectedClose,followUp,reason]=r;const record={clientId,title,stage,amountMinor:parseCrmAmount(amount,currency),currency,expectedClose:expectedClose||null,followUp:followUp||null,reason};records.push(opportunityInput(record));}catch(e){errors.push({row:i+2,message:(e as Error).message});}});
 return {records,errors,total:rows.length,duplicatePolicy:'skip-exact' as const};
}
:currency+' ')+crmDecimal(value,currency);}
const fields=['clientId','title','stage','amountMinor','currency','expectedClose','followUp','reason'];
export function opportunityInput(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid opportunity.');const b=value as Record<string,unknown>;
 if(Object.keys(b).length!==fields.length||Object.keys(b).some(k=>!fields.includes(k)))throw Error('Unsupported or missing opportunity fields.');
 if(!uuid(b.clientId))throw Error('Choose a saved client.');
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>160||b.title!==b.title.trim())throw Error('Title must be 1–160 characters without surrounding spaces.');
 if(!crmStages.includes(b.stage as typeof crmStages[number]))throw Error('Choose a stage.');
 if(b.amountMinor!==null&&(!Number.isSafeInteger(b.amountMinor)||Number(b.amountMinor)<0||Number(b.amountMinor)>100000000000))throw Error('Invalid amount.');
 if(!crmCurrencies.includes(b.currency as typeof crmCurrencies[number]))throw Error('Choose a currency.');
 if(!date(b.expectedClose)||!date(b.followUp))throw Error('Enter valid dates between 2000 and 2099.');
 if(typeof b.reason!=='string'||b.reason.length>1000||(['won','lost'].includes(String(b.stage))&&!b.reason.trim()))throw Error('Add a reason for won or lost opportunities (up to 1000 characters).');return b;
}
export function crmInput(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request.');const b=value as Record<string,unknown>;
 const map:Record<string,string[]>={create:['record'],edit:['id','expectedVersion','record'],note:['id','expectedVersion','body'],import:['records','duplicatePolicy']};
 if(typeof b.action!=='string'||!Object.hasOwn(map,b.action))throw Error('Choose a valid action.');const keys=['action','operationId','expectedActorId',...map[b.action]];
 if(Object.keys(b).length!==keys.length||Object.keys(b).some(k=>!keys.includes(k)))throw Error('Unsupported or missing fields.');
 if(!uuid(b.operationId)||!uuid(b.expectedActorId)||('id'in b&&!uuid(b.id)))throw Error('Invalid record identifier.');
 if('expectedVersion'in b&&(!Number.isInteger(b.expectedVersion)||Number(b.expectedVersion)<1||Number(b.expectedVersion)>2147483647))throw Error('Reload the record version.');
 if('record'in b)opportunityInput(b.record);
 if(b.action==='note'&&(typeof b.body!=='string'||!b.body.trim()||b.body.length>2000))throw Error('Note must be 1–2000 characters.');
 if(b.action==='import'){if(b.duplicatePolicy!=='skip-exact')throw Error('Choose skip-exact duplicate policy.');if(!Array.isArray(b.records)||!b.records.length||b.records.length>200)throw Error('Import 1–200 rows per batch.');b.records.forEach(opportunityInput);}return b;
}
export const csvHeaders=['client_id','title','stage','amount','currency','expected_close','follow_up','reason'];
export function csvCell(value:unknown){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function exportCrm(rows:Opportunity[]){return [csvHeaders.join(','),...rows.map(r=>[r.client_id,r.title,r.stage,r.amount_minor===null?'':(r.amount_minor/(r.currency==='JPY'?1:r.currency==='KWD'?1000:100)).toFixed(r.currency==='JPY'?0:r.currency==='KWD'?3:2),r.currency,r.expected_close,r.follow_up,r.reason].map(csvCell).join(','))].join('\r\n');}
// Strict bounded RFC4180 subset: escaped quotes, CRLF/LF and multiline quoted fields.
export function previewCrmCsv(input:string){
 if(input.length>200000)throw Error('CSV must be at most 200,000 characters.');let text=input.replace(/^\uFEFF/,''),rows:string[][]=[],row:string[]=[],cell='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
 if(c==='"'){if(cell||closed)throw Error('Unexpected quote.');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else {if(closed)throw Error('Unexpected text after closing quote.');cell+=c;}}
 if(quoted)throw Error('Unclosed quoted field.');if(cell||row.length||closed){row.push(cell);rows.push(row);}if(rows.length>201)throw Error('Import at most 200 rows.');if(JSON.stringify(rows.shift())!==JSON.stringify(csvHeaders))throw Error('Use the exact template headers in order.');
 const records:Record<string,unknown>[]=[],errors:{row:number;message:string}[]=[];
 rows.forEach((r,i)=>{try{if(r.length!==8)throw Error('Expected eight fields.');const [clientId,title,stage,amount,currency,expectedClose,followUp,reason]=r;const record={clientId,title,stage,amountMinor:parseCrmAmount(amount,currency),currency,expectedClose:expectedClose||null,followUp:followUp||null,reason};records.push(opportunityInput(record));}catch(e){errors.push({row:i+2,message:(e as Error).message});}});
 return {records,errors,total:rows.length,duplicatePolicy:'skip-exact' as const};
}
