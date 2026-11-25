const cp=require('child_process'),fs=require('fs'),assert=require('assert/strict');
const adb='C:/Users/joshu/mfh-android-tools/sdk/platform-tools/adb.exe';
const serial=process.argv[2];assert.match(serial||'',/^emulator-\d+$/,'Explicit emulator serial required');
const dir='artifacts/android-0.1.5-device';fs.mkdirSync(dir,{recursive:true});
function run(args,opts={}){const r=cp.spawnSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024,...opts});assert.equal(r.status,0,r.stderr||r.error?.message||'adb failed');return r.stdout;}
async function main(){
 assert.match(run(['emu','avd','name']),/mfh-tester-20261124/,'Refusing unrelated emulator');
 assert.equal(run(['shell','getprop','sys.boot_completed']).trim(),'1','Emulator not booted');
 const install=run(['install','-r','mobile/android/app/build/outputs/apk/release/app-release.apk']);assert.match(install,/Success/);
 run(['logcat','-c']);run(['shell','am','start','-W','-n','com.microfreelancehub.mobile/.MainActivity']);
 await new Promise(r=>setTimeout(r,10000));
 run(['shell','uiautomator','dump','/sdcard/mfh-window.xml']);
 const xml=run(['shell','cat','/sdcard/mfh-window.xml']);fs.writeFileSync(dir+'/launch.xml',xml);
 const screenshot=run(['exec-out','screencap','-p'],{encoding:null});fs.writeFileSync(dir+'/launch.png',screenshot);
 const pid=run(['shell','pidof','com.microfreelancehub.mobile']).trim();assert.match(pid,/^\d+$/);const logs=run(['logcat','-d','--pid='+pid,'-t','200']);fs.writeFileSync(dir+'/launch-logcat.txt',logs);
 assert.ok(!logs.includes('FATAL EXCEPTION'),'Native crash found');
 assert.match(xml,/Continue with Google/,'Expected sign-in screen missing');
 assert.match(xml,/Email/);assert.match(xml,/Password/);
 const receipt={at:new Date().toISOString(),serial,install:'passed',launch:'passed',signedOutUi:'passed',authenticatedSession:'not tested',playPublished:false};
 fs.writeFileSync(dir+'/result.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}main().catch(e=>{console.error(e.message);process.exitCode=1;});

