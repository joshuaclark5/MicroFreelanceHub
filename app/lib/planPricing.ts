// New-subscription USD list prices. Existing Stripe subscriptions are not migrated.
// HoneyBook standard list-price benchmark verified 2026-11-23: /pricing and /pricing.md.
export const PRICING_VERSION = '2026-11-23-hb-minus-five';
export const PLAN_PRICES = {
 starter: {name:'Starter', monthly:3100, annual:28800},
 pro: {name:'Professional', monthly:5400, annual:52800},
 agency: {name:'Agency', monthly:12400, annual:124800},
} as const;
export type PaidPlan = keyof typeof PLAN_PRICES;
export type BillingCycle = 'monthly'|'annual';
export function isPaidPlan(value:unknown):value is PaidPlan{return typeof value==='string'&&Object.prototype.hasOwnProperty.call(PLAN_PRICES,value);}
export function planQuote(plan:PaidPlan,cycle:BillingCycle='monthly'){
 const config=PLAN_PRICES[plan];
 return {name:config.name,amount:config[cycle],interval:cycle==='annual'?'year' as const:'month' as const,monthlyEquivalent:config[cycle]/(cycle==='annual'?1200:100)};
}
export const planMonthly=(plan:PaidPlan)=>PLAN_PRICES[plan].monthly/100;
