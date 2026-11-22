export type TeamRole='owner'|'admin'|'member';
export type TeamWorkspace={id:string;name:string;role:TeamRole;created_at:string};
export type TeamMember={user_id:string;role:TeamRole;joined_at:string};
export type TeamInvite={id:string;email:string;role:'admin'|'member';expires_at:string;revoked_at:string|null;accepted_at:string|null;created_at:string};
export type TeamSnapshot={actorId:string;workspaces:TeamWorkspace[];workspaceId:string|null;members:TeamMember[];invites:TeamInvite[];transfer:{transferId:string;userId:string;expiresAt:string}|null};
export const teamUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function teamInput(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request.');
 const b=value as Record<string,unknown>,map:Record<string,string[]>={create:['name'],invite:['workspaceId','email','role'],accept:['workspaceId','token'],revoke:['workspaceId','inviteId'],role:['workspaceId','userId','role'],remove:['workspaceId','userId'],transfer:['workspaceId','userId'],acceptTransfer:['workspaceId','transferId'],cancelTransfer:['workspaceId','transferId']};
 if(typeof b.action!=='string'||!Object.hasOwn(map,b.action))throw Error('Choose a valid team action.');
 const keys=['action','operationId','expectedActorId',...map[b.action]];
 if(Object.keys(b).length!==keys.length||Object.keys(b).some(k=>!keys.includes(k)))throw Error('Unsupported or missing fields.');
 for(const k of ['operationId','expectedActorId','workspaceId','inviteId','userId','transferId'])if(k in b&&!teamUuid(b[k]))throw Error('Invalid identifier.');
 if('name'in b&&(typeof b.name!=='string'||!b.name.trim()||b.name!==b.name.trim()||b.name.length>100))throw Error('Name must be 1–100 characters without surrounding spaces.');
 if('role'in b&&!['admin','member'].includes(String(b.role)))throw Error('Choose admin or member.');
 if('email'in b&&(typeof b.email!=='string'||b.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)))throw Error('Enter an email address.');
 if('token'in b&&(typeof b.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(b.token)))throw Error('Enter the complete invitation token.');
 return {...b,...('email'in b?{email:String(b.email).toLowerCase()}: {})};
}
