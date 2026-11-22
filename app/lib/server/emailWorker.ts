import {emailHash,emailKeyring,openEmailToken} from './emailCrypto';
import {emailProviderConfig,sendResendEmail,readResendEvidence} from './emailProvider';
export type EmailRpc={rpc:(name:string,args?:Record<string,unknown>)=>PromiseLike<{data:any;error:any}>};
async function rpc(db:EmailRpc,name:string,args?:Record<string,unknown>){const r=await db.rpc(name,args);if(r.error)throw Error('Email state unavailable.');return r.data;}
export async function dispatchEmailOnce(db:EmailRpc,env:NodeJS.ProcessEnv=process.env,fetcher:typeof fetch=fetch){
 // No import-time work. Explicit operator activation gates even claims.
 const config=emailProviderConfig(env),ring=emailKeyring(env);
 const claimed=await rpc(db,'workspace_email_claim');if(!claimed)return {status:'idle'};
 // Validate/decrypt before begin. Missing historical key quarantines the fenced lease as failed; never sends garbage.
 let token:string|undefined;
 try { if(claimed.template==='team-invitation.v1'){
  token=openEmailToken(claimed.token_ciphertext,[claimed.actor_id,claimed.operation_id,claimed.aggregate_id].join(':'),ring);
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)||emailHash(token)!==claimed.token_hash)throw Error('Email secret unavailable.');
 }
 }catch{return rpc(db,'workspace_email_quarantine',{email_id:claimed.id,claim_id:claimed.lease_id});}
 const row=await rpc(db,'workspace_email_begin',{email_id:claimed.id,claim_id:claimed.lease_id});if(!row)return {status:'canceled'};
 let subject:string,text:string;
 if(row.template==='team-invitation.v1'){
  subject='Your MicroFreelanceHub team invitation';
  text='You have been invited to a MicroFreelanceHub team. Sign in with the invited verified account at '+config.siteOrigin+'/workspace/team and use workspace ID '+row.workspace_id+' and invitation token '+token+'. This invitation does not grant access until you explicitly accept. If unexpected, ignore it.';
 }else if(row.template==='booking-reminder.v1'){
  subject='Your MicroFreelanceHub booking reminder';
  text='A booking reminder was requested for '+new Date(row.starts_at).toISOString()+' ('+row.timezone+'). Contact your booking host for changes. This is a one-time transactional reminder, not a marketing subscription.';
 }else throw Error('Email template unavailable.');
 const result=await sendResendEmail(config,{id:row.id,recipient:row.recipient,subject,text},fetcher);
 // A lost finish response never causes a second send; expired sending becomes unknown.
 return rpc(db,'workspace_email_finish',{email_id:row.id,claim_id:row.lease_id,outcome:result.outcome,provider_email_id:result.providerId||null,retry_seconds:result.retrySeconds||60});
}
export async function reconcileEmail(db:EmailRpc,row:{id:string;provider_id:string|null;recipient:string},env:NodeJS.ProcessEnv=process.env,fetcher:typeof fetch=fetch){
 const config=emailProviderConfig(env);if(!row.provider_id)return {status:'unknown',needsReview:true};
 const evidence=await readResendEvidence(config,row.provider_id,row.recipient,fetcher);if(!evidence)return {status:'unconfirmed'};
 return rpc(db,'workspace_email_reconcile',{email_id:row.id,provider_email_id:row.provider_id,provider_event:evidence});
}
