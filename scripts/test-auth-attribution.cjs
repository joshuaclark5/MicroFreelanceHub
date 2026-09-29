const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('app/lib/trackingClient.ts', 'utf8');
function load(storage) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {module:ts.ModuleKind.CommonJS} }).outputText, {exports, window:{}, localStorage:storage, URLSearchParams});
  return exports;
}
const tracking = load({getItem:key=>({landing_page:'/templates/gutter-installer-contract-template',marketing_source:'superpath'}[key] || null)});
assert.equal(tracking.getAuthAttribution().lead_source,'superpath');
assert.equal(tracking.getAuthAttribution().landing_page,'/templates/gutter-installer-contract-template');
assert.equal(tracking.getAuthAttribution('/pricing','fcdc').lead_source,'fcdc');
assert.equal(load({getItem:()=>{throw new Error('Blocked storage')}}).getAuthAttribution().lead_source,null);
const login = fs.readFileSync('app/login/page.tsx','utf8');
assert.match(login,/callbackUrl\.searchParams\.set\('lead_source', attribution\.lead_source\)/);
assert.doesNotMatch(fs.readFileSync('app/signup-success/page.tsx','utf8'),/Analytics route:/);
console.log('PASS: attribution fallback, explicit override, blocked storage and confirmation callback wiring; no accounts or emails created.');
