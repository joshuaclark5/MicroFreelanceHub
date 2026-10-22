const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file){const name=path.join(root,file);const m=new Module(name);m.filename=name;m.paths=Module._nodeModulePaths(path.dirname(name));m._compile(ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,name);return m.exports;}
const {calculateChange,changeMessage}=load('app/challenge/toolkit/estimate.ts');
const {parseBackup}=load('app/challenge/backup.ts');
const example={base:'1200',hours:'4',rate:'75',expenses:'20',days:'2',currency:'USD',request:'add one landing page'};
assert.deepEqual(calculateChange(example).result,{labor:30000,additional:32000,revised:152000,base:120000,expenses:2000,days:2});
assert.equal(calculateChange({...example,hours:'6.5'}).result.additional,50750);
assert.equal(calculateChange({...example,hours:'0.25',rate:'99.99',expenses:'0'}).result.additional,2500);
for(const patch of [{hours:'-1'},{rate:'NaN'},{base:''},{expenses:'1e4'},{days:'1.5'},{currency:'UNKNOWN'},{request:''},{rate:'10001'}]){const i={...example,...patch};assert.equal(calculateChange(i).result,null);assert.equal(changeMessage(i),'');}
assert(changeMessage(example).includes('Option A:'));assert(changeMessage(example).includes('$1,520.00'));
const backup={version:1,values:Array(6).fill('A valid project'),reviewed:Array(6).fill(false)};
assert.deepEqual(parseBackup(JSON.stringify(backup)),backup);
const largest={...backup,values:Array(6).fill('\u0000'.repeat(5000))};assert.equal(parseBackup(JSON.stringify(largest)).values[0].length,5000);
for(const raw of ['{broken',JSON.stringify({...backup,version:2}),JSON.stringify({...backup,values:['only one']}),JSON.stringify({...backup,values:Array(6).fill('x'.repeat(5001))}),JSON.stringify({...backup,reviewed:Array(6).fill('true')})])assert.throws(()=>parseBackup(raw));
console.log('Challenge value tests passed: estimate math, rounding, invalid inputs, portable backup validation.');
