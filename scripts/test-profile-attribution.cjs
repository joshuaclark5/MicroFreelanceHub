const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/profileAttribution.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
const { persistFirstTouch, sanitizeAttribution } = exportsObject;
const rows = new Map();
const admin = { from(table) {
  assert.equal(table, 'profiles');
  return {
    async upsert(row, options) { assert.equal(options.ignoreDuplicates, true); if (!rows.has(row.id)) rows.set(row.id, { ...row }); return {}; },
    update(values) { return { eq(field, id) { assert.equal(field, 'id'); return { async is(key, value) { assert.equal(value, null); const row = rows.get(id); if (row[key] == null) Object.assign(row, values); return {}; } }; } }; },
  };
} };
(async () => {
  const user = { id: 'confirmed-fixture', email: 'fixture@example.test', user_metadata: { signup_landing_page: '/templates/mobile-mechanic-contract-template', signup_lead_source: 'partner-one' } };
  await persistFirstTouch(admin, user, '/pricing', 'later-source');
  await persistFirstTouch(admin, { id: user.id }, '/create', 'another-source');
  assert.equal(rows.get(user.id).lead_source, 'partner-one');
  assert.equal(rows.get(user.id).signup_landing_page, '/templates/mobile-mechanic-contract-template');
  assert.equal(rows.get(user.id).email, user.email);
  await Promise.all([persistFirstTouch(admin, { id: 'oauth' }, '/pricing', 'first'), persistFirstTouch(admin, { id: 'oauth' }, '/create', 'second')]);
  assert.equal(rows.get('oauth').lead_source, 'first');
  assert.equal(sanitizeAttribution('/sow/private-id', 'person@example.com').signup_landing_page, null);
  assert.equal(sanitizeAttribution('/pricing?email=private', 'person@example.com').lead_source, null);
  assert.equal(sanitizeAttribution('/pricing?email=private', 'valid_source').signup_landing_page, '/pricing');
  console.log('PASS: first touch survives repeat/concurrent callbacks, email metadata supports cross-device confirmation, private paths and unstructured sources excluded. Mock DB only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
