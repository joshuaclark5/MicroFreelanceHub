'use client';
import {useState} from 'react';
const fields = [
 ['Project label', 'Example: Five-page website'],
 ['Deliverables and acceptance criteria', 'List pages, features, file formats and what the client will review.'],
 ['Revision rounds and exclusions', 'Define one round, how many are included, and what is outside scope.'],
 ['Client inputs', 'Who supplies copy, images, access and approvals? By when?'],
 ['Milestones, reviewer and payment timing', 'Stage → deliverable → review date → agreed amount. Check the total.'],
 ['Change-request reply', 'Acknowledge the request, explain the scope difference, offer a separate estimate or the original scope.'],
];
function track(name:'challenge_brief_download'|'challenge_brief_copy'){
 if(navigator.doNotTrack==='1'||(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl)return;
 const g=(window as Window & {gtag?:(...args:unknown[])=>void}).gtag;
 if(g)g('event',name,{event_category:'client_ready_challenge'});
}
export default function Worksheet(){
 const [values,setValues]=useState<string[]>(fields.map(()=>''));const [status,setStatus]=useState('');
 const text=()=>`CLIENT-READY PROJECT BRIEF\nMicroFreelanceHub • https://www.microfreelancehub.com/challenge\n\n${fields.map(([label],i)=>`${label.toUpperCase()}\n${values[i].trim()||'[To complete]'}`).join('\n\n')}\n\nReview this brief with your client before using it. Educational starting point, not legal advice.`;
 function download(){const url=URL.createObjectURL(new Blob([text()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='client-ready-project-brief.txt';a.click();URL.revokeObjectURL(url);track('challenge_brief_download');setStatus('Your brief was downloaded. Keep a copy before leaving this page.');}
 return <div className="worksheet"><div className="field-grid">{fields.map(([label,hint],i)=><label key={label} htmlFor={`brief-${i}`}><span>{label}</span><textarea id={`brief-${i}`} value={values[i]} placeholder={hint} maxLength={5000} onChange={e=>setValues(values.map((v,n)=>n===i?e.target.value:v))}/></label>)}</div><div className="worksheet-actions"><button className="button" onClick={download}>Download my brief</button><button className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(text());track('challenge_brief_copy');setStatus('Brief copied. Paste it into your own document or agreement draft.');}catch{setStatus('Copy is unavailable in this browser. Use Download my brief instead.');}}}>Copy my brief</button><span>{values.filter(v=>v.trim()).length} of 6 sections started</span></div><p aria-live="polite" role="status">{status}</p></div>;
}
