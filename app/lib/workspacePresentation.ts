// UI boundary only: persisted money remains integer minor units and instants remain UTC.
const exponents:Record<string,number>={USD:2,EUR:2,GBP:2,CAD:2,AUD:2,JPY:0,KWD:3};
export function currencyExponent(currency:string){if(!Object.prototype.hasOwnProperty.call(exponents,currency))throw Error('Choose a supported currency.');return exponents[currency];}
export function parseMajorToMinor(value:string,currency:string):number {
 const digits=currencyExponent(currency),match=/^(-?)(\d+)(?:\.(\d*))?$/.exec(value.trim());
 if(value.length>64||!match|| (match[3]||'').length>digits)throw Error(currency+' supports '+digits+' decimal places. Enter an amount without commas.');
 const n=BigInt(match[2])*BigInt(10)**BigInt(digits)+BigInt((match[3]||'').padEnd(digits,'0')||'0');
 const signed=match[1]? -n:n;if(signed>BigInt(Number.MAX_SAFE_INTEGER)||signed<BigInt(Number.MIN_SAFE_INTEGER))throw Error('Amount is too large.');return Number(signed);
}
export function minorToMajor(value:string|number,currency:string):string {const d=currencyExponent(currency);if(typeof value==='number'&&!Number.isSafeInteger(value))throw Error('Amount must be an exact integer.');const n=BigInt(value),s=(n<0?-n:n).toString().padStart(d+1,'0');return (n<0?'-':'')+(d?s.slice(0,-d)+'.'+s.slice(-d):s);}
export function formatMoney(value:string|number,currency:string):string {const s=minorToMajor(value,currency),negative=s.startsWith('-'),[whole,fraction]=s.replace('-','').split('.');const grouped=whole.replace(/\B(?=(\d{3})+(?!\d))/g,',');return (negative?'-':'')+(currency==='USD'?'$':currency+' ')+grouped+(fraction?'.'+fraction:'');}
export function formatDuration(seconds:number):string {return Math.floor(seconds/3600)+'h '+Math.floor(seconds%3600/60)+'m'+(seconds%60?' '+seconds%60+'s':'');}
export function durationToSeconds(hours:string,minutes:string,remainder=0):number {if(!Number.isInteger(remainder)||remainder<0||remainder>59||!/^\d+$/.test(hours)||!/^\d+$/.test(minutes)||Number(minutes)>59)throw Error('Enter whole hours and minutes (0–59).');const n=Number(hours)*3600+Number(minutes)*60+remainder;if(!Number.isSafeInteger(n)||n<1||n>2678400)throw Error('Enter a duration between one second and 31 days.');return n;}
export function localDateTime(iso:string):string {const date=new Date(iso),pad=(n:number)=>String(n).padStart(2,'0');return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes())+':'+pad(date.getSeconds());}
export function localToUtc(local:string):string {const date=new Date(local);if(!Number.isFinite(date.getTime())||localDateTime(date.toISOString())!==local)throw Error('This local time does not exist. Choose another start time.');return date.toISOString().replace('.000Z','Z');}
export function localInstantLabel(iso:string):string {return new Date(iso).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}
