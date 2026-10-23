export type BriefBackup={version:1;kind?:string;values:string[];reviewed:boolean[]};
export function parseBackup(raw:string):BriefBackup{
 if(raw.length>200000)throw new Error('Backup is too large.');
 const v=JSON.parse(raw);
 if(v?.kind!==undefined&&!['freelance','contractor'].includes(v.kind))throw new Error('Unknown worksheet type.');
 if(!v||v.version!==1||!Array.isArray(v.values)||v.values.length!==6||!v.values.every((x:unknown)=>typeof x==='string'&&x.length<=5000)||!Array.isArray(v.reviewed)||v.reviewed.length!==6||!v.reviewed.every((x:unknown)=>typeof x==='boolean'))throw new Error('Not a valid challenge backup.');
 return {version:1,...(v.kind?{kind:v.kind}:{}),values:[...v.values],reviewed:[...v.reviewed]};
}
