const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/supportKnowledge.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject});
const {supportAnswers,findSupportAnswers,supportTopics}=exportsObject;
assert.equal(new Set(supportAnswers.map(x=>x.id)).size,supportAnswers.length);
for(const answer of supportAnswers){assert.match(answer.id,/^[a-z-]+$/);assert.ok(supportTopics.includes(answer.topic));assert.ok(answer.href.startsWith('/')||answer.href==='mailto:support@microfreelancehub.com');}
for(const query of ['login','sign-in','SIGN IN','password'])assert.ok(findSupportAnswers(query).some(x=>x.id==='account-access'),query);
for(const query of ['invoice','invoices','INVOICE'])assert.ok(findSupportAnswers(query).some(x=>x.id==='recurring-invoices'),query);
assert.ok(findSupportAnswers('retry').some(x=>x.id==='uncertain-time-save'));
assert.equal(findSupportAnswers('zzzz-unknown').length,0);
assert.equal(findSupportAnswers('Google','Billing').length,0);
assert.ok(findSupportAnswers('', 'Billing').every(x=>x.topic==='Billing'));
assert.equal(findSupportAnswers('').length,supportAnswers.length);
assert.equal(findSupportAnswers('invoice'+' '.repeat(193)+'zzzz').length,findSupportAnswers('invoice').length);
assert.equal(findSupportAnswers('<script>alert(1)</script>').length,0);
console.log('PASS support topics, stable IDs, aliases, Unicode, unknown fallback and bounded input');

for (const query of ['How do I reset my password?', 'please recover my password', '??? do I reset my password?']) assert.ok(findSupportAnswers(query).some(x=>x.id==='account-access'), query);
for (const query of ['how do I', '???', 'reset password unicorn', 'not password']) assert.equal(findSupportAnswers(query).length,0,query);
assert.equal(findSupportAnswers('How do I reset my password?', 'Billing').length,0);
console.log('PASS natural questions, unknown subjects, punctuation, negation and topic boundaries');

for (const [query,id] of [['report dates','report-dates'],['invoice revenue','report-totals'],['export CSV','report-export']]) {
 assert.ok(findSupportAnswers(query,'Reports').some(x=>x.id===id),query);
 assert.equal(findSupportAnswers(query,'Account access').length,0);
}
assert.equal(findSupportAnswers('', 'Reports').length,3);
console.log('PASS report guidance discovery and topic isolation');
