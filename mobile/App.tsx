import 'react-native-url-polyfill/auto';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, AppState, Linking, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import {signOutWarning, sameSession} from './src/sessionExit';
import {createLoadGate, filterProjects} from './src/projectBrowser';
import {loadWork, manualTime, saveTime, type Project, type Entry} from './src/workflow';

function Button({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} onPress={onPress} disabled={disabled} style={[styles.button,disabled&&styles.disabled]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
function Workspace({db}:{db:SupabaseClient}) {
 const [actor,setActor]=useState<string|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [projects,setProjects]=useState<Project[]>([]),[entries,setEntries]=useState<Entry[]>([]),[projectId,setProjectId]=useState('');
 const [minutes,setMinutes]=useState(''),[description,setDescription]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[truncated,setTruncated]=useState(false);
 const [loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading'),[loadError,setLoadError]=useState(''),[query,setQuery]=useState(''),[hasLoaded,setHasLoaded]=useState(false);
 const loadGate=useRef(createLoadGate());
 const [review,setReview]=useState<Record<string,unknown>|null>(null);
 const pending=useRef<Record<string,unknown>|null>(null), generation=useRef(0), currentActor=useRef<string|null>(null), acting=useRef(false);
 useEffect(()=>{
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
   const id=session?.user.id||null;
   if(id!==currentActor.current){generation.current++;loadGate.current.invalidate();setLoadState('loading');setLoadError('');setQuery('');setHasLoaded(false);currentActor.current=id;pending.current=null;setReview(null);setProjects([]);setEntries([]);setProjectId('');setMinutes('');setDescription('');setMessage('');setActor(id);}
  });
  const state=AppState.addEventListener('change',value=>{if(value==='active')db.auth.startAutoRefresh();else db.auth.stopAutoRefresh();});
  return()=>{subscription.unsubscribe();state.remove();db.auth.stopAutoRefresh();};
 },[db]);
 async function refresh(id:string){
  const request=loadGate.current.begin();
  setLoadState('loading');setLoadError('');
  try {
   const data=await loadWork(db,id);
   if(!request.isCurrent()||currentActor.current!==id)return;
   setProjects(data.projects);setEntries(data.entries);setTruncated(data.projectsTruncated);setHasLoaded(true);setLoadState('ready');
   // Never change the project attached to an uncertain save.
   if(!pending.current)setProjectId(selected=>data.projects.some(p=>p.id===selected)?selected:data.projects[0]?.id||'');
  } catch(e) {
   if(!request.isCurrent()||currentActor.current!==id)return;
   setLoadState('error');setLoadError('Could not refresh your work. Check your connection and retry. Any previously loaded entries below may be out of date.');
   throw e;
  }
 }
 useEffect(()=>{if(actor)void refresh(actor).catch(()=>{});},[actor]);
 async function action(fn:()=>Promise<void>){
  if(acting.current)return; acting.current=true;setBusy(true);setMessage('');
  try{await fn();}catch(e){setMessage(e instanceof Error?e.message:'Something went wrong. Please retry.');}
  finally{acting.current=false;setBusy(false);}
 }
 function prepareReview(){
  try {
   if(!actor)return;
   setReview(manualTime(actor,Crypto.randomUUID(),projectId,minutes,description,Date.now()));setMessage('');
  } catch(e){setMessage(e instanceof Error?e.message:'Check the entry and retry.');}
 }
 function requestSignOut(){
  if(acting.current)return;
  const id=currentActor.current, epoch=generation.current;
  const finish=()=>{
   // A dialog opened by a departed account cannot sign out a newer session.
   if(!sameSession(id,epoch,currentActor.current,generation.current)||acting.current)return;
   void action(async()=>{const {error}=await db.auth.signOut({scope:'local'});if(error)throw Error('Sign-out was not confirmed. Please retry.');});
  };
  const warning=signOutWarning(!!pending.current,!!review,minutes,description);
  if(!warning){finish();return;}
  Alert.alert(warning.title,warning.message,[
   {text:'Keep working',style:'cancel'},
   {text:'Sign out anyway',style:'destructive',onPress:finish}
  ],{cancelable:true});
 }
 async function submit(){
  if(!actor)return;
  const id=actor,g=generation.current;
  if(!pending.current){
   if(!review)throw Error('Review this entry before saving.');
   pending.current=review;setReview(null);
  }
  await saveTime(db,pending.current);
  if(g!==generation.current||currentActor.current!==id)return;
  pending.current=null;setMinutes('');setDescription('');setMessage('Time saved. This entry is nonbillable; no invoice or charge was created.');
  try{await refresh(id);}catch{setMessage('Time saved. Refresh to see your latest entries; do not submit it again.');}
 }
 return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <View style={styles.brandRow}><View style={styles.monogram}><Text style={styles.monogramText}>M</Text></View><View><Text style={styles.brand}>MicroFreelanceHub</Text><Text style={styles.caption}>CLIENT WORK, IN FOCUS</Text></View></View><Text style={styles.heading}>{actor?'Make today count.':'Good work. Less admin.'}</Text>
  {message!==''&&<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text>}
  {busy&&<ActivityIndicator accessibilityLabel="Working" color="#194d41"/>}
  {!actor?<>
   <Text style={styles.body}>Sign in with your existing account. This prototype keeps the session only in memory; sign in again after closing the app.</Text>
   <Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Email" style={styles.input} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} editable={!busy}/>
   <Text style={styles.label}>Password</Text><TextInput accessibilityLabel="Password" style={styles.input} secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} editable={!busy}/>
   <Button title="Sign in" disabled={busy||!email.trim()||!password} onPress={()=>void action(async()=>{const {error}=await db.auth.signInWithPassword({email:email.trim(),password});if(error)throw Error('Sign-in failed. Check your details or use the website to recover access.');setPassword('');})}/>
   <Text style={styles.body}>Google-only sign-in and account recovery are not supported in this first native build. Use the website for those flows. No account is created here.</Text>
  </>:<>
   <View style={styles.row}><Button title="Refresh" disabled={busy||!!review} onPress={()=>void action(()=>refresh(actor))}/><Button title="Sign out" disabled={busy} onPress={requestSignOut}/></View>
   {loadState==='loading'&&<Text accessibilityLiveRegion="polite" style={styles.notice}>Loading your projects and recent time...</Text>}
   {loadState==='error'&&<Text accessibilityRole="alert" style={styles.notice}>{loadError}</Text>}
   {hasLoaded&&<View style={styles.overview}><View><Text style={styles.metric}>{projects.length}{truncated?'+':''}</Text><Text style={styles.caption}>ACTIVE PROJECTS</Text></View><View><Text style={styles.metric}>{Math.round(entries.reduce((sum,e)=>sum+(e.seconds||0),0)/60)}</Text><Text style={styles.caption}>MINUTES IN LATEST ENTRIES</Text></View></View>}<Text style={styles.subheading}>Log completed time</Text><Text style={styles.body}>Record work ending now, up to 24 hours. Entries are nonbillable; review billing details on the website.</Text>
   {projects.length===0&&!pending.current?(loadState==='ready'?<Text style={styles.notice}>No active projects are available. Create a client and project on the website, then refresh here.</Text>:null):<>
    <Text style={styles.label}>Choose a project</Text><TextInput accessibilityLabel="Search loaded projects" placeholder="Search loaded projects" value={query} onChangeText={setQuery} style={styles.input} maxLength={100}/>
    <Text style={styles.body}>Selected: {projects.find(p=>p.id===projectId)?.name||'Previously selected project'}</Text>
    {filterProjects(projects,query).length===0&&<Text style={styles.notice}>No loaded projects match. Clear your search to see the list; your selection has not changed.</Text>}
    {filterProjects(projects,query).map(p=><Pressable key={p.id} accessibilityRole="radio" accessibilityState={{checked:p.id===projectId,disabled:busy||!!pending.current||!!review}} disabled={busy||!!pending.current||!!review} onPress={()=>setProjectId(p.id)} style={[styles.project,p.id===projectId&&styles.selected]}><Text style={styles.body}>{p.id===projectId?'✓ ':''}{p.name}</Text></Pressable>)}
    {truncated&&<Text style={styles.notice}>Showing the first 200 active projects. Use the website for the full list.</Text>}
    <Text style={styles.label}>Minutes worked</Text><TextInput accessibilityLabel="Minutes worked" keyboardType="number-pad" maxLength={4} value={minutes} onChangeText={setMinutes} editable={!busy&&!pending.current&&!review} style={styles.input}/>
    <Text style={styles.label}>Work note (optional)</Text><TextInput accessibilityLabel="Work note" multiline maxLength={2000} value={description} onChangeText={setDescription} editable={!busy&&!pending.current&&!review} style={styles.input}/>
    {review&&<View style={styles.helpCard} accessibilityLabel="Review time entry"><Text style={styles.subheading}>Review before saving</Text><Text style={styles.body}>Project: {projects.find(p=>p.id===String(review.projectId))?.name||'Selected project'}</Text><Text style={styles.body}>{Number(review.seconds)/60} minutes - Nonbillable</Text><Text style={styles.body}>Started: {new Date(String(review.startedAt)).toLocaleString()}</Text><Text style={styles.body}>{String(review.description)||'No work note'}</Text><Text style={styles.body}>No invoice or customer charge will be created. Nothing is saved until you confirm.</Text><Button title="Confirm and save time" disabled={busy||loadState!=='ready'} onPress={()=>void action(submit)}/><Button title="Edit entry" disabled={busy} onPress={()=>setReview(null)}/></View>}
    {!review&&<Button title={pending.current?'Retry the same entry':'Review time entry'} disabled={busy||!projectId||!minutes||(!pending.current&&loadState!=='ready')} onPress={()=>pending.current?void action(submit):prepareReview()}/>}
    {pending.current&&<Text style={styles.notice}>The outcome is uncertain. Retry uses the same operation ID to prevent duplicate time. Keep this app open until the save is confirmed.</Text>}
   </>}
   <Text style={styles.subheading}>Latest 20 completed entries</Text>{entries.length===0?(loadState==='ready'?<Text style={styles.body}>No completed time yet. Your first entry will appear here after it is saved.</Text>:null):entries.map(e=><View key={e.id} style={styles.project}><Text style={styles.label}>{projects.find(p=>p.id===e.project_id)?.name||'Project'}</Text><Text style={styles.body}>{Math.round((e.seconds||0)/60)} minutes · {new Date(e.started_at).toLocaleDateString()}</Text><Text style={styles.body}>{e.description}</Text></View>)}
  </>}
 <View style={styles.helpCard}><Text style={styles.label}>Your wider workspace</Text><Text style={styles.body}>Clients, bookings and invoices are available on the website. These links open your browser; its sign-in is separate.</Text><Button title="Open web workspace" onPress={()=>void Linking.openURL('https://www.microfreelancehub.com/features').catch(()=>setMessage('Could not open the browser. Visit microfreelancehub.com/features.'))}/><Button title="Help & support" onPress={()=>void Linking.openURL('https://www.microfreelancehub.com/support').catch(()=>setMessage('Could not open support. Email support@microfreelancehub.com.'))}/></View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export default function App(){
 const db=useMemo(()=>{
  const url=process.env.EXPO_PUBLIC_SUPABASE_URL,key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url))return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
 },[]);
 return <SafeAreaProvider>{db?<Workspace db={db}/>:<SafeAreaView style={styles.content}><Text style={styles.heading}>Setup required</Text><Text style={styles.body}>Set the public Supabase URL and anonymous key for an isolated test project before building. Never put service-role or provider secrets in this app.</Text></SafeAreaView>}</SafeAreaProvider>;
}
const styles=StyleSheet.create({brandRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},monogram:{backgroundColor:'#194d41',borderRadius:14,width:46,height:46,alignItems:'center',justifyContent:'center'},monogramText:{color:'#fff',fontSize:26,fontWeight:'700'},caption:{fontSize:11,letterSpacing:0.7,color:'#50675e',marginTop:5},overview:{flexDirection:'row',flexWrap:'wrap',gap:24,padding:22,backgroundColor:'#eaf0e8',borderRadius:20,marginTop:8},metric:{fontSize:32,fontWeight:'700',color:'#183e34'},helpCard:{marginTop:24,padding:20,borderRadius:20,backgroundColor:'#eef2eb',gap:14},safe:{flex:1,backgroundColor:'#fbfcfa'},content:{padding:24,paddingBottom:48,gap:14},brand:{fontSize:16,fontWeight:'700',color:'#194d41'},heading:{fontSize:28,fontWeight:'700',color:'#183e34'},subheading:{fontSize:22,fontWeight:'700',color:'#183e34',marginTop:16},body:{fontSize:16,lineHeight:24,color:'#244d3b'},label:{fontSize:16,fontWeight:'600',color:'#183e34'},input:{borderWidth:1,borderColor:'#91a999',borderRadius:10,padding:14,fontSize:18,minHeight:48,color:'#183e34',backgroundColor:'#fff'},button:{backgroundColor:'#194d41',padding:14,borderRadius:10,minHeight:48,justifyContent:'center'},buttonText:{color:'#fff',fontSize:16,fontWeight:'600',textAlign:'center'},disabled:{opacity:0.5},notice:{padding:14,backgroundColor:'#eef3e8',color:'#183e34',fontSize:16,lineHeight:24,borderRadius:10},project:{borderWidth:1,borderColor:'#cad6ca',padding:14,borderRadius:10,minHeight:48},selected:{backgroundColor:'#e6eedf',borderColor:'#194d41',borderWidth:2},row:{flexDirection:'row',gap:12,flexWrap:'wrap'}});
