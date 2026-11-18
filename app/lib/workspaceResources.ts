export type ResourceProject={id:string;workspace_id:string;name:string;version:number};
export type ResourceCapacity={workspace_id:string;user_id:string;week:string;minutes:number;version:number};
export type ResourceAssignment={id:string;workspace_id:string;project_id:string;user_id:string|null;week:string;minutes:number;version:number};
export type ResourceSnapshot={actorId:string;workspaceId:string;name:string;role:string;members:{user_id:string;role:string}[];projects:ResourceProject[];capacities:ResourceCapacity[];assignments:ResourceAssignment[];week:string};
export const resourceUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function resourceWeek(v:unknown):v is string{return typeof v==='string'&&/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&new Date(v).getUTCDay()===1;}
export function resourceMinutes(hours:string,minutes:string){if(!/^[0-9]{1,3}$/.test(hours)||!/^[0-9]{1,2}$/.test(minutes)||Number(minutes)>59)throw Error('Use whole hours and 0–59 minutes.');const n=Number(hours)*60+Number(minutes);if(n>10080)throw Error('A week has at most 168 hours.');return n;}
export const resourceDuration=(n:number)=>Math.floor(Math.abs(n)/60)+'h '+Math.abs(n)%60+'m';
export function memberLoad(userId:string,capacities:ResourceCapacity[],assignments:ResourceAssignment[]){const capacity=capacities.find(c=>c.user_id===userId)?.minutes??0,assigned=assignments.filter(a=>a.user_id===userId).reduce((s,a)=>s+a.minutes,0);return {capacity,assigned,remaining:capacity-assigned,overbooked:assigned>capacity};}
export function resourcesInput(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request.');const b=value as Record<string,unknown>;
 const actions:Record<string,string[]>={project:['name'],rename:['id','expectedVersion','name'],capacity:['userId','week','minutes','expectedVersion'],assign:['projectId','userId','week','minutes'],reassign:['id','expectedVersion','userId','minutes'],removeAssignment:['id','expectedVersion']};
 if(typeof b.action!=='string'||!Object.hasOwn(actions,b.action))throw Error('Choose a supported planning action.');const keys=['action','operationId','expectedActorId','workspaceId',...actions[b.action]];
 if(Object.keys(b).length!==keys.length||Object.keys(b).some(k=>!keys.includes(k)))throw Error('Unsupported or missing planning fields.');
 for(const k of ['operationId','expectedActorId','workspaceId','id','projectId'])if(k in b&&!resourceUuid(b[k]))throw Error('Invalid identifier.');
 if('userId'in b&&!(resourceUuid(b.userId)||(b.userId===null&&b.action!=='capacity')))throw Error('Choose a current member or unassigned.');
 if('name'in b&&(typeof b.name!=='string'||!b.name.trim()||b.name!==b.name.trim()||b.name.length>120))throw Error('Project name must be 1–120 characters.');
 if('week'in b&&!resourceWeek(b.week))throw Error('Choose a Monday between 2000 and 2099.');
 if('minutes'in b&&(!Number.isSafeInteger(b.minutes)||Number(b.minutes)<(b.action==='capacity'?0:1)||Number(b.minutes)>10080))throw Error('Enter valid weekly hours and minutes.');
 if('expectedVersion'in b&&(!Number.isInteger(b.expectedVersion)||Number(b.expectedVersion)<(b.action==='capacity'?0:1)||Number(b.expectedVersion)>2147483647))throw Error('Reload the saved version.');return b;
}
