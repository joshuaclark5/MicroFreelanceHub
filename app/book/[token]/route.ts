import {randomBytes} from 'node:crypto';
import {validHandle} from '../../lib/publicBooking';
import {bookingDocument} from '../../lib/server/bookingDocument';
export const dynamic='force-dynamic';
// Standalone document deliberately bypasses the shared analytics/feedback layout.
// The capability URL must never be sent to analytics or third-party scripts.
export function GET(_request:Request,{params}:{params:{token:string}}){
 if(!validHandle(params.token))return new Response('Booking link unavailable.',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow'}});
 const nonce=randomBytes(18).toString('base64');
 return new Response(bookingDocument(nonce),{headers:{
  'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store',
  'X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
 }});
}
