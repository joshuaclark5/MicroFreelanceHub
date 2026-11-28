import {businessTimezone} from './businessTimezone';
export type WorkspacePreferences={business:string;profession:string;goal:string;timezone?:string;legalBusinessName?:string;website?:string;replyToEmail?:string;businessType?:string;businessTypeOther?:string};
export const businessTypes=['Cleaning','Trades','Design','Photography','Consulting','Coaching','Events','Other','Prefer not to say'];
export const businessDetailFields=['legalBusinessName','website','replyToEmail','businessType','businessTypeOther'] as const;
export function businessDetailErrors(value:Record<string,unknown>):Partial<Record<typeof businessDetailFields[number],string>> {
 const errors:Partial<Record<typeof businessDetailFields[number],string>>={};
 for(const key of businessDetailFields)if(value[key]!==undefined&&(typeof value[key]!=='string'||(value[key] as string).trim().length>(key==='website'?500:key==='replyToEmail'?254:120)))errors[key]='Enter text within the field limit.';
 const website=typeof value.website==='string'?value.website.trim():'';
 if(website)try{const url=new URL(website);if(!['https:','http:'].includes(url.protocol)||!url.hostname.includes('.')||url.username||url.password)errors.website='Enter a complete http:// or https:// website URL.';}catch{errors.website='Enter a complete http:// or https:// website URL.';}
 const email=typeof value.replyToEmail==='string'?value.replyToEmail.trim():'';
 if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))errors.replyToEmail='Enter a valid reply-to email address.';
 if(value.businessType&&!businessTypes.includes(value.businessType as string))errors.businessType='Choose a listed business type.';
 return errors;
}
export const workspaceBusinessNameMaxLength=120;
export const experienceGoals=['clients','projects','agreements','scheduling','time','invoices'];
export function workspacePreferences(value:unknown):WorkspacePreferences|null{if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;if(typeof v.business!=='string'||!v.business.trim()||v.business.trim().length>workspaceBusinessNameMaxLength||typeof v.profession!=='string'||v.profession.length>80||typeof v.goal!=='string'||!experienceGoals.includes(v.goal))return null;const timezone=v.timezone===undefined?undefined:businessTimezone(v.timezone);if(timezone===null||Object.keys(businessDetailErrors(v)).length)return null;const details:Partial<WorkspacePreferences>={};for(const key of businessDetailFields)if(v[key]!==undefined)details[key]=(v[key] as string).trim();if(details.businessType!==undefined&&details.businessType!=='Other')details.businessTypeOther='';return {business:v.business.trim(),profession:v.profession,goal:v.goal,...(timezone?{timezone}:{}),...details};}
