const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function visit(url, referrer = '', initial = {}) {
  const values = new Map(Object.entries(initial));
  const exports = {};
  const storage = { getItem: k => values.get(k) || null, setItem: (k,v) => values.set(k,v) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/trackingClient.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
    {exports, window:{location:new URL(url)}, document:{referrer}, localStorage:storage, URL, URLSearchParams});
  exports.initializeTracking();
  return Object.fromEntries(values);
}
const home = 'https://www.microfreelancehub.com';
const google = visit(home+'/templates/tennis-coach-contract-template', 'https://www.google.com/search?q=private');
assert.equal(google.marketing_source, 'referrer:google.com');
assert.equal(google.landing_page, '/templates/tennis-coach-contract-template');
assert.equal(visit(home+'/pricing?source=later','',google).marketing_source,'referrer:google.com');
assert.equal(visit(home+'/?utm_source=facebook&utm_campaign=spring','https://google.com').marketing_source,'facebook');
assert.equal(visit(home+'/?partner=superpath').marketing_source,'affiliate:superpath');
assert.equal(visit(home+'/?utm_campaign=spring').marketing_source,'spring');
const unknown = visit(home+'/');
assert.equal(unknown.marketing_source,'unknown');
assert.equal(visit(home+'/?source=late','https://bing.com',unknown).marketing_source,'unknown');
assert.equal(visit(home+'/pricing','https://www.microfreelancehub.com/templates/test').marketing_source,'unknown');
assert.equal(visit(home+'/pricing','https://app.microfreelancehub.com/private').marketing_source,'unknown');
assert.equal(visit(home+'/?source=person@example.com','not a url').marketing_source,'unknown');
assert.equal(visit(home+'/sow/private?token=secret','https://google.com').landing_page,undefined);
assert.equal(visit(home+'/?source=late','https://bing.com',{landing_page:'/pricing'}).marketing_source,'unknown');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/profileAttribution.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject});
assert.equal(exportsObject.sanitizeAttribution('/pricing','referrer:google.com').lead_source,'referrer:google.com');
assert.equal(exportsObject.sanitizeAttribution('/pricing','referrer:google.com/private?q=secret').lead_source,null);
console.log('PASS: referral host only, campaign priority, unknown source frozen, internal/private paths excluded, legacy and server validation.');
