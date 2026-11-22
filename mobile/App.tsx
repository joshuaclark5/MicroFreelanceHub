import 'react-native-url-polyfill/auto';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import {loadWork, manualTime, saveTime, type Project, type Entry} from './src/workflow';

function Button({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} onPress={onPress} disabled={disabled} style={[styles.button,disabled&&styles.disabled]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
function Workspace({db}:{db:SupabaseClient}) {
 const [actor,setActor]=useState<string|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [projects,setProjects]=useState<Project[]>([]),[entries,setEntries]=useState<Entry[]>([]),[projectId,setProjectId]=useState('');
 const [minutes,setMinutes]=useState(''),[description,setDescription]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[truncated,setTruncated]=useState(false);
 const pending=useRef<Record<string,unknown>|null>(null), generation=useRef(0), currentActor=useRef<string|null>(null), acting=useRef(false);
 useEffect(()=>{
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
   const id=session?.user.id||null;
   if(id!==currentActor.current){generation.current++;currentActor.current=id;pending.current=null;setProjects([]);setEntries([]);setProjectId('');setMinutes('');setDescription('');setMessage('');setActor(id);}
  });
  const state=AppState.addEventListener('change',value=>{if(value==='active')db.auth.startAutoRefresh();else db.auth.stopAutoRefresh();});
  return()=>{subscription.unsubscribe();state.remove();db.auth.stopAutoRefresh();};
 },[db]);
 async function refresh(id:string){
  const g=generation.current;
  const data=await loadWork(db,id);
  if(g!==generation.current||currentActor.current!==id)return;
  setProjects(data.projects);setEntries(data.entries);setTruncated(data.projectsTruncated);
  setProjectId(selected=>data.projects.some(p=>p.id===selected)?selected:data.projects[0]?.id||'');
 }
 useEffect(()=>{if(actor)void refresh(actor).catch(e=>{if(currentActor.current===actor)setMessage(e.message);});},[actor]);
 async function action(fn:()=>Promise<void>){
  if(acting.current)return; acting.current=true;setBusy(true);setMessage('');
  try{await fn();}catch(e){setMessage(e instanceof Error?e.message:'Something went wrong. Please retry.');}
  finally{acting.current=false;setBusy(false);}
 }
 async function submit(){
  if(!actor)return;
  const id=actor,g=generation.current;
  pending.current ||= manualTime(id,Crypto.randomUUID(),projectId,minutes,description,Date.now());
  await saveTime(db,pending.current);
  if(g!==generation.current||currentActor.current!==id)return;
  pending.current=null;setMinutes('');setDescription('');setMessage('Time saved. This entry is nonbillable; no invoice or charge was created.');
  try{await refresh(id);}catch{setMessage('Time saved. Refresh to see your latest entries; do not submit it again.');}
 }
 return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <Text style={styles.brand}>MicroFreelanceHub</Text><Text style={styles.heading}>{actor?'Capture work while it is fresh.':'Your work, with you.'}</Text>
  {message!==''&&<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text>}
  {busy&&<ActivityIndicator accessibilityLabel="Working" color="#194d41"/>}
  {!actor?<>
   <Text style={styles.body}>Sign in with your existing account. This prototype keeps the session only in memory; sign in again after closing the app.</Text>
   <Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Email" style={styles.input} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} editable={!busy}/>
   <Text style={styles.label}>Password</Text><TextInput accessibilityLabel="Password" style={styles.input} secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} editable={!busy}/>
   <Button title="Sign in" disabled={busy||!email.trim()||!password} onPress={()=>void action(async()=>{const {error}=await db.auth.signInWithPassword({email:email.trim(),password});if(error)throw Error('Sign-in failed. Check your details or use the website to recover access.');setPassword('');})}/>
   <Text style={styles.body}>Google-only sign-in and account recovery are not supported in this first native build. Use the website for those flows. No account is created here.</Text>
  </>:<>
   <View style={styles.row}><Button title="Refresh" disabled={busy} onPress={()=>void action(()=>refresh(actor))}/><Button title="Sign out" disabled={busy} onPress={()=>void action(async()=>{const {error}=await db.auth.signOut({scope:'local'});if(error)throw Error('Sign-out was not confirmed. Please retry.');})}/></View>
   <Text style={styles.subheading}>Log completed time</Text><Text style={styles.body}>Record work ending now, up to 24 hours. Entries are nonbillable; review billing details on the website.</Text>
   {projects.length===0?<Text style={styles.notice}>No active projects are available. Create a client and project on the website, then refresh here.</Text>:<>
    <Text style={styles.label}>Choose a project</Text>{projects.map(p=><Pressable key={p.id} accessibilityRole="radio" accessibilityState={{checked:p.id===projectId,disabled:busy||!!pending.current}} disabled={busy||!!pending.current} onPress={()=>setProjectId(p.id)} style={[styles.project,p.id===projectId&&styles.selected]}><Text style={styles.body}>{p.id===projectId?'✓ ':''}{p.name}</Text></Pressable>)}
    {truncated&&<Text style={styles.notice}>Showing the first 200 active projects. Use the website for the full list.</Text>}
    <Text style={styles.label}>Minutes worked</Text><TextInput accessibilityLabel="Minutes worked" keyboardType="number-pad" maxLength={4} value={minutes} onChangeText={setMinutes} editable={!busy&&!pending.current} style={styles.input}/>
    <Text style={styles.label}>Work note (optional)</Text><TextInput accessibilityLabel="Work note" multiline maxLength={2000} value={description} onChangeText={setDescription} editable={!busy&&!pending.current} style={styles.input}/>
    <Button title={pending.current?'Retry the same entry':'Save nonbillable time'} disabled={busy||!projectId||!minutes} onPress={()=>void action(submit)}/>
    {pending.current&&<Text style={styles.notice}>The outcome is uncertain. Retry uses the same operation ID to prevent duplicate time. Keep this app open until the save is confirmed.</Text>}
   </>}
   <Text style={styles.subheading}>Latest 20 completed entries</Text>{entries.length===0?<Text style={styles.body}>No completed time yet. Your first entry will appear here after it is saved.</Text>:entries.map(e=><View key={e.id} style={styles.project}><Text style={styles.label}>{projects.find(p=>p.id===e.project_id)?.name||'Project'}</Text><Text style={styles.body}>{Math.round((e.seconds||0)/60)} minutes · {new Date(e.started_at).toLocaleDateString()}</Text><Text style={styles.body}>{e.description}</Text></View>)}
  </>}
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
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#fbfcfa'},content:{padding:24,paddingBottom:48,gap:14},brand:{fontSize:16,fontWeight:'700',color:'#194d41'},heading:{fontSize:28,fontWeight:'700',color:'#183e34'},subheading:{fontSize:22,fontWeight:'700',color:'#183e34',marginTop:16},body:{fontSize:16,lineHeight:24,color:'#244d3b'},label:{fontSize:16,fontWeight:'600',color:'#183e34'},input:{borderWidth:1,borderColor:'#91a999',borderRadius:10,padding:14,fontSize:18,minHeight:48,color:'#183e34',backgroundColor:'#fff'},button:{backgroundColor:'#194d41',padding:14,borderRadius:10,minHeight:48,justifyContent:'center'},buttonText:{color:'#fff',fontSize:16,fontWeight:'600',textAlign:'center'},disabled:{opacity:0.5},notice:{padding:14,backgroundColor:'#eef3e8',color:'#183e34',fontSize:16,lineHeight:24,borderRadius:10},project:{borderWidth:1,borderColor:'#cad6ca',padding:14,borderRadius:10,minHeight:48},selected:{backgroundColor:'#e6eedf',borderColor:'#194d41',borderWidth:2},row:{flexDirection:'row',gap:12,flexWrap:'wrap'}});
