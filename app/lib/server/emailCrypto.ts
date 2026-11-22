import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export type EmailKeyring={active:string; keys:Record<string,Buffer>};
export function emailKeyring(env:NodeJS.ProcessEnv=process.env):EmailKeyring {
 try {
  const active=env.EMAIL_OUTBOX_ACTIVE_KEY_ID||'';const parsed=JSON.parse(env.EMAIL_OUTBOX_KEYS_JSON||'{}');
  if(!/^[a-zA-Z0-9_-]{1,40}$/.test(active)||!parsed||Array.isArray(parsed))throw Error();
  const keys:Record<string,Buffer>=Object.create(null);for(const [id,key]of Object.entries(parsed)){if(!/^[a-zA-Z0-9_-]{1,40}$/.test(id)||typeof key!=='string'||! /^[A-Za-z0-9+/]{43}=$/.test(key))throw Error();keys[id]=Buffer.from(key,'base64');if(keys[id].length!==32)throw Error();}
  if(!keys[active])throw Error();return {active,keys};
 }catch{throw Error('Email encryption unavailable.');}
}
export const emailHash=(value:string)=>createHash('sha256').update(value).digest('hex');
export function sealEmailToken(token:string,purpose:string,ring:EmailKeyring):string {
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',ring.keys[ring.active],iv);cipher.setAAD(Buffer.from('mfh-email:v1:'+purpose));
 const data=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return ['v1',ring.active,iv.toString('base64url'),data.toString('base64url'),cipher.getAuthTag().toString('base64url')].join('.');
}
export function openEmailToken(envelope:string,purpose:string,ring:EmailKeyring):string {
 try{const [version,id,iv,data,tag,...extra]=envelope.split('.');if(version!=='v1'||extra.length||!Object.prototype.hasOwnProperty.call(ring.keys,id)||!/^[A-Za-z0-9_-]{16}$/.test(iv)||!/^[A-Za-z0-9_-]{58}$/.test(data)||!/^[A-Za-z0-9_-]{22}$/.test(tag))throw Error();if(Buffer.from(data,'base64url').toString('base64url')!==data||Buffer.from(tag,'base64url').toString('base64url')!==tag)throw Error();const decipher=createDecipheriv('aes-256-gcm',ring.keys[id],Buffer.from(iv,'base64url'));decipher.setAAD(Buffer.from('mfh-email:v1:'+purpose));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');}catch{throw Error('Email secret unavailable.');}
}
