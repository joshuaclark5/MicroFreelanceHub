import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import type {SupabaseClient} from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import {currencies,totalMinor,type InvoiceDocument} from '../../app/lib/workspaceInvoices';
import {formatMoney} from '../../app/lib/workspacePresentation';
import {createInvoiceDraft,freshInvoice,InvoiceAccountChanged,invoiceText,loadInvoiceRefs,loadInvoices,prepareInvoiceDraft,type DraftForm,type DraftOperation,type Invoice,type InvoiceRef,type Page} from './invoiceData';

function Action({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}){return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[s.button,disabled&&s.disabled]}><Text style={s.buttonText}>{title}</Text></Pressable>;}
const label=(row:Invoice)=>row.number===null?'Unissued draft':'Invoice #'+row.number;
function Details({document,client,project,total}:{document:InvoiceDocument;client:string;project:string;total:number}){
 return <View style={s.group}><Text style={s.label}>Client: {invoiceText(client)}</Text><Text style={s.body}>Project: {invoiceText(project)}</Text><Text style={s.body}>Seller: {invoiceText(document.seller)}</Text><Text style={s.body}>Issue date: {document.issueDate} / Due date: {document.dueDate}</Text>{document.lines.map((line,i)=><View key={i} style={s.line}><Text style={s.body}>{invoiceText(line.description)}</Text><Text style={s.body}>{line.quantity} × {formatMoney(line.unitMinor,document.currency)} = {formatMoney(line.quantity*line.unitMinor,document.currency)}</Text></View>)}<Text style={s.total}>Total: {formatMoney(total,document.currency)} ({document.currency})</Text>{document.memo!==''&&<Text style={s.body}>Memo: {invoiceText(document.memo)}</Text>}</View>;
}
const empty=<T,>():Page<T>=>({rows:[],next:null});
export default function NativeInvoices({db,actor,visible,onDirtyChange}:{db:SupabaseClient;actor:string;visible:boolean;onDirtyChange:(dirty:boolean)=>void}){
 const [invoices,setInvoices]=useState<Page<Invoice>>(empty),[clients,setClients]=useState<Page<InvoiceRef>>(empty),[projects,setProjects]=useState<Page<InvoiceRef>>(empty);
 const [loaded,setLoaded]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<'all'|'draft'|'issued'|'void'>('all');
 const [selected,setSelected]=useState<Invoice|null>(null),[form,setForm]=useState<DraftForm|null>(null),[review,setReview]=useState<DraftOperation|null>(null),[pending,setPending]=useState<DraftOperation|null>(null),[busy,setBusy]=useState(false);
 const [fenced,setFenced]=useState(false);
 const live=useRef(true),epoch=useRef(0),read=useRef(0),writing=useRef(false),reading=useRef(false);
 const currentActor=useRef(actor);currentActor.current=actor;
 const dirty=!!form||!!review||!!pending;
 useEffect(()=>{onDirtyChange(dirty);},[dirty,onDirtyChange]);
 useEffect(()=>{live.current=true;epoch.current++;setInvoices(empty());setClients(empty());setProjects(empty());setLoaded(false);setSelected(null);setForm(null);setReview(null);setPending(null);setFenced(false);setError('');setNotice('');return()=>{live.current=false;epoch.current++;read.current++;};},[db,actor]);
 useEffect(()=>{if(visible&&!loaded&&!reading.current)void refresh();},[visible,actor]);
 function active(id:string,e:number){return live.current&&currentActor.current===id&&epoch.current===e;}
 function fence(){epoch.current++;read.current++;reading.current=false;setFenced(true);setInvoices(empty());setClients(empty());setProjects(empty());setSelected(null);setLoaded(false);setLoading(false);setBusy(false);setNotice('');}
 async function refresh(){
  if(reading.current)return;reading.current=true;
  const id=actor,e=epoch.current,r=++read.current;setLoading(true);setError('');
  try{
   // Fence immediately when any request verifies a different account. Waiting
   // for sibling network requests would leave private inputs visible if one
   // hangs. Epoch/request checks prevent abandoned siblings reopening the UI.
   const watchAccount=<T,>(request:Promise<T>)=>request.catch(error=>{
    if(error instanceof InvoiceAccountChanged&&active(id,e)&&r===read.current)fence();
    throw error;
   });
   const results=await Promise.allSettled([watchAccount(loadInvoices(db,id)),watchAccount(loadInvoiceRefs(db,id,'clients')),watchAccount(loadInvoiceRefs(db,id,'projects'))]);
   const mismatch=results.find(result=>result.status==='rejected'&&result.reason instanceof InvoiceAccountChanged);
   if(mismatch?.status==='rejected')throw mismatch.reason;
   const failed=results.find(result=>result.status==='rejected');if(failed?.status==='rejected')throw failed.reason;
   const [next,c,p]=results.map(result=>(result as PromiseFulfilledResult<Page<Invoice>|Page<InvoiceRef>>).value);
   if(!active(id,e)||r!==read.current)return;
   setInvoices(next as Page<Invoice>);setClients(c as Page<InvoiceRef>);setProjects(p as Page<InvoiceRef>);setLoaded(true);setSelected(null);setFenced(false);
  }catch(error){if(active(id,e)&&r===read.current){if(error instanceof InvoiceAccountChanged){fence();return;}setInvoices(empty());setClients(empty());setProjects(empty());setSelected(null);setLoaded(false);setError('Could not refresh invoices. No current records are shown. Your draft and retry identity are kept. Check your connection and retry.');}}
  finally{if(r===read.current)reading.current=false;if(active(id,e)&&r===read.current)setLoading(false);}
 }
 async function more(kind:'invoices'|'clients'|'projects'){
  const page=kind==='invoices'?invoices:kind==='clients'?clients:projects;
  if(!page.next||reading.current)return;reading.current=true;
  const id=actor,e=epoch.current,r=++read.current;setLoading(true);setError('');
  try{
   const next=kind==='invoices'?await loadInvoices(db,id,page.next):await loadInvoiceRefs(db,id,kind,page.next);
   if(!active(id,e)||r!==read.current)return;
   if(kind==='invoices')setInvoices(old=>({rows:[...old.rows,...(next.rows as Invoice[])],next:next.next}));
   else (kind==='clients'?setClients:setProjects)(old=>({rows:[...old.rows,...(next.rows as InvoiceRef[])],next:next.next}));
  }catch(error){if(active(id,e)&&r===read.current){if(error instanceof InvoiceAccountChanged){fence();return;}setError('Could not load more records. The current list is incomplete; retry loading more.');}}
  finally{if(r===read.current)reading.current=false;if(active(id,e)&&r===read.current)setLoading(false);}
 }
 function discard(){
  if(writing.current)return;
  const id=actor,e=epoch.current;
  Alert.alert('Discard invoice draft?',pending?'The last save may already have succeeded. Discarding loses the retry identity. Check saved invoices before creating another.':'Unsaved invoice details will be discarded.',[
   {text:'Keep draft',style:'cancel'},
   {text:'Discard draft',style:'destructive',onPress:()=>{if(!active(id,e)||writing.current)return;setForm(null);setReview(null);setPending(null);setError('');}}
  ]);
 }
 function prepare(){
  if(!form||writing.current)return;
  try{
   if(!clients.rows.some(c=>c.id===form.clientId))throw Error('Select a loaded client.');
   if(form.projectId&&!projects.rows.some(p=>p.id===form.projectId&&p.client_id===form.clientId))throw Error('Select a project belonging to this client.');
   setReview(prepareInvoiceDraft(actor,Crypto.randomUUID(),form));setError('');
  }catch(e){setError(e instanceof Error?e.message:'Check the draft details.');}
 }
 async function submit(){
  const op=pending||review;if(!op||writing.current||reading.current||fenced)return;
  writing.current=true;const id=actor,e=epoch.current;setBusy(true);setError('');setNotice('');setPending(op);setReview(null);
  try{
   const saved=await createInvoiceDraft(db,op);
   if(!active(id,e))return;
   setForm(null);setPending(null);setNotice('Draft saved. No invoice issued, message sent or payment collected.');
   await refresh();if(active(id,e))setSelected(saved);
  }catch(error){if(active(id,e)){if(error instanceof InvoiceAccountChanged){fence();return;}setError(error instanceof Error?error.message:'The save outcome is unknown. Retry the same operation.');}}
  finally{writing.current=false;if(active(id,e))setBusy(false);}
 }
 const change=(key:keyof DraftForm,value:unknown)=>setForm(old=>old?{...old,[key]:value}:old);
 const clientName=(d:InvoiceDocument)=>clients.rows.find(c=>c.id===d.clientId)?.name||'Client '+d.clientId;
 const projectName=(d:InvoiceDocument)=>d.projectId?(projects.rows.find(p=>p.id===d.projectId)?.name||'Linked project (not loaded)'):'No project';
 const savedClient=(i:Invoice)=>i.snapshot?String((i.snapshot.clientSnapshot as {name:string}).name):clientName(i.document);
 const displayed=invoices.rows.filter(i=>(filter==='all'||i.status===filter)&&[label(i),savedClient(i),i.document.memo,...i.document.lines.map(l=>l.description)].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 if(fenced)return <View style={s.group}><Text accessibilityRole="alert" style={s.notice}>Your invoice account changed. Private records and drafts are hidden. Return to the original account, then verify it here. Any unconfirmed save may already have succeeded; its retry identity is kept only while this screen remains open.</Text>{error!==''&&<Text accessibilityRole="alert" style={s.notice}>{error}</Text>}<Action title="Verify original invoice account" disabled={loading||busy} onPress={()=>void refresh()}/></View>;
 return <View style={s.group}>
  <Text accessibilityRole="header" style={s.heading}>Invoices</Text>
  <Text style={s.body}>View saved records and create invoice drafts. Issuing, editing, recurring drafts and payment workflows are not available here yet. This screen does not collect payments or calculate tax and discounts.</Text>
  {loading&&<ActivityIndicator accessibilityLabel="Loading invoices"/>}
  {error!==''&&<Text accessibilityRole="alert" style={s.notice}>{error}</Text>}
  {notice!==''&&<Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
  <Action title="Refresh invoices" disabled={busy||loading} onPress={()=>void refresh()}/>
  {pending&&<View style={s.card}><Text style={s.heading}>Save not confirmed</Text><Text style={s.body}>Keep the app open. Retry uses the same reviewed details and operation ID to avoid a duplicate. Drafts and retry identities are held in memory, not offline storage.</Text><Details document={pending.document} client={clientName(pending.document)} project={projectName(pending.document)} total={totalMinor(pending.document)}/><Action title="Retry same invoice draft" disabled={busy||loading} onPress={()=>void submit()}/><Action title="Discard invoice retry" disabled={busy} onPress={discard}/></View>}
  {review&&<View style={s.card} accessibilityLabel="Review invoice draft"><Text style={s.heading}>Review before saving</Text><Details document={review.document} client={clientName(review.document)} project={projectName(review.document)} total={totalMinor(review.document)}/><Text style={s.body}>Nothing is saved until you confirm. This creates an unissued draft only; no email or charge.</Text><Action title="Confirm and save invoice draft" disabled={busy||loading} onPress={()=>void submit()}/><Action title="Back to invoice editing" disabled={busy} onPress={()=>setReview(null)}/></View>}
  {form&&!review&&!pending&&<View style={s.card}>
   <Text style={s.heading}>New invoice draft</Text><Text style={s.label}>Client</Text>
   {clients.rows.map(c=><Pressable key={c.id} accessibilityRole="radio" accessibilityLabel={'Client: '+invoiceText(c.name)} accessibilityState={{checked:form.clientId===c.id}} onPress={()=>setForm(old=>old?{...old,clientId:c.id,projectId:null}:old)} style={[s.choice,form.clientId===c.id&&s.selected]}><Text style={s.body}>{invoiceText(c.name)}</Text></Pressable>)}
   {!clients.rows.length&&<Text style={s.body}>Add a client in Work, then refresh invoices.</Text>}
   {clients.next&&<><Text style={s.body}>More clients are available.</Text><Action title="Load more invoice clients" disabled={loading} onPress={()=>void more('clients')}/></>}
   <Text style={s.label}>Project (optional)</Text>
   {[{id:'',name:'No project'},...projects.rows.filter(p=>p.client_id===form.clientId)].map(p=><Pressable key={p.id} accessibilityRole="radio" accessibilityLabel={'Project: '+invoiceText(p.name)} accessibilityState={{checked:(form.projectId||'')===p.id}} onPress={()=>change('projectId',p.id||null)} style={[s.choice,(form.projectId||'')===p.id&&s.selected]}><Text style={s.body}>{invoiceText(p.name)}</Text></Pressable>)}
   {projects.next&&<><Text style={s.body}>The project list is incomplete. Load more to find other projects for this client.</Text><Action title="Load more invoice projects" disabled={loading} onPress={()=>void more('projects')}/></>}
   <Text style={s.label}>Seller details</Text><TextInput accessibilityLabel="Invoice seller details" style={s.input} value={form.seller} onChangeText={v=>change('seller',v)} multiline maxLength={1000}/>
   <Text style={s.label}>Currency</Text><View style={s.choices}>{currencies.map(c=><Pressable key={c} accessibilityRole="radio" accessibilityLabel={'Invoice currency '+c} accessibilityState={{checked:c===form.currency}} style={[s.choice,c===form.currency&&s.selected]} onPress={()=>change('currency',c)}><Text style={s.body}>{c}</Text></Pressable>)}</View><Text style={s.body}>Use normal prices without commas: 125.50 USD, 125 JPY or 125.500 KWD. Changing currency keeps the entered prices; review them again.</Text>
   {(['issueDate','dueDate'] as const).map(k=><View key={k} style={s.group}><Text style={s.label}>{k==='issueDate'?'Issue':'Due'} date (YYYY-MM-DD)</Text><TextInput accessibilityLabel={k==='issueDate'?'Invoice issue date':'Invoice due date'} value={form[k]} onChangeText={v=>change(k,v)} style={s.input} autoCapitalize="none" maxLength={10}/></View>)}
   {form.lines.map((line,i)=><View key={i} style={s.line}><Text style={s.label}>Line {i+1}</Text>{(['description','quantity','price'] as const).map(k=><View key={k} style={s.group}><Text style={s.label}>{k==='price'?'Unit price ('+form.currency+')':k==='quantity'?'Whole quantity':'Description'}</Text><TextInput accessibilityLabel={'Invoice line '+(i+1)+' '+k} value={line[k]} keyboardType={k==='quantity'?'number-pad':k==='price'?'decimal-pad':'default'} maxLength={k==='description'?300:k==='quantity'?5:20} style={s.input} onChangeText={v=>change('lines',form.lines.map((l,j)=>i===j?{...l,[k]:v}:l))}/></View>)}<Action title={'Remove invoice line '+(i+1)} disabled={form.lines.length===1} onPress={()=>change('lines',form.lines.filter((_,j)=>j!==i))}/></View>)}
   <Action title="Add invoice line" disabled={form.lines.length>=30} onPress={()=>change('lines',[...form.lines,{description:'',quantity:'1',price:''}])}/>
   <Text style={s.label}>Memo (optional)</Text><TextInput accessibilityLabel="Invoice memo" style={s.input} value={form.memo} onChangeText={v=>change('memo',v)} multiline maxLength={2000}/>
   <Action title="Review invoice draft" disabled={busy||loading||!loaded} onPress={prepare}/><Action title="Cancel invoice draft" disabled={busy} onPress={discard}/>
  </View>}
  {!dirty&&<Action title="New invoice draft" disabled={!loaded||loading||busy} onPress={()=>{setForm(freshInvoice());setSelected(null);setError('');setNotice('');}}/>}
  {selected&&<View style={s.card} accessibilityLabel="Saved invoice details"><Text style={s.heading}>{label(selected)}</Text><Text style={s.body}>Status: {selected.status} · version {selected.version}</Text><Details document={selected.document} client={selected.snapshot?String((selected.snapshot.clientSnapshot as {name:string}).name):clientName(selected.document)} project={projectName(selected.document)} total={selected.total_minor}/>{selected.snapshot&&<Text style={s.body}>Issued snapshot from {String(selected.snapshot.issuedAt)}. This record does not establish payment status.</Text>}<Action title="Close invoice details" onPress={()=>setSelected(null)}/></View>}
  <Text style={s.heading}>Saved invoices</Text><TextInput accessibilityLabel="Search loaded invoices" placeholder="Search loaded invoices" value={query} onChangeText={setQuery} style={s.input} maxLength={100}/>
  <View style={s.choices}>{(['all','draft','issued','void'] as const).map(status=><Pressable key={status} accessibilityRole="radio" accessibilityLabel={'Invoice status '+status} accessibilityState={{checked:filter===status}} style={[s.choice,filter===status&&s.selected]} onPress={()=>setFilter(status)}><Text style={s.body}>{status==='all'?'All':status==='draft'?'Drafts':status==='issued'?'Issued':'Void'}</Text></Pressable>)}</View>
  {loaded&&!displayed.length&&<Text style={s.body}>{query||filter!=='all'?'No loaded invoices match these filters.':'No saved invoices yet.'}</Text>}
  {displayed.map(row=><View key={row.id} style={s.card}><Text style={s.label}>{label(row)} · {row.status}</Text><Text style={s.body}>{invoiceText(savedClient(row))}</Text><Text style={s.total}>{formatMoney(row.total_minor,row.document.currency)} ({row.document.currency})</Text><Text style={s.body}>Due {row.document.dueDate}</Text><Action title={'View '+label(row)+' '+row.id.slice(0,8)} onPress={()=>setSelected(row)}/></View>)}
  {invoices.next&&<><Text style={s.notice}>This list is incomplete. Search and status filters cover loaded invoices only.</Text><Action title="Load more invoices" disabled={loading||busy} onPress={()=>void more('invoices')}/></>}
 </View>;
}
const s=StyleSheet.create({group:{gap:12},card:{padding:16,gap:12,borderRadius:12,borderWidth:1,borderColor:'#cad6ca'},heading:{fontSize:22,fontWeight:'700',color:'#183e34'},label:{fontSize:16,fontWeight:'600',color:'#183e34'},body:{fontSize:16,lineHeight:24,color:'#244d3b'},total:{fontSize:20,fontWeight:'700',color:'#183e34'},button:{padding:14,minHeight:48,backgroundColor:'#194d41',borderRadius:10},buttonText:{fontSize:16,textAlign:'center',fontWeight:'600',color:'#fff'},disabled:{opacity:.5},input:{padding:14,minHeight:48,borderWidth:1,borderColor:'#91a999',borderRadius:10,fontSize:18,color:'#183e34',backgroundColor:'#fff'},choices:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{padding:12,minHeight:48,borderWidth:1,borderColor:'#91a999',borderRadius:10},selected:{backgroundColor:'#e6eedf',borderColor:'#194d41'},line:{gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#cad6ca'},notice:{padding:14,backgroundColor:'#eef3e8',color:'#183e34',fontSize:16,lineHeight:24}});
