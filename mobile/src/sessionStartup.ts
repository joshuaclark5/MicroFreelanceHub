import type {SupabaseClient} from '@supabase/supabase-js';

/** Restore before mounting sign-in/workspace. Storage failure is not a new account. */
export async function restoreNativeClient(
 readSession:()=>Promise<string|null>,
 create:()=>SupabaseClient,
):Promise<SupabaseClient> {
 // Preflight lets a failed encrypted store be retried with a fresh auth client.
 // Never erase the stored session merely because a device is locked/offline.
 await readSession();
 const db=create();
 try {
  const result=await db.auth.getSession();
  if(!result||result.error||!result.data||!('session' in result.data))throw Error('Session restore failed');
  return db;
 }catch{
  db.auth.stopAutoRefresh();
  throw Error('Could not restore your sign-in. Unlock your device, check your connection and retry. Your stored sign-in has not been reset by this recovery screen.');
 }
}
