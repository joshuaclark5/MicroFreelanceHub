export const entities = ['clients','stages','projects','tasks','agreements'] as const;
export type Entity = typeof entities[number];
export const fields: Record<Entity,string[]> = {
 clients:['name','email','notes'], stages:['name','position'],
 projects:['name','client_id','stage_id','notes','status'],
 tasks:['title','project_id','notes','due_date','status'], agreements:['project_id','agreement_id'],
};
export function isEntity(value: string): value is Entity { return entities.some(e=>e===value); }
export function validId(value: unknown): value is string { return typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
export function workspaceInput(entity: Entity, body: unknown, partial=false): Record<string,unknown> {
 if (!body || typeof body!=='object' || Array.isArray(body)) throw Error('Enter valid record details.');
 const input=body as Record<string,unknown>, output:Record<string,unknown>={};
 if (!Object.keys(input).length || Object.keys(input).some(k=>!fields[entity].includes(k))) throw Error('Unsupported record fields.');
 const required: Record<Entity,string[]>={clients:['name'],stages:['name'],projects:['name','client_id','stage_id'],tasks:['title','project_id'],agreements:['project_id','agreement_id']};
 if (!partial && required[entity].some(k=>!Object.prototype.hasOwnProperty.call(input,k))) throw Error('Complete all required fields.');
 for (const [key,value] of Object.entries(input)) {
  if (key.endsWith('_id')) { if(!validId(value)) throw Error('Choose a valid related record.'); output[key]=value; }
  else if (key==='position') { if(!Number.isInteger(value)||Number(value)<0||Number(value)>999) throw Error('Stage order must be 0 to 999.'); output[key]=value; }
  else if (key==='due_date') { if(value===null||value==='') output[key]=null; else { if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value) throw Error('Choose a valid date.'); output[key]=value; } }
  else if (key==='status') { const allowed=entity==='projects'?['active','archived']:['open','done']; if(!allowed.includes(value as string))throw Error('Choose a valid status.'); output[key]=value; }
  else { const max=key==='notes'?4000:key==='email'?254:entity==='stages'?80:160; if(typeof value!=='string'||value.trim().length>max||(['name','title'].includes(key)&&!value.trim()))throw Error('Check text length and required details.'); const text=value.trim(); if(key==='email'&&text&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))throw Error('Enter a valid email address.'); output[key]=text; }
 }
 return output;
}
export function taskNextAction(tasks: {title:string;status:string;due_date?:string|null}[]) {
 return [...tasks].filter(t=>t.status==='open').sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999'))[0] || null;
}
