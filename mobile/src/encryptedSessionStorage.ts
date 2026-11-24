/** Encrypted-storage adapter. Publish a complete generation only after every part is saved. */
export interface SecretStore {
 getItemAsync(key:string):Promise<string|null>;
 setItemAsync(key:string,value:string):Promise<void>;
 deleteItemAsync(key:string):Promise<void>;
}
type Manifest={v:1;generation:string;count:number;length:number};
export function encryptedSessionStorage(store:SecretStore, generation:()=>string) {
 let tail:Promise<unknown>=Promise.resolve();
 function serial<T>(work:()=>Promise<T>):Promise<T> {
  const result=tail.then(work);tail=result.catch(()=>{});return result;
 }
 function base(key:string){if(!/^[\w.-]{1,180}$/.test(key))throw Error('Invalid session storage key');return 'mfh.'+key.length+'.'+key;}
 function decode(raw:string|null):Manifest|null {
  if(raw===null)return null;
  const value=JSON.parse(raw);
  if(!value||value.v!==1||!/^[-a-zA-Z0-9]{16,64}$/.test(value.generation)||!Number.isInteger(value.count)||value.count<1||value.count>256||!Number.isInteger(value.length)||value.length<0||value.length>100000)throw Error('Stored session is incomplete');
  return value;
 }
 const part=(key:string,m:Manifest,i:number)=>`${key}.${m.generation}.${i}`;
 async function cleanup(key:string,m:Manifest|null){if(m)await Promise.all(Array.from({length:m.count},(_,i)=>store.deleteItemAsync(part(key,m,i))));}
 // The journal records both generations before changing encrypted parts.
 // A new process recovers by comparing with the committed manifest, never by
 // assuming an interrupted write failed. A failed cleanup leaves the journal.
 async function recover(name:string,current:Manifest|null) {
  const raw=await store.getItemAsync(name+'.journal');if(raw===null)return;
  const journal=JSON.parse(raw);
  if(!journal||journal.v!==1||!Array.isArray(journal.generations)||journal.generations.length>2)throw Error('Stored session recovery is incomplete');
  for(const item of journal.generations){
   const m=decode(JSON.stringify(item));if(!m)throw Error('Stored session recovery is incomplete');
   if(m.generation!==current?.generation)await cleanup(name,m);
  }
  await store.deleteItemAsync(name+'.journal');
 }
 async function journal(name:string,items:(Manifest|null)[]){
  await store.setItemAsync(name+'.journal',JSON.stringify({v:1,generations:items.filter(Boolean)}));
 }
 return {
  getItem:(key:string)=>serial(async()=>{
   const name=base(key),m=decode(await store.getItemAsync(name));await recover(name,m);if(!m)return null;
   const parts=await Promise.all(Array.from({length:m.count},(_,i)=>store.getItemAsync(part(name,m,i))));
   if(parts.some(value=>value===null))throw Error('Stored session is incomplete');
   const value=parts.join('');if(value.length!==m.length)throw Error('Stored session is incomplete');return value;
  }),
  setItem:(key:string,value:string)=>serial(async()=>{
   const name=base(key);if(value.length>100000)throw Error('Session exceeds secure storage limit');
   const old=decode(await store.getItemAsync(name));await recover(name,old);
   const id=generation();if(!/^[-a-zA-Z0-9]{16,64}$/.test(id)||id===old?.generation)throw Error('Invalid session storage generation');
   // <=1600 UTF-8 bytes per part; never split a surrogate pair.
   const parts:string[]=[];let chunk='';
   for(const point of value){if(chunk.length+point.length>400){parts.push(chunk);chunk='';}chunk+=point;}
   parts.push(chunk);
   const m:Manifest={v:1,generation:id,count:parts.length,length:value.length};
   await journal(name,[old,m]);
   for(let i=0;i<parts.length;i++)await store.setItemAsync(part(name,m,i),parts[i]);
   // Do not remove parts on an uncertain write: the manifest may have committed.
   await store.setItemAsync(name,JSON.stringify(m));await recover(name,m);
  }),
  removeItem:(key:string)=>serial(async()=>{
   const name=base(key);let m:Manifest|null=null;
   const raw=await store.getItemAsync(name);
   try{m=decode(raw);}catch{/* A corrupt manifest can still be signed out. */}
   await recover(name,m);await journal(name,[m]);
   await store.deleteItemAsync(name);await recover(name,null);
  })
 };
}
