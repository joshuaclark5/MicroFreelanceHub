// Local fictional optimized-browser gate; owns only its child server, no external writes.
const {spawn,spawnSync}=require('node:child_process');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../evidence-foundation'),base='http://127.0.0.1:3084';
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'fixture-anon',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',STRIPE_SECRET_KEY:'sk_test_fixture',NEXT_PUBLIC_BASE_URL:base,QA_BASE_URL:base,QA_OUT:path.join(out,'browser')};
const log=fs.openSync(path.join(out,'preview.log'),'w');let server;
(async()=>{
const types=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','--incremental','false'],{cwd:root,env,encoding:'utf8',timeout:240000,maxBuffer:20*1024*1024});fs.writeFileSync(path.join(out,'types-final.log'),(types.stdout||'')+(types.stderr||''));if(types.status!==0)throw Error('Final TypeScript check failed: '+types.status);
server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3084','-H','127.0.0.1'],{cwd:root,env,stdio:['ignore',log,log]});let ready=false;for(let i=0;i<90;i++){try{const r=await fetch(base+'/workspace/clients');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}if(!ready)throw Error('Local preview unavailable');
const r=spawnSync(process.execPath,['scripts/test-connected-workspace-browser.cjs'],{cwd:root,env,encoding:'utf8',timeout:600000,maxBuffer:20*1024*1024});fs.writeFileSync(path.join(out,'browser-run.log'),(r.stdout||'')+(r.stderr||''));console.log('Browser exit '+r.status);process.exitCode=r.status===0?0:1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{if(server)server.kill();fs.closeSync(log);});
