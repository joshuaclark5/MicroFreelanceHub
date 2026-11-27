export type WorkspacePreferences={business:string;profession:string;goal:string};
export const workspaceBusinessNameMaxLength=120;
export const experienceGoals=['clients','projects','agreements','scheduling','time','invoices'];
export function workspacePreferences(value:unknown):WorkspacePreferences|null{if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;if(typeof v.business!=='string'||!v.business.trim()||v.business.trim().length>workspaceBusinessNameMaxLength||typeof v.profession!=='string'||v.profession.length>80||typeof v.goal!=='string'||!experienceGoals.includes(v.goal))return null;return {business:v.business.trim(),profession:v.profession,goal:v.goal};}
