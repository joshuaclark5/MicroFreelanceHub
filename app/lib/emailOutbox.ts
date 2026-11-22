export const emailTemplates = ['team-invitation.v1', 'booking-reminder.v1'] as const;
export type EmailTemplate = typeof emailTemplates[number];
export type EmailStatus = 'queued'|'leased'|'sending'|'retry'|'accepted'|'delivered'|'bounced'|'canceled'|'unknown'|'failed';
export const emailConsentVersion = 'transactional-email.v1';
export function emailRecipient(value: unknown): string {
 if(typeof value!=='string'||value.length>254||value!==value.trim()||! /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:[.][A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value)) throw Error('Valid recipient required.');
 const [local,domain]=value.split('@');if(local.length>64||local.startsWith('.')||local.endsWith('.')||local.includes('..')||domain.split('.').some(label=>label.length>63))throw Error('Valid recipient required.');
 return value.toLowerCase();
}
export function emailInput(value: unknown): Record<string,unknown> {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request.');
 const b=value as Record<string,unknown>;
 const keys=b.action==='enqueueInvitation'?['inviteId','token','consentVersion','consented']:b.action==='enqueueReminder'?['bookingId','recipient','consentVersion','consented']:b.action==='cancel'?['id']:null;
 if(!keys)throw Error('Invalid action.');
 const all=['action','expectedActorId','operationId',...keys];
 if(Object.keys(b).length!==all.length||all.some(k=>!(k in b)))throw Error('Unexpected fields.');
 for(const k of ['expectedActorId','operationId',...(b.action==='enqueueInvitation'?['inviteId']:b.action==='enqueueReminder'?['bookingId']:['id'])])if(typeof b[k]!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b[k] as string))throw Error('Valid identifier required.');
 if(b.action!=='cancel'&&(b.consented!==true||b.consentVersion!==emailConsentVersion))throw Error('Explicit transactional email consent required.');
 if(b.action==='enqueueInvitation'&&(typeof b.token!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(b.token)))throw Error('Original invitation token required.');
 return {...b,...(b.action==='enqueueReminder'?{recipient:emailRecipient(b.recipient)}:{})};
}
