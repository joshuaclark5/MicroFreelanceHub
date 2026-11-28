'use client';
import {useState} from 'react';
export default function RecipientVerification({documentId}:{documentId:string}){
 const [code,setCode]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function submit(action:'send'|'verify'){
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/agreement-recipient',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,document:documentId,...(action==='verify'?{code}:{})})});
   const result=await response.json();
   if(!response.ok){setMessage(result.error||'Verification unavailable. Try again later.');return;}
   if(result.verified){window.location.reload();return;}
   setMessage(result.message);
  }catch{setMessage('The result is uncertain. Check your inbox before requesting another code.');}
  finally{setBusy(false);}
 }
 return <section className="my-5 border rounded-lg p-4" aria-label="Verify recipient email"><h2 className="font-semibold">Verify your recipient email</h2><p className="my-2">Before private agreement details are shown, request a code using the email the sender addressed. This verifies only this browser session and agreement version. No subscription is required.</p><button className="d4-secondary" disabled={busy} onClick={()=>submit('send')}>Email a verification code</button><form className="mt-4" onSubmit={e=>{e.preventDefault();void submit('verify');}}><label htmlFor="recipient-code" className="block">Code from your email</label><input id="recipient-code" value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} maxLength={32} className="border rounded p-2 w-full my-2 min-w-0"/><button className="d4-primary" disabled={busy||!code.trim()} type="submit">Verify and review</button></form><p role="status" className="mt-3 break-words">{busy?'Checking…':message}</p></section>;
}
