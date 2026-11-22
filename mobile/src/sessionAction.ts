/** Report asynchronous failures only to the session that started the work. */
export async function sessionAction(
 work:()=>Promise<void>, isCurrent:()=>boolean, report:(message:string)=>void
) {
 try { await work(); }
 catch(error) {
  if(isCurrent())report(error instanceof Error?error.message:'Something went wrong. Please retry.');
 }
}
