export type CostLine={label:string;quantity:string;unit:string;rate:string};
export type JobDraft={job:string;change:string;approver:string;records:string;base:string;currency:string;lines:CostLine[]};
export const emptyJob:JobDraft={job:'',change:'',approver:'',records:'',base:'',currency:'USD',lines:[{label:'',quantity:'1',unit:'hours',rate:''}]};
export function priceJob(d:JobDraft){
 const errors:string[]=[];const amounts:number[]=[];
 const decimal=(s:string)=>/^\d+(\.\d{1,2})?$/.test(s.trim())&&Number(s)<=1000000;
 if(!d.job.trim()||!d.change.trim())errors.push('Add a job reference and the proposed change.');
 if(!['USD','GBP','EUR','CAD','AUD'].includes(d.currency))errors.push('Choose a supported currency.');
 if(!decimal(d.base))errors.push('Enter an original job amount of zero or more.');
 if(d.lines.length<1||d.lines.length>12)errors.push('Use between 1 and 12 cost lines.');
 d.lines.forEach((l,i)=>{if(!l.label.trim()||!l.unit.trim()||!decimal(l.quantity)||Number(l.quantity)<=0||!decimal(l.rate))errors.push(`Check line ${i+1}: description, unit, positive quantity and nonnegative rate are required.`);amounts.push(Math.round(Math.round(Number(l.quantity)*100)*Math.round(Number(l.rate)*100)/100));});
 const extra=amounts.reduce((a,b)=>a+b,0),base=Math.round(Number(d.base)*100);
 if(!Number.isSafeInteger(extra)||extra>100000000000)errors.push('The total is too large. Check your quantities and rates.');
 return {errors,amounts,extra,total:base+extra};
}
export function parseJob(raw:string):JobDraft{
 const d=JSON.parse(raw);if(!d||typeof d!=='object')throw new Error('Invalid draft');
 for(const key of ['job','change','approver','records','base','currency'])if(typeof d[key]!=='string'||d[key].length>4000)throw new Error('Invalid draft');
 if(!Array.isArray(d.lines)||d.lines.length<1||d.lines.length>12)throw new Error('Invalid lines');
 for(const l of d.lines)for(const key of ['label','quantity','unit','rate'])if(typeof l[key]!=='string'||l[key].length>200)throw new Error('Invalid line');
 return d as JobDraft;
}
export const money=(n:number,currency:string)=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n/100);
export function proposal(d:JobDraft){const p=priceJob(d);if(p.errors.length)throw new Error('Complete the estimate first');return `PROPOSED CHANGE — FOR CUSTOMER REVIEW\nJob: ${d.job}\n\nChange: ${d.change}\n\n${d.lines.map((l,i)=>`${l.label}: ${l.quantity} ${l.unit} × ${money(Math.round(Number(l.rate)*100),d.currency)} = ${money(p.amounts[i],d.currency)}`).join('\n')}\n\nProposed additional amount: ${money(p.extra,d.currency)}\nRevised job amount if approved: ${money(p.total,d.currency)}\nTaxes, fees and anything not itemized are excluded. No minimum, overtime or standby term is assumed; confirm applicable terms and avoid double-counting included charges.\n\nCommercial approver / approval still needed: ${d.approver||'[Confirm name, authority and process]'}\nJob records, dates and evidence: ${d.records||'[Complete before relying on this proposal]'}\n\nCLIENT MESSAGE\nPlease review the proposed scope change and itemized amount above. We can document revised terms after approval, or retain the original scope if feasible. Confirm the timing and any required technical assessment before proceeding.\n\nThis is a proposal, not an invoice, signature or evidence of acceptance. Commercial approval is separate from technical feasibility and safety authorization.`;}
