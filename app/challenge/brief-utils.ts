import {briefFields} from './examples';
export const reviewPrompts = [
 'I replaced the example project name with my own or clearly marked this as practice.',
 'My deliverables have quantities or formats and clear review criteria.',
 'I defined revision rounds and named what is outside the scope.',
 'I listed the client inputs, who supplies them and when they are needed.',
 'I checked the milestone totals, reviewer, review window and payment timing.',
 'My change reply offers a choice and asks for approval before extra work starts.',
];
export function briefText(values:string[],reviewed:boolean[],fields:readonly (readonly [string,string])[]=briefFields){
 const pending=fields.filter((_,i)=>!values[i]?.trim()||!reviewed[i]).map(([label])=>label);
 return `PROJECT BRIEF — FOR CLIENT REVIEW\nMicroFreelanceHub | https://www.microfreelancehub.com/challenge\n\n${pending.length?'CHECK BEFORE SHARING: '+pending.join('; '):'Self-review checklist completed. Still requires client discussion and agreement.'}\n\n${fields.map(([label],i)=>`${label.toUpperCase()}\n${values[i]?.trim()||'[To complete]'}`).join('\n\n')}\n\nEducational starting point, not legal advice. Confirm actual scope, dates, amounts and approval with your client.`;
}
export function reviewEmail(values:string[],reviewed:boolean[],fields:readonly (readonly [string,string])[]=briefFields){
 return `Subject: ${values[0]?.trim()||'[Project]'} — scope and next steps to review\n\nHi [client name],\n\nBefore we start, please review the proposed brief below. In particular, please check the deliverables, your inputs, timing and payment steps.\n\n${briefText(values,reviewed,fields)}\n\nPlease reply with any corrections or open questions. After we agree on the details, we can document the terms and confirm the next step. This message does not treat silence as approval.\n\nThanks,\n[Your name]`;
}
