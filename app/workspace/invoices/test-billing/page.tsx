'use client';
import {useEffect,useRef,useState} from 'react';
import WorkspaceNav from '../../../components/WorkspaceNav';
import '../../../components/workspace-editorial.css';
export default function TestBilling(){
 const [actor,setActor]=useState(''),baseline=useRef(''),[available,setAvailable]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('Not started'),[pending,setPending]=useState<'create'|'refresh'|'cancel'|null>(null);
 async function load(){try{const r=await fetch('/api/workspace/test-billing',{cache:'no-store'}),b=await r.json();if(!r.ok)throw Error(b.error);if(baseline.current&&baseline.current!==b.actorId)throw Error('Account changed. Reload this page.');baseline.current=b.actorId;setActor(b.actorId);setAvailable(b.available);setStatus(b.record?.status||'Not started');}catch(e){setActor('');setError((e as Error).message);}}
 useEffect(()=>{void load();},[]);
 async function act(action:'create'|'refresh'|'cancel'){if(busy||!actor||(pending&&pending!==action))return;setBusy(true);setError('');setPending(action);try{
 const r=await fetch('/api/workspace/test-billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,expectedActorId:baseline.current,...(action==='create'?{consent}:{})})}),b=await r.json();
 if(!r.ok)throw Error(b.error);if(b.actorId!==baseline.current||b.testMode!==true)throw Error('Unconfirmed result. Retry the same action.');
 setPending(null);setStatus(b.status);
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="editorial-shell"><WorkspaceNav active="invoices"/><main className="editorial-main space-y-5"><p className="editorial-eyebrow">INVOICES / ISOLATED SANDBOX</p><h1 className="text-3xl">Recurring billing · TEST MODE ONLY</h1>
 <p>This optional experiment creates one synthetic Stripe test customer and a $1 USD monthly test subscription with a two-day trial. It automatically cancels at trial end. No card or email address is collected, no email is sent, and no real charge is made.</p>
 <p>Your existing invoices, customers, paid plan, and payment links are unchanged. This does not enroll any customer in recurring billing. One experiment per account; retries reuse the same resources.</p>
 <p role="status">Sandbox status: {status}. {actor&&!available?'Disabled: dedicated test configuration is not available.':''}</p><p role="alert">{error}</p>
 <fieldset disabled={busy||!actor||!available} className="space-y-4"><label className="block"><input type="checkbox" checked={consent} disabled={!!pending} onChange={e=>setConsent(e.target.checked)}/> I explicitly opt in to synthetic TEST MODE ONLY resources and the two-day auto-cancel trial.</label>
 <button className="border rounded p-3" disabled={!consent||!!pending||(status!=='Not started'&&status!=='pending')} onClick={()=>void act('create')}>Create test-only trial</button>{' '}
 <button className="border rounded p-3" disabled={!!pending||status==='Not started'||status==='pending'} onClick={()=>void act('refresh')}>Refresh from Stripe test mode</button>{' '}
 <button className="border rounded p-3" disabled={!!pending||status==='Not started'||status==='pending'||status==='canceled'} onClick={()=>void act('cancel')}>Cancel test subscription now</button>
 {pending&&<button className="border rounded p-3" onClick={()=>void act(pending)}>Retry same {pending} operation</button>}</fieldset>
 <p>After an interrupted request, retry the same action. Resources remain recorded separately for reconciliation; this page never resets an uncertain experiment. For an incomplete experiment older than 23 hours, an operator must reconcile its test resources.</p>
 <a className="underline" href="/workspace/invoices">Back to existing invoices</a></main></div>;
}
