const fs=require('fs'),cp=require('child_process'),path=require('path'),dotenv=require('dotenv');
const [envFile,log]=process.argv.slice(2);if(!envFile||!log)throw Error('Private env path and build log required');
const output=fs.openSync(log,'w');
const env={...process.env,...dotenv.parse(fs.readFileSync(envFile)),NEXT_TELEMETRY_DISABLED:'1'};
const child=cp.spawn(process.execPath,[require.resolve('next/dist/bin/next'),'build'],{cwd:path.join(__dirname,'..'),env,stdio:['ignore',output,output],windowsHide:true});
child.on('exit',code=>{fs.closeSync(output);console.log('Production build exit: '+code+'; log: '+log);process.exitCode=code||0;});
