const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
 const exports = {};
 const source = fs.readFileSync(file, 'utf8');
 vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
 {exports, Intl, Date, Set, require: name => {assert.ok(name in dependencies); return dependencies[name];}});
 return exports;
}
const scheduling = load('app/lib/workspaceScheduling.ts');
const {timeOffInput: parse} = load('app/lib/workspaceTimeOff.ts', {'./workspaceScheduling':scheduling});
const actor = '11111111-1111-4111-8111-111111111111';
const preview = {action:'preview',expectedActorId:actor,startsOn:'2027-03-12',endsOn:'2027-03-16',timezone:'America/New_York'};
const create = {...preview,action:'create',operationId:actor,expectedReviewToken:'a'.repeat(64)};
const remove = {action:'remove',expectedActorId:actor,operationId:actor,id:actor,expectedVersion:1};
let checks = 0;
function accepted(body) {assert.equal(JSON.stringify(parse(body)),JSON.stringify(body)); checks++;}
function rejected(body) {assert.throws(()=>parse(body)); checks++;}
for(const body of [preview,create,remove]) {
 accepted(body);
 for(const key of Object.keys(body)) {const copy={...body};delete copy[key];rejected(copy);rejected({...body,[key]:null});}
 for(const extra of [{owner_id:actor},{active:false},{version:2},{affectedBookings:[]}])rejected({...body,...extra});
}
for(const body of [null,[],true,'test',{}, {...preview,action:'delete'}, {...preview,expectedActorId:'bad'}, {...preview,startsOn:'2027-02-29'}, {...preview,endsOn:'2027-03-11'}, {...preview,startsOn:'2027-3-12'}, {...preview,timezone:'No/Zone'}, {...preview,timezone:' UTC'}, {...preview,timezone:42}, {...create,operationId:actor.replace('-4111-','-1111-')}, {...create,expectedReviewToken:'A'.repeat(64)}, {...create,expectedReviewToken:'a'.repeat(63)}])rejected(body);
for(const expectedVersion of [0,-1,1.5,'1',NaN,Infinity,1000000000])rejected({...remove,expectedVersion});
accepted({...preview,startsOn:'2028-01-01',endsOn:'2028-12-31'});
rejected({...preview,startsOn:'2028-01-01',endsOn:'2029-01-01'});
accepted({...preview,startsOn:'2028-02-29',endsOn:'2028-02-29',timezone:'Asia/Kathmandu'});
// JS inheritance must never satisfy required request keys.
const inherited=Object.create({expectedActorId:actor});Object.assign(inherited,preview);delete inherited.expectedActorId;rejected(inherited);
const frozen=Object.freeze({...create});const result=parse(frozen);assert.notEqual(result,frozen);assert.equal(JSON.stringify(result),JSON.stringify(frozen));checks++;
console.log(`PASS ${checks} time-off request-contract checks. No database or network calls.`);
