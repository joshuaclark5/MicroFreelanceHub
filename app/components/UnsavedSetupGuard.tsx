'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';

/** Guard same-tab links. Browser reload/close uses the browser's native warning. */
export default function UnsavedSetupGuard({dirty,busy,onSave}:{dirty:boolean;busy:boolean;onSave:()=>Promise<boolean>}) {
 const router=useRouter(),title=useId(),dialog=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLElement|null>(null),keepButton=useRef<HTMLButtonElement>(null),leaving=useRef(false),saving=useRef(false);
 const [destination,setDestination]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  function unload(event:BeforeUnloadEvent){if(dirty&&!leaving.current){event.preventDefault();event.returnValue='';}}
  function click(event:MouseEvent){
   if(!dirty||leaving.current||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=event.target instanceof Element?event.target.closest('a[href]'):null;
   if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
   const url=new URL(anchor.href,location.href);
   if(!['http:','https:'].includes(url.protocol)||url.href===location.href||(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search&&url.hash))return;
   event.preventDefault();event.stopPropagation();
   if(busy||saving.current)return;
   trigger.current=anchor;setError('');setDestination(url.href);dialog.current?.showModal();keepButton.current?.focus();
  }
  window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);};
 },[dirty,busy]);
 function keep(){if(saving.current)return;dialog.current?.close();setDestination('');trigger.current?.focus();}
 function leave(){leaving.current=true;dialog.current?.close();const url=new URL(destination);if(url.origin===location.origin)router.push(url.pathname+url.search+url.hash);else location.assign(url.href);}
 async function save(){if(saving.current||busy)return;saving.current=true;setError('');try{if(await onSave())leave();else setError('Changes were not saved. Keep editing to review the highlighted fields or retry saving.');}catch{setError('Changes were not saved. Please retry or keep editing.');}finally{saving.current=false;}}
 // An identity change or confirmed ordinary save must not leave a stale modal behind.
 useEffect(()=>{if(!dirty){dialog.current?.close();setDestination('');}},[dirty]);
 return <dialog ref={dialog} aria-labelledby={title} onCancel={event=>{event.preventDefault();keep();}} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/60">
  <h2 id={title} className="text-xl font-semibold">Save your setup changes?</h2>
  <p className="my-4">You have unsaved business details or a changed starting point. Choose what to do before leaving this page.</p>
  {error&&<p role="alert" className="my-4">{error}</p>}
  <div className="flex flex-wrap gap-3">
   <button type="button" className="xp-button" disabled={busy} onClick={()=>void save()}>{busy?'Saving...':'Save changes'}</button>
   <button type="button" className="d4-secondary" disabled={busy} onClick={leave}>Discard changes</button>
   <button ref={keepButton} type="button" className="d4-secondary" disabled={busy} onClick={keep}>Keep editing</button>
  </div>
 </dialog>;
}
