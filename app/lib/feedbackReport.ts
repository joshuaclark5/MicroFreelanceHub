export const feedbackRecipient = 'admin@microfreelancehub.com';
export function feedbackInput(value: unknown) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Check your report and try again.');
 const b=value as Record<string,unknown>;
 const message=typeof b.message==='string'?b.message.trim():'';
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
 if(typeof b.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.id))throw Error('Reload before starting a new report.');
 if(!message||message.length>2000)throw Error('Enter a report of 1 to 2000 characters.');
 if(email.length>254||(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)))throw Error('Check your optional email address.');
 if(b.consent!==true)throw Error('Confirm you want to email this report.');
 if(b.website)throw Error('Unable to submit this report.');
 return {id:b.id,message,email};
}
