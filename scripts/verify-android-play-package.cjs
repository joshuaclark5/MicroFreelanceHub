const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const sdk='C:/Users/joshu/mfh-android-tools/sdk',java='C:/Users/joshu/mfh-android-tools/java/jdk-17.0.21.1+2';
const apk='mobile/android/app/build/outputs/apk/release/app-release.apk',aab='mobile/android/app/build/outputs/bundle/release/app-release.aab';
const env={...process.env,JAVA_HOME:java,PATH:java+'/bin;'+(process.env.PATH||process.env.Path||'')};delete env.Path;
function run(exe,args){const r=cp.spawnSync(exe,args,{encoding:'utf8',env,windowsHide:true,maxBuffer:8*1024*1024});assert.equal(r.status,0,(r.stderr||r.error?.message||'Verification failed'));return r.stdout;}
const badging=run(sdk+'/build-tools/36.0.0/aapt2.exe',['dump','badging',apk]);
assert.match(badging,/package: name='com.microfreelancehub.mobile' versionCode='8' versionName='0.1.7'/);assert.ok(!badging.includes('application-debuggable'));
for(const name of ['READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','SYSTEM_ALERT_WINDOW','RECORD_AUDIO'])assert.ok(!badging.includes(name),'Unexpected permission '+name);
const signature=run(java+'/bin/java.exe',['-jar',sdk+'/build-tools/36.0.0/lib/apksigner.jar','verify','--verbose','--print-certs',apk]);assert.ok(!signature.includes('Android Debug'));assert.match(signature,/CN=MicroFreelanceHub/);
const previous=JSON.parse(fs.readFileSync('artifacts/android-0.1.4-package-verification.json')).signature;const fingerprint=s=>s.match(/certificate SHA-256 digest: ([a-f0-9]+)/i)?.[1];assert.ok(fingerprint(previous));assert.equal(fingerprint(signature),fingerprint(previous),'Upgrade signing certificate changed');
run(sdk+'/build-tools/36.0.0/zipalign.exe',['-c','-P','16','4',apk]);
const bundleSignature=run(java+'/bin/jarsigner.exe',['-verify',aab]);assert.match(bundleSignature,/jar verified/);
const artifacts=[apk,aab].map(file=>({file,bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
fs.writeFileSync('artifacts/android-0.1.7-package-verification.json',JSON.stringify({at:new Date().toISOString(),artifacts,badging,signature,bundleSignature,deviceVerified:false,playPublished:false},null,2));console.log(JSON.stringify({passed:true,artifacts}));
