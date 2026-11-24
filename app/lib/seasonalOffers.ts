export type SeasonalOffer={id:string;name:string;percentOff:number;startsAt:string;endsAt:string;endsLabel:string};
// America/New_York dates expressed as explicit UTC instants; never repeat automatically next year.
export const SEASONAL_OFFERS:SeasonalOffer[]=[
 {id:'mfh-black-friday-2026',name:'Black Friday',percentOff:50,startsAt:'2026-11-23T05:00:00Z',endsAt:'2026-12-08T05:00:00Z',endsLabel:'December 7, 2026, 11:59 p.m. Eastern'},
 {id:'mfh-christmas-2026',name:'Christmas',percentOff:50,startsAt:'2026-12-15T05:00:00Z',endsAt:'2026-12-27T05:00:00Z',endsLabel:'December 26, 2026, 11:59 p.m. Eastern'},
];
export function activeSeasonalOffer(now=Date.now()){return SEASONAL_OFFERS.find(o=>Date.parse(o.startsAt)<=now&&now<Date.parse(o.endsAt))||null;}
export function offerFirstPayment(amount:number,offer:SeasonalOffer){return Math.round(amount*(100-offer.percentOff)/100);}
