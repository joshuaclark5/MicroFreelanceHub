const fs=require('fs'),cp=require('child_process'),dotenv=require('dotenv');
const [envFile,port='3079']=process.argv.slice(2);
if(!envFile)throw Error('Private env path required');
const child=cp.spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',port],{env:{...process.env,...dotenv.parse(fs.readFileSync(envFile)),NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit',windowsHide:true});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill());
child.on('exit',code=>process.exitCode=code||0);
