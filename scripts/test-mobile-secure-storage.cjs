const assert=require('assert/strict');
const exportsObject=require('../mobile/src/encryptedSessionStorage.ts');
(async()=>{
 const data=new Map();let counter=0,fail=null;
 const store={getItemAsync:async k=>data.get(k)??null,setItemAsync:async(k,v)=>{if(fail?.(k,v))throw Error('disk unavailable');data.set(k,v);},deleteItemAsync:async k=>{data.delete(k);}};
 const adapter=exportsObject.encryptedSessionStorage(store,()=>`generation-${String(++counter).padStart(8,'0')}`);
 const key='sb-example-auth-token',name=`mfh.${key.length}.${key}`;
 assert.equal(await adapter.getItem(key),null);
 const unicode='A'.repeat(399)+'😀'.repeat(4000)+'é';
 await adapter.setItem(key,unicode);assert.equal(await adapter.getItem(key),unicode);
 for(const [k,v] of data)if(k!==name)assert.ok(Buffer.byteLength(v)<2000);
 fail=k=>k.endsWith('.1');await assert.rejects(adapter.setItem(key,'B'.repeat(900)));fail=null;
 assert.equal(await adapter.getItem(key),unicode,'failed part write preserves previous session');
 fail=k=>k===name;await assert.rejects(adapter.setItem(key,'new session'));fail=null;
 assert.equal(await adapter.getItem(key),unicode,'failed manifest write preserves previous session');
 await Promise.all([adapter.setItem(key,'first'),adapter.setItem(key,'last')]);assert.equal(await adapter.getItem(key),'last');
 const manifest=JSON.parse(data.get(name));data.delete(`${name}.${manifest.generation}.0`);
 await assert.rejects(adapter.getItem(key),/incomplete/);
 await adapter.removeItem(key);assert.equal(await adapter.getItem(key),null);
 await adapter.setItem(key,'');assert.equal(await adapter.getItem(key),'');
 await adapter.setItem('other-account','private');await adapter.removeItem(key);
 assert.equal(await adapter.getItem('other-account'),'private');
 const originalSet=store.setItemAsync;
 store.setItemAsync=async(k,v)=>{await originalSet(k,v);if(k===name)throw Error('reply lost after write');};
 await assert.rejects(adapter.setItem(key,'committed despite lost reply'));
 store.setItemAsync=originalSet;
 assert.equal(await adapter.getItem(key),'committed despite lost reply');
 const originalDelete=store.deleteItemAsync;
 store.deleteItemAsync=async k=>{if(k===name)throw Error('delete failed');await originalDelete(k);};
 await assert.rejects(adapter.removeItem(key));
 assert.equal(await adapter.getItem(key),'committed despite lost reply');
 store.deleteItemAsync=originalDelete;
 await adapter.removeItem(key);assert.equal(await adapter.getItem(key),null);
 await assert.rejects(adapter.setItem(key,'x'.repeat(100001)),/limit/);
 await assert.rejects(adapter.getItem('../unsafe'),/key/);
 data.set(name,'bad json');await adapter.removeItem(key);assert.equal(await adapter.getItem(key),null);
 console.log('Encrypted session adapter: Unicode, bounded parts, write failures, serialization, corruption and sign-out passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
// Simulate process loss before/after every encrypted write/delete boundary.
(async()=>{
 const key='crash-test',name=`mfh.${key.length}.${key}`;
 for(const operation of ['replace','remove'])for(const after of [false,true])for(let faultAt=1;faultAt<=12;faultAt++){
  const data=new Map();let generation=0,calls=0,armed=false;
  const store={getItemAsync:async k=>data.get(k)??null,
   setItemAsync:async(k,v)=>{const fail=armed&&++calls===faultAt;if(fail&&!after)throw Error('power lost');data.set(k,v);if(fail&&after)throw Error('power lost');},
   deleteItemAsync:async k=>{const fail=armed&&++calls===faultAt;if(fail&&!after)throw Error('power lost');data.delete(k);if(fail&&after)throw Error('power lost');}};
  const fresh=()=>exportsObject.encryptedSessionStorage(store,()=>`crash-generation-${++generation}`);
  const old='old'.repeat(300),next='new'.repeat(300);
  await fresh().setItem(key,old);armed=true;
  try{if(operation==='replace')await fresh().setItem(key,next);else await fresh().removeItem(key);}catch(e){assert.match(e.message,/power lost/);}
  armed=false;
  const manifest=data.has(name)?JSON.parse(data.get(name)):null;
  const expected=manifest?Array.from({length:manifest.count},(_,i)=>data.get(`${name}.${manifest.generation}.${i}`)).join(''):null;
  const actual=await fresh().getItem(key);
  assert.equal(actual,expected,`${operation} ${after} ${faultAt}: preserve committed generation`);
  assert.ok(operation==='replace'?[old,next].includes(actual):[old,null].includes(actual));
  const keep=new Set(manifest?[name,...Array.from({length:manifest.count},(_,i)=>`${name}.${manifest.generation}.${i}`)]:[]);
  assert.deepEqual([...data.keys()].sort(),[...keep].sort(),'no encrypted orphan parts after recovery');
 }
 console.log('48 simulated restart boundaries passed; committed sessions preserved and orphan parts removed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
