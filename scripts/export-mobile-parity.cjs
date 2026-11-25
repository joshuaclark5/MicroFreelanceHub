const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const config=require('dotenv').parse(fs.readFileSync('C:/Users/joshu/Downloads/MicroFreelanceHub-GitHubPush/MicroFreelanceHubFrontend/.env.local'));
assert.equal(config.NEXT_PUBLIC_SUPABASE_URL,'https://rjgttmwrbyjqifodjnqm.supabase.co');assert.equal(JSON.parse(Buffer.from(config.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.')[1],'base64url')).role,'anon');
const env={...process.env,NODE_ENV:'production',CI:'1',EXPO_NO_TELEMETRY:'1',EXPO_PUBLIC_DISTRIBUTION:'play',EXPO_PUBLIC_SUPABASE_URL:config.NEXT_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_ANON_KEY:config.NEXT_PUBLIC_SUPABASE_ANON_KEY};
const p=cp.spawnSync(process.execPath,['node_modules/expo/bin/cli','export','--platform','android','--output-dir','../artifacts/parity-android-export'],{cwd:process.cwd()+'/mobile',env,stdio:'inherit',windowsHide:true});process.exitCode=p.status??1;
