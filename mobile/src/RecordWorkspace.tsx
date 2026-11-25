import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import type {SupabaseClient} from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import {fields} from '../../app/lib/connectedWorkspace';
import {loadRecordPage,prepareRecord,recordSections,saveRecord,type RecordOperation,type RecordPage,type RecordSection,type WorkspaceRow} from './workspaceRecords';

const titles:Record<RecordSection,string>={clients:'Clients',stages:'Pipeline stages',projects:'Projects',tasks:'Tasks'};
const labels:Record<string,string>={name:'Name',email:'Email',phone:'Phone',notes:'Notes',position:'Stage order',title:'Task title',due_date:'Due date (YYYY-MM-DD)',status:'Status',client_id:'Client',stage_id:'Pipeline stage',project_id:'Project'};
const empty=():Record<RecordSection,RecordPage>=>({clients:{rows:[],next:null},stages:{rows:[],next:null},projects:{rows:[],next:null},tasks:{rows:[],next:null}});
const name=(r:WorkspaceRow)=>String(r.name||r.title||'Record');
function Action({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}){return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[s.button,disabled&&s.disabled]}><Text style={s.buttonText}>{title}</Text></Pressable>;}
export default function RecordWorkspace({db,actor,onDirtyChange,onSaved}:{db:SupabaseClient;actor:string;onDirtyChange:(dirty:boolean)=>void;onSaved:()=>void}){
 const [section,setSection]=useState<RecordSection>('clients'),[data,setData]=useState(empty),[loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState('');
 const [form,setForm]=useState<Record<string,unknown>|null>(null),[editing,setEditing]=useState<WorkspaceRow|null>(null),[review,setReview]=useState<RecordOperation|null>(null),[pending,setPending]=useState<RecordOperation|null>(null),[busy,setBusy]=useState(false);
 const live=useRef(true),revision=useRef(0),writing=useRef(false);
 const dirty=!!form||!!review||!!pending;
 useEffect(()=>{onDirtyChange(dirty);},[dirty,onDirtyChange]);
 useEffect(()=>{live.current=true;void refresh();return()=>{live.current=false;revision.current++;};},[db,actor]);
 async function refresh(){
  const rev=++revision.current;setLoading(true);setError('');
  try{const pages=await Promise.all(recordSections.map(k=>loadRecordPage(db,k,actor)));if(!live.current||rev!==revision.current)return;setData(Object.fromEntries(recordSections.map((k,i)=>[k,pages[i]])) as Record<RecordSection,RecordPage>);setLoaded(true);}
  catch{if(live.current&&rev===revision.current)setError('Could not refresh workspace records. Any records shown may be out of date. Your draft is kept.');}
  finally{if(live.current&&rev===revision.current)setLoading(false);}
 }
 async function more(target:RecordSection){
  const after=data[target].next;if(!after||loading)return;
  const rev=++revision.current;setLoading(true);setError('');
  try{const page=await loadRecordPage(db,target,actor,after);if(!live.current||rev!==revision.current)return;setData(old=>({...old,[target]:{rows:[...old[target].rows,...page.rows.filter(r=>!old[target].rows.some(o=>o.id===r.id))],next:page.next}}));}
  catch{if(live.current&&rev===revision.current)setError('Could not load more records. Try again; the current list is incomplete.');}
  finally{if(live.current&&rev===revision.current)setLoading(false);}
 }
 function discard(next?:RecordSection){
  if(writing.current)return;
  const clear=()=>{if(!live.current||writing.current)return;setForm(null);setEditing(null);setReview(null);setPending(null);setError('');if(next){setSection(next);setQuery('');}};
  if(dirty)Alert.alert('Leave this draft?',pending?'The last operation may already have saved. Check your records before creating another. Discarding loses this retry identity.':'Unsaved changes will be discarded.',[{text:'Keep working',style:'cancel'},{text:'Discard draft',style:'destructive',onPress:clear}]);else clear();
 }
 function start(row:WorkspaceRow|null){
  if(dirty||busy||loading||!loaded)return;
  setError('');setNotice('');setEditing(row);
  setForm(row?Object.fromEntries(fields[section].map(k=>[k,row[k]])):Object.fromEntries(fields[section].map(k=>[k,k==='status'?(section==='projects'?'active':'open'):k==='position'?0:''])));
 }
 function prepare(remove=false,row=editing){
  try{setReview(prepareRecord(section,actor,row?.id||Crypto.randomUUID(),form||{},row,remove));setError('');}
  catch(e){setError(e instanceof Error?e.message:'Check your details.');}
 }
 async function submit(){
  const op=pending||review;if(!op||writing.current)return;
  writing.current=true;setBusy(true);setError('');setPending(op);setReview(null);
  try{
   await saveRecord(db,op,!!pending);if(!live.current)return;
   setForm(null);setEditing(null);setPending(null);setNotice(op.action==='delete'?'Record deleted.':'Record saved.');
   onSaved();await refresh();
  }catch(e){if(live.current)setError(e instanceof Error?e.message:'The result is uncertain. Retry the same operation.');}
  finally{writing.current=false;if(live.current)setBusy(false);}
 }
 const display=(key:string,value:unknown)=>{const related=key==='client_id'?'clients':key==='stage_id'?'stages':key==='project_id'?'projects':null;return related?name(data[related].rows.find(r=>r.id===value)||{id:'',owner_id:actor,version:1,name:'Related record (not loaded)'}):String(value??'');};
 const rows=data[section].rows.filter(r=>[r.name,r.title,r.email,r.notes].some(v=>typeof v==='string'&&v.toLowerCase().includes(query.trim().toLowerCase()))).sort((a,b)=>section==='tasks'?(String(a.status).localeCompare(String(b.status))*-1||(String(a.due_date||'9999').localeCompare(String(b.due_date||'9999')))||name(a).localeCompare(name(b))):section==='stages'?Number(a.position)-Number(b.position):name(a).localeCompare(name(b)));
 return <View style={s.container}>
  <View style={s.tabs} accessibilityRole="tablist">{recordSections.map(k=><Pressable key={k} accessibilityRole="tab" accessibilityState={{selected:k===section,disabled:busy}} disabled={busy} onPress={()=>k!==section&&discard(k)} style={[s.tab,k===section&&s.selected]}><Text style={s.label}>{titles[k]}</Text></Pressable>)}</View>
  <Text accessibilityRole="header" style={s.heading}>{titles[section]}</Text>
  <Text style={s.body}>The same workspace records as your website. {section==='tasks'?'Open tasks appear first, ordered by due date. Dates are shown as entered.':''}</Text>
  {loading&&<ActivityIndicator accessibilityLabel="Loading workspace records"/>}
  {error!==''&&<Text accessibilityRole="alert" style={s.notice}>{error}</Text>}
  {notice!==''&&<Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
  <Action title="Refresh workspace records" disabled={busy||loading||!!review} onPress={()=>void refresh()}/>
  {pending&&<View style={s.card}><Text style={s.body}>The result is not confirmed. Keep this app open. Retry checks the same record and version; it does not create a new draft.</Text><Action title="Retry same operation" disabled={busy} onPress={()=>void submit()}/><Action title="Discard retry" disabled={busy} onPress={()=>discard()}/></View>}
  {review&&<View style={s.card}><Text style={s.heading}>{review.action==='delete'?'Confirm deletion':'Review before saving'}</Text><Text style={s.body}>{review.action==='delete'?'This deletes the selected record. Remove dependent records first. This cannot be undone.':'Nothing is saved until you confirm.'}</Text>{review.action==='delete'&&<Text style={s.label}>{editing?name(editing):''}</Text>}{Object.entries(review.values).map(([k,v])=><Text key={k} style={s.body}>{labels[k]}: {display(k,v)||'Not set'}</Text>)}<Action title={review.action==='delete'?'Confirm delete':'Confirm save'} disabled={busy||loading} onPress={()=>void submit()}/><Action title={review.action==='delete'?'Keep record':'Back to editing'} disabled={busy} onPress={()=>setReview(null)}/></View>}
  {form&&!review&&!pending&&<View style={s.card}><Text style={s.heading}>{editing?'Edit record':'New record'}</Text>{fields[section].map(key=>{
   const relation:RecordSection|null=key==='client_id'?'clients':key==='stage_id'?'stages':key==='project_id'?'projects':null;
   const options=relation?data[relation].rows.map(r=>({value:r.id,label:name(r)})):key==='status'?(section==='projects'?['active','archived']:['open','done']).map(v=>({value:v,label:v})):null;
   return <View key={key} style={s.container}><Text style={s.label}>{labels[key]}</Text>{options?<><Text style={s.body}>Selected: {form[key]?display(key,form[key]):'Choose one'}</Text>{options.map(o=><Pressable key={o.value} accessibilityRole="radio" accessibilityState={{checked:form[key]===o.value}} onPress={()=>setForm(f=>({...f,[key]:o.value}))} style={[s.tab,form[key]===o.value&&s.selected]}><Text style={s.body}>{o.label}</Text></Pressable>)}{!options.length&&<Text style={s.body}>Add a {labels[key].toLowerCase()} in its workspace tab first.</Text>}{relation&&data[relation].next&&<Action title={'Load more '+titles[relation].toLowerCase()} disabled={loading} onPress={()=>void more(relation)}/>}</>:<TextInput accessibilityLabel={labels[key]} value={String(form[key]??'')} onChangeText={v=>setForm(f=>({...f,[key]:key==='position'?(v===''?'':Number(v)):v}))} style={s.input} multiline={key==='notes'} keyboardType={key==='email'?'email-address':key==='phone'?'phone-pad':key==='position'?'number-pad':'default'} autoCapitalize={['email','due_date'].includes(key)?'none':'sentences'} maxLength={key==='notes'?4000:key==='email'?254:key==='phone'?80:key==='due_date'?10:key==='position'?3:section==='stages'?80:160}/>}</View>;
  })}<Action title="Review changes" disabled={busy||loading} onPress={()=>prepare()}/><Action title="Cancel editing" onPress={()=>discard()}/></View>}
  {!dirty&&<Action title={'Add '+(section==='clients'?'client':section==='stages'?'pipeline stage':section==='projects'?'project':'task')} disabled={loading||busy||!loaded} onPress={()=>start(null)}/>}
  <TextInput accessibilityLabel={'Search loaded '+titles[section].toLowerCase()} placeholder="Search loaded records" value={query} onChangeText={setQuery} style={s.input} maxLength={100}/>
  {loaded&&rows.length===0&&<Text style={s.body}>{query?'No loaded records match.':'No records in this list yet.'}</Text>}
  {rows.map(row=><View key={row.id} style={s.card}><Text style={s.label}>{name(row)}</Text>{fields[section].filter(k=>!['name','title'].includes(k)).map(k=><Text key={k} style={s.body}>{labels[k]}: {display(k,row[k])||'Not set'}</Text>)}<Action title={'Edit '+name(row)} disabled={dirty||busy||loading} onPress={()=>start(row)}/><Action title={'Delete '+name(row)} disabled={dirty||busy||loading} onPress={()=>{setEditing(row);setReview(prepareRecord(section,actor,row.id,{},row,true));}}/></View>)}
  {data[section].next&&<><Text style={s.notice}>This list is incomplete. Search and ordering cover loaded records only.</Text><Action title="Load more records" disabled={loading||busy} onPress={()=>void more(section)}/></>}
 </View>;
}
const s=StyleSheet.create({container:{gap:12},tabs:{flexDirection:'row',flexWrap:'wrap',gap:8},tab:{padding:12,minHeight:48,borderWidth:1,borderColor:'#91a999',borderRadius:10},selected:{backgroundColor:'#e6eedf',borderColor:'#194d41'},heading:{fontSize:22,fontWeight:'700',color:'#183e34'},label:{fontSize:16,fontWeight:'600',color:'#183e34'},body:{fontSize:16,lineHeight:24,color:'#244d3b'},button:{padding:14,minHeight:48,backgroundColor:'#194d41',borderRadius:10},buttonText:{fontSize:16,textAlign:'center',fontWeight:'600',color:'#fff'},disabled:{opacity:.5},input:{padding:14,minHeight:48,borderWidth:1,borderColor:'#91a999',borderRadius:10,fontSize:18,color:'#183e34',backgroundColor:'#fff'},card:{padding:16,gap:12,borderRadius:12,borderWidth:1,borderColor:'#cad6ca'},notice:{padding:14,backgroundColor:'#eef3e8',color:'#183e34',fontSize:16,lineHeight:24}});
