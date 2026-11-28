'use client';
import {useId,useRef,useState} from 'react';
import AgreementExample from './AgreementExample';

/** Fictional display only: no record identifiers, API writes, or client links. */
export default function ClientViewPreview(){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false);const title=useId();
 function show(){setOpen(true);dialog.current?.showModal();}
 function close(){dialog.current?.close();}
 return <>
  <button type="button" ref={trigger} className="d4-secondary" onClick={show}>Review client view</button>
  <dialog ref={dialog} aria-labelledby={title} onClose={()=>{setOpen(false);trigger.current?.focus();}} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl backdrop:bg-slate-950/60 sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-3"><h2 id={title} className="text-xl font-semibold">Client view ? read-only sample</h2><button autoFocus type="button" onClick={close} className="d4-secondary">Close preview</button></div>
   <p className="my-4 text-sm text-slate-600">Fictional names, scope and prices. Explore the sample without saving a client, creating an invoice, sending a message or publishing a booking link. Your setup entries stay unchanged.</p>
   {open&&<AgreementExample readOnly/>}
  </dialog>
 </>;
}
