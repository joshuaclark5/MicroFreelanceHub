const cp=require('child_process'),fs=require('fs'),assert=require('assert/strict');
const adb='C:/Users/joshu/mfh-android-tools/sdk/platform-tools/adb.exe',serial='emulator-5560',dir='artifacts/android-0.1.5-account-help';fs.mkdirSync(dir,{recursive:true});
function run(args,opts={}){const r=cp.spawnSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:60000,windowsHide:true,maxBuffer:4*1024*1024,...opts});assert.equal(r.status,0,r.stderr||r.error?.message||'adb failed');return r.stdout;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function xml(){run(['shell','uiautomator','dump','/sdcard/mfh-account-help.xml']);return run(['shell','cat','/sdcard/mfh-account-help.xml']);}
function capture(name,content){fs.writeFileSync(dir+'/'+name+'.xml',content);fs.writeFileSync(dir+'/'+name+'.png',run(['exec-out','screencap','-p'],{encoding:null}));}
(async()=>{
 assert.match(run(['emu','avd','name']),/mfh-tester-20261124/);assert.match(run(['shell','dumpsys','package','com.microfreelancehub.mobile']),/versionCode=6\b/);
 let page=xml();
 for(let i=0;i<6&&!page.includes('content-desc="Email deletion request"');i++){run(['shell','input','swipe','360','1380','360','300','450']);await wait(800);page=xml();}
 assert.match(page,/Read privacy policy/);assert.match(page,/Email deletion request/);capture('request-controls',page);
 const node=page.match(/<node[^>]*content-desc="Email deletion request"[^>]*>/)?.[0];assert.ok(node);
 const coords=node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number);const x=Math.round((coords[0]+coords[2])/2),y=Math.round((coords[1]+coords[3])/2);assert.ok(x>0&&x<720&&y>0&&y<1512);
 const handlers=run(['shell','cmd','package','query-activities','--brief','-a','android.intent.action.VIEW','-d','mailto:support@microfreelancehub.com']);fs.writeFileSync(dir+'/mail-handlers.txt',handlers);
 run(['shell','input','tap',String(x),String(y)]);await wait(1800);page=xml();capture('request-action',page);
 const fallback=page.includes('No request was sent.');
 if(/No activities found/.test(handlers))assert.ok(fallback,'Missing inline mail fallback');
 assert.ok(!page.includes('request has been sent'),'False submission claim');
 fs.writeFileSync(dir+'/result.json',JSON.stringify({at:new Date().toISOString(),privacyAndRequestControls:'visible',requestAction:fallback?'inline missing-handler recovery':'external handler opened; no send action performed',customerMutations:0,emailsSent:0,authenticatedSession:'not tested'},null,2));console.log('Native account-request controls/action checked; no email sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
