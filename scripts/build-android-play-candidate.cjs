// Local signed Play candidate; no upload or publication. Never prints signing passwords or embeds server credentials.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict'),path=require('path');
const repo=process.cwd(),tools='C:/Users/joshu/mfh-android-tools',privateRoot='C:/Users/joshu/mfh-private-backups/android-play-signing-20261124';
fs.mkdirSync(privateRoot,{recursive:true});fs.mkdirSync('artifacts',{recursive:true});
const credentials=privateRoot+'/signing.json',keystore=privateRoot+'/upload.jks';
assert.ok(fs.existsSync(credentials)&&fs.existsSync(keystore),'Existing signing custody is required');
const appConfig=JSON.parse(fs.readFileSync('mobile/app.json')).expo;
assert.equal(appConfig.version,'0.1.9');assert.equal(appConfig.android.versionCode,10);assert.equal(appConfig.android.package,'com.microfreelancehub.mobile');
const signing=JSON.parse(fs.readFileSync(credentials));
const env={...process.env,JAVA_HOME:tools+'/java/jdk-17.0.21.1+2',ANDROID_HOME:tools+'/sdk',ANDROID_SDK_ROOT:tools+'/sdk',MFH_UPLOAD_KEYSTORE:keystore,MFH_UPLOAD_STORE_PASSWORD:signing.storePassword,MFH_UPLOAD_KEY_PASSWORD:signing.keyPassword,MFH_UPLOAD_ALIAS:signing.alias,NODE_ENV:'production',CI:'1',EXPO_NO_TELEMETRY:'1',EXPO_PUBLIC_DISTRIBUTION:'play'};
env.PATH=env.JAVA_HOME+'/bin;'+(process.env.PATH||process.env.Path||'');delete env.Path;
const dotenv=require('C:/Users/joshu/mfh-first-small-release-20261119/node_modules/dotenv');const config=dotenv.parse(fs.readFileSync('C:/Users/joshu/Downloads/MicroFreelanceHub-GitHubPush/MicroFreelanceHubFrontend/.env.local'));
assert.equal(config.NEXT_PUBLIC_SUPABASE_URL,'https://rjgttmwrbyjqifodjnqm.supabase.co');assert.equal(JSON.parse(Buffer.from(config.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.')[1],'base64url')).role,'anon');
env.EXPO_PUBLIC_SUPABASE_URL=config.NEXT_PUBLIC_SUPABASE_URL;env.EXPO_PUBLIC_SUPABASE_ANON_KEY=config.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const gradle=repo+'/mobile/android/app/build.gradle';let source=fs.readFileSync(gradle,'utf8');assert.ok(source.includes("applicationId 'com.microfreelancehub.mobile'"));assert.match(source,/versionCode 10/);assert.match(source,/versionName "0.1.9"/);
if(!source.includes('signingConfigs.upload')){
 source=source.replace('signingConfigs {',`signingConfigs {\n        upload {\n            storeFile file(System.getenv('MFH_UPLOAD_KEYSTORE'))\n            storePassword System.getenv('MFH_UPLOAD_STORE_PASSWORD')\n            keyAlias System.getenv('MFH_UPLOAD_ALIAS')\n            keyPassword System.getenv('MFH_UPLOAD_KEY_PASSWORD')\n        }`);
 source=source.replace(/(release \{[\s\S]*?)signingConfig signingConfigs.debug/,'$1signingConfig signingConfigs.upload');fs.writeFileSync(gradle,source);
}
assert.ok(source.includes('signingConfig signingConfigs.upload'));
const log=fs.openSync('artifacts/android-0.1.9-release-build.log','w');
const p=cp.spawn('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',['-NoProfile','-Command',"& ./gradlew.bat :app:assembleRelease :app:bundleRelease --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' '-Dorg.gradle.workers.max=2'; exit $LASTEXITCODE"],{cwd:repo+'/mobile/android',env,stdio:['ignore',log,log],windowsHide:true});
p.on('error',e=>{fs.closeSync(log);console.error('Build process could not start: '+e.message);process.exitCode=1;});
p.on('exit',code=>{fs.closeSync(log);const receipt={at:new Date().toISOString(),exitCode:code,distribution:'play',version:'0.1.9',versionCode:10,applicationId:'com.microfreelancehub.mobile',signing:'dedicated private upload key',signingKeySha256:crypto.createHash('sha256').update(fs.readFileSync(keystore)).digest('hex'),backend:'production public anon only',architectures:['arm64-v8a','x86_64'],deviceVerified:false,storePublished:false};fs.writeFileSync('artifacts/android-0.1.9-build-receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));process.exitCode=code||0;});

