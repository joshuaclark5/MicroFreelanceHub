const fs=require('fs'),ts=require('typescript'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('app/actions/delete-account.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let imports=0;const sandbox={exports:{},require(){imports++;throw Error('No external operations allowed');}};
vm.runInNewContext(js,sandbox);
(async()=>{for(let i=0;i<10;i++){const result=await sandbox.exports.deleteUserAccount();assert.equal(result.success,false);assert.match(result.error,/temporarily unavailable/);}assert.equal(imports,0);assert.doesNotMatch(src,/\.deleteUser\(/);console.log('PASS: stale-client calls fail closed without imports, credentials, billing or deletion operations');})().catch(e=>{console.error(e);process.exitCode=1});
