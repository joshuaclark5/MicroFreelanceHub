import 'server-only';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
export function publicBookingStore(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(process.env.PUBLIC_BOOKING_ENABLED!=='true'||!url||!key)throw Error('Unavailable');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 return {key,rpc:async(name:string,args:Record<string,unknown>)=>db.rpc(name,args)};
}
const mac=(key:string,value:string)=>createHmac('sha256',key).update('public-booking-v1:'+value).digest('hex');
export function bookingChallenge(key:string,token:string,now=Date.now()){const payload=String(now)+'.'+randomBytes(16).toString('hex');return payload+'.'+mac(key,token+':'+payload);}
export function verifyBookingChallenge(key:string,token:string,value:string,now=Date.now()){
 if(!/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(value))return false;
 const [time,nonce,signature]=value.split('.'),age=now-Number(time);
 return age>=2000&&age<=15*60000&&timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(mac(key,token+':'+time+'.'+nonce),'hex'));
}
export function bookingIdentity(key:string,request:Request){
 // Only Vercel's platform-overwritten header is trusted in Vercel. Else share one
 // conservative bucket; arbitrary forwarded headers never grant fresh quotas.
 const identity=process.env.VERCEL==='1'?request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'shared':'shared';
 return mac(key,'identity:'+identity);
}
