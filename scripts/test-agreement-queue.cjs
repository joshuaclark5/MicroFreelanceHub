const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('node:assert/strict');
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const exports = cache[name] = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/' + name + '.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports, require: p => load(p.replace('./',''))});
  return exports;
}
const {agreementQueue} = load('agreementQueue');
const base = {user_id:'owner',status:'Sent',provider_sign:'signed',signed_by:'client',price:100,payment_received_cents:0};
const rows = [{...base,id:'payment',status:'Paid'}, {...base,id:'draft',status:'Draft'}, {...base,id:'signature',provider_sign:null}, {...base,id:'client',signed_by:null}, {...base,id:'settled',payment_received_cents:10000}, {...base,id:'offline',payment_type:'none'}, {...base,id:'foreign',user_id:'other'}, {...base,id:'invalid',price:'bad'}, {...base,id:'draft'}, {...base,id:''}];
const queue = agreementQueue(rows,'owner');
assert.equal(queue.length,5);
assert.equal(queue[0].id,'draft');
assert.equal(queue[1].id,'signature');
assert.equal(queue[2].id,'client');
assert.ok(queue.some(x=>x.id==='payment'), 'editable Paid status must not hide unconfirmed money');
assert.ok(queue.some(x=>x.id==='invalid'), 'invalid amounts need review, not false completion');
assert.equal(agreementQueue(rows,'').length,0);
assert.equal(agreementQueue([{...base,id:'a/b?x'}],'owner')[0].action.href,'/sow/a%2Fb%3Fx');
console.log('PASS queue: owner isolation, duplicate IDs, workflow ordering, payment evidence, invalid amounts, safe links');
