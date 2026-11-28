import {currencies} from './workspaceInvoices';
import {businessTimezone} from './businessTimezone';
export type WorkspacePreferences={business:string;profession:string;goal:string;timezone?:string;legalBusinessName?:string;website?:string;replyToEmail?:string;businessType?:string;businessTypeOther?:string;country?:string;currency?:string;addressLine1?:string;addressLine2?:string;addressCity?:string;addressRegion?:string;addressPostalCode?:string;addressCountry?:string};
export const countryCodes='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
export const businessCurrencies=currencies;
export const addressFields=['addressLine1','addressLine2','addressCity','addressRegion','addressPostalCode','addressCountry'] as const;
export function suggestedBusinessLocale(locale:string):{country:string;currency:string}{
 try { const country=new Intl.Locale(locale).region||'';const currency=({US:'USD',GB:'GBP',CA:'CAD',AU:'AUD',JP:'JPY',KW:'KWD',AT:'EUR',BE:'EUR',CY:'EUR',DE:'EUR',EE:'EUR',ES:'EUR',FI:'EUR',FR:'EUR',GR:'EUR',HR:'EUR',IE:'EUR',IT:'EUR',LT:'EUR',LU:'EUR',LV:'EUR',MT:'EUR',NL:'EUR',PT:'EUR',SI:'EUR',SK:'EUR'} as Record<string,string>)[country]||'';return {country:countryCodes.includes(country)?country:'',currency}; }catch{return {country:'',currency:''};}
}
export const businessTypes=['Cleaning','Trades','Design','Photography','Consulting','Coaching','Events','Other','Prefer not to say'];
export const businessDetailFields=['legalBusinessName','website','replyToEmail','businessType','businessTypeOther','country','currency','addressLine1','addressLine2','addressCity','addressRegion','addressPostalCode','addressCountry'] as const;
export function businessDetailErrors(value:Record<string,unknown>):Partial<Record<typeof businessDetailFields[number],string>> {
 const errors:Partial<Record<typeof businessDetailFields[number],string>>={};
 for(const key of businessDetailFields)if(value[key]!==undefined&&(typeof value[key]!=='string'||(value[key] as string).trim().length>(key==='website'?500:key==='replyToEmail'?254:120)))errors[key]='Enter text within the field limit.';
 const website=typeof value.website==='string'?value.website.trim():'';
 if(website)try{const url=new URL(website);if(!['https:','http:'].includes(url.protocol)||!url.hostname.includes('.')||url.username||url.password)errors.website='Enter a complete http:// or https:// website URL.';}catch{errors.website='Enter a complete http:// or https:// website URL.';}
 const email=typeof value.replyToEmail==='string'?value.replyToEmail.trim():'';
 if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))errors.replyToEmail='Enter a valid reply-to email address.';
 if(value.businessType&&!businessTypes.includes(value.businessType as string))errors.businessType='Choose a listed business type.';
 for(const key of ['country','addressCountry'] as const)if(value[key]!==undefined&&(typeof value[key]!=='string'||(value[key]!==''&&!countryCodes.includes(value[key] as string))))errors[key]='Choose a supported country.';
 if(value.country!==undefined&&!value.country)errors.country='Choose your business country.';
 if(value.currency!==undefined&&!currencies.includes(value.currency as typeof currencies[number]))errors.currency='Choose a supported currency.';
 const hasAddress=addressFields.some(key=>typeof value[key]==='string'&&(value[key] as string).trim());
 if(hasAddress){
  for(const key of ['addressLine1','addressCity','addressCountry'] as const)if(typeof value[key]!=='string'||!(value[key] as string).trim())errors[key]='Complete this address field or clear the address.';
  const postal=typeof value.addressPostalCode==='string'?value.addressPostalCode.trim():'';
  const patterns:Record<string,RegExp>={US:/^\d{5}(-\d{4})?$/,CA:/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ] ?\d[ABCEGHJ-NPRSTVWXYZ]\d$/i,GB:/^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i,AU:/^\d{4}$/,JP:/^\d{3}-?\d{4}$/,KW:/^\d{5}$/};
  const pattern=patterns[String(value.addressCountry)];if(pattern&&!pattern.test(postal))errors.addressPostalCode='Enter a postal code for the selected address country.';
  if(['US','CA','AU'].includes(String(value.addressCountry))&&(typeof value.addressRegion!=='string'||!value.addressRegion.trim()))errors.addressRegion='Enter the state, province or region.';
 }
 return errors;
}
export const workspaceBusinessNameMaxLength=120;
export const experienceGoals=['clients','projects','agreements','scheduling','time','invoices'];
export function workspacePreferences(value:unknown):WorkspacePreferences|null{if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;if(typeof v.business!=='string'||!v.business.trim()||v.business.trim().length>workspaceBusinessNameMaxLength||typeof v.profession!=='string'||v.profession.length>80||typeof v.goal!=='string'||!experienceGoals.includes(v.goal))return null;const timezone=v.timezone===undefined?undefined:businessTimezone(v.timezone);if(timezone===null||Object.keys(businessDetailErrors(v)).length)return null;const details:Partial<WorkspacePreferences>={};for(const key of businessDetailFields)if(v[key]!==undefined)details[key]=(v[key] as string).trim();if(details.businessType!==undefined&&details.businessType!=='Other')details.businessTypeOther='';return {business:v.business.trim(),profession:v.profession,goal:v.goal,...(timezone?{timezone}:{}),...details};}
