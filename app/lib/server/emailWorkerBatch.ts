import {dispatchEmailOnce,reconcileEmail,type EmailRpc} from './emailWorker';
import {emailWorkerConfigured} from './emailWorkerConfig';

// SQL owns leases, authorization, send rate and retries; HTTP accepts no job IDs.
export async function runEmailWorkerBatch(db:EmailRpc,env:NodeJS.ProcessEnv=process.env,fetcher:typeof fetch=fetch) {
 if(!emailWorkerConfigured(env))throw Error('Email worker disabled.');
 // Require the reconciliation prerequisite before performing any sends.
 const pending=await db.rpc('workspace_email_evidence_next');
 if(pending.error)throw Error('Email state unavailable.');
 let reconciled=0,unconfirmed=0;
 if(pending.data){
  const result=await reconcileEmail(db,pending.data,env,fetcher);
  if(result.status==='delivered'||result.status==='bounced')reconciled++;
  else unconfirmed++;
 }
 const dispatched=await dispatchEmailOnce(db,env,fetcher);
 // No IDs, recipients, tokens, SQL/provider errors or provider payloads.
 return {dispatchStatus:dispatched?.status||'unconfirmed',reconciled,unconfirmed};
}
