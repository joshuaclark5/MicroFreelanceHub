export type EstimateInput={base:string;hours:string;rate:string;expenses:string;days:string;currency:string;request:string};
export const currencies=['USD','GBP','EUR','CAD','AUD'];
function amount(value:string,max:number){if(!/^\d+(\.\d{1,2})?$/.test(value.trim()))return null;const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=max?Math.round(n*100):null;}
export function calculateChange(input:EstimateInput){
 const base=amount(input.base,1000000),hours=amount(input.hours,1000),rate=amount(input.rate,10000),expenses=amount(input.expenses,1000000);
 const days=/^\d+$/.test(input.days)?Number(input.days):NaN;
 const errors:string[]=[];
 if(base===null)errors.push('Enter the original project amount (0 to 1,000,000).');
 if(hours===null||hours===0)errors.push('Enter extra hours greater than zero, up to 1,000.');
 if(rate===null||rate===0)errors.push('Enter your hourly estimate rate greater than zero, up to 10,000.');
 if(expenses===null)errors.push('Enter additional external costs, or 0 if none.');
 if(!Number.isInteger(days)||days<0||days>365)errors.push('Enter added working days from 0 to 365.');
 if(!currencies.includes(input.currency))errors.push('Choose a supported currency.');
 if(!input.request.trim()||input.request.length>500)errors.push('Describe the extra request in 500 characters or fewer.');
 if(errors.length)return {errors,result:null};
 const labor=Math.round(hours!*rate!/100),additional=labor+expenses!;
 return {errors,result:{labor,additional,revised:base!+additional,base:base!,expenses:expenses!,days}};
}
export function money(cents:number,currency:string){return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100);}
export function changeMessage(input:EstimateInput){const {result:r}=calculateChange(input);if(!r)return '';
return `CHANGE REQUEST — ESTIMATE FOR DISCUSSION\n\nRequest: ${input.request.trim()}\nCurrency: ${input.currency}\nOriginal project: ${money(r.base,input.currency)}\nExtra work: ${input.hours} hours at ${money(Math.round(Number(input.rate)*100),input.currency)}/hour = ${money(r.labor,input.currency)}\nExternal costs: ${money(r.expenses,input.currency)}\nAdditional estimate: ${money(r.additional,input.currency)}\nRevised project total if approved: ${money(r.revised,input.currency)}\nProposed added working days: ${r.days} (confirm actual dates and dependencies)\n\nCLIENT MESSAGE\nHi [client name],\nHappy to look at ${input.request.trim()}. This adds work beyond our current brief.\n\nOption A: keep the agreed scope and original project amount of ${money(r.base,input.currency)}.\nOption B: add this work for an estimated ${money(r.additional,input.currency)}, bringing the project total to ${money(r.revised,input.currency)}, with ${r.days} added working days proposed.\n\nThese figures exclude taxes and any costs not listed above. I will confirm the revised deliverables, assumptions, dates and payment steps with you before we start the change. If you prefer to swap an existing item, I can estimate that separately. Which option would you like to review?\n\n[Your name]\n\nThis is a planning estimate based on your inputs, not a profit forecast, invoice, approval or payment request. Review your actual costs and agreement before sending.`;}
