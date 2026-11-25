'use client';
import {useEffect,useRef,useState} from 'react';
import {MessageSquare,X,Send} from 'lucide-react';
import {feedbackRecipient} from '../lib/feedbackReport';

type Report={id:string;message:string;email:string;consent:true;website:string};
export default function FeedbackWidget(){
 const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[email,setEmail]=useState(''),[consent,setConsent]=useState(false),[website,setWebsite]=useState('');
 const [busy,setBusy]=useState(false),[feedback,setFeedback]=useState(''),[pending,setPending]=useState<Report|null>(null),[accepted,setAccepted]=useState(false);
 const inflight=useRef(false),textarea=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{if(!message.trim()||accepted)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[message,accepted]);
 useEffect(()=>{if(open)textarea.current?.focus();},[open]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(inflight.current||accepted)return;
  const report=pending||{id:crypto.randomUUID(),message:message.trim(),email:email.trim(),consent:true as const,website};
  inflight.current=true;setBusy(true);setPending(report);setFeedback('Sending your report...');
  try{
   const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)}),body=await response.json();
   if(response.ok&&(body.id!==report.id||!['accepted','unknown','failed'].includes(body.status)))throw Error('receipt');
   if(!response.ok){if(response.status===400)setPending(null);setFeedback(body.error||'Email could not be confirmed. Keep this report and check its status.');return;}
   if(body.status==='accepted'){setAccepted(true);setFeedback('The email service accepted your report for admin@microfreelancehub.com. Inbox delivery is not yet confirmed. Thank you for helping us improve.');}
   else if(body.status==='failed')setFeedback('Your report is saved, but the email service did not accept it. Please contact admin@microfreelancehub.com with the reference below. Do not send the full report again.');
   else setFeedback((body.saved?'Your report is saved. ':'')+'Email status is not confirmed. Check this same report below; we will not send a duplicate. If it stays unconfirmed, contact admin@microfreelancehub.com with the reference.');
  }catch{setFeedback('The connection ended before confirmation. Keep this report and check the same report below. Do not start another copy.');}
  finally{inflight.current=false;setBusy(false);}
 }
 return <div className="relative mx-auto flex w-full max-w-7xl flex-col items-end px-4 py-6">
  {open&&<section id="feedback-panel" aria-labelledby="feedback-title" className="mb-4 w-96 max-w-full overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg">
   <div className="flex items-center justify-between bg-emerald-950 p-4 text-white"><h2 id="feedback-title" className="font-semibold">Report an issue or share an idea</h2><button type="button" aria-label="Close feedback; keep draft" onClick={()=>setOpen(false)} className="flex h-11 w-11 shrink-0 items-center justify-center"><X size={18}/></button></div>
   <form onSubmit={submit} className="space-y-3 p-4">
    <p className="text-sm leading-6">Email the team at <a className="break-all underline" href={'mailto:'+feedbackRecipient}>{feedbackRecipient}</a>. This is not live chat.</p>
    <label className="block text-sm font-semibold" htmlFor="feedback-message">What happened, or what would help?</label>
    <p id="feedback-privacy" className="text-xs leading-5 text-slate-600">Do not include passwords, payment details, private links or client information. No page address is attached automatically.</p>
    <textarea ref={textarea} id="feedback-message" aria-describedby="feedback-privacy" disabled={!!pending} value={message} onChange={e=>setMessage(e.target.value)} maxLength={2000} rows={5} required placeholder="Tell us what you expected and what happened instead." className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-50"/>
    <label className="block text-sm font-semibold" htmlFor="feedback-email">Your email (optional, for a reply)</label>
    <input id="feedback-email" type="email" maxLength={254} disabled={!!pending} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-50"/>
    <label className="hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
    <label className="flex items-start gap-3 text-sm leading-6"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" required disabled={!!pending} checked={consent} onChange={e=>setConsent(e.target.checked)}/>I reviewed this report and want to email it to the team.</label>
    <p role="status" className="text-sm leading-6">{feedback}</p>
    {pending&&<p className="break-all rounded-lg bg-slate-50 p-3 text-xs">Report reference: {pending.id}. Keep this reference for follow-up.</p>}
    {!accepted&&<button disabled={busy||!consent||!message.trim()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-950 px-3 py-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={16}/>{busy?'Checking...':pending?'Check / retry this same report':'Email report'}</button>}
    {accepted&&<button type="button" onClick={()=>{setMessage('');setEmail('');setPending(null);setAccepted(false);setConsent(false);setFeedback('');textarea.current?.focus();}} className="min-h-11 rounded-lg border border-emerald-900 px-4 py-3 text-sm">Start a different report</button>}
    <p className="text-xs leading-5 text-slate-600">Unsent drafts stay in this tab only. Closing this panel keeps them; leaving the page can lose them. A support response time has not been established.</p>
   </form>
  </section>}
  <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="feedback-panel" className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100">{open?<X size={18}/>:<MessageSquare size={18}/>}Feedback</button>
 </div>;
}
