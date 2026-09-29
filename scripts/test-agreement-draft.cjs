const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, ...globals });
  return exports;
}
const { parseEditorDraft } = load('app/lib/agreementDraft.ts');
const draft = {
  formData: { clientName: 'Example', clientEmail: 'example@example.test', projectTitle: 'Test', taxRate: '10', deliverables: 'Scope', description: '', dueDate: '' },
  lineItems: [{ id: 'one', description: 'Work', quantity: 1, amount: 1000 }],
  manualPriceOverride: '', includeFee: true, depositType: '50', fixedDepositAmount: '',
  paymentTerms: 'net30', isSplit: true, splitCount: '2', splitFrequency: '30', paymentType: 'one_time', dunningEnabled: false,
};
const now = Date.now();
const serialize = (value = draft, savedAt = now) => JSON.stringify({ version: 1, savedAt, draft: value });
assert.equal(JSON.stringify(parseEditorDraft(serialize(), now)), JSON.stringify(draft));
assert.equal(parseEditorDraft('{', now), null);
assert.equal(parseEditorDraft(null, now), null);
assert.equal(parseEditorDraft(serialize(draft, now - 86400001), now), null);
assert.equal(parseEditorDraft(serialize(draft, now + 1), now), null);
assert.equal(parseEditorDraft(serialize({ ...draft, paymentType: 'unexpected' }), now), null);
assert.equal(parseEditorDraft(serialize({ ...draft, lineItems: [{ amount: 'bad' }] }), now), null);
const events = [];
const navigator = { doNotTrack: '1' };
const { trackAgreementEvent } = load('app/lib/agreementEvents.ts', { navigator, window: { gtag: (...args) => events.push(args) } });
trackAgreementEvent('agreement_started');
assert.equal(events.length, 0);
navigator.doNotTrack = '0';
navigator.globalPrivacyControl = true;
trackAgreementEvent('agreement_started');
assert.equal(events.length, 0);
navigator.globalPrivacyControl = false;
trackAgreementEvent('agreement_started');
assert.equal(JSON.stringify(events), JSON.stringify([['event', 'agreement_started', { event_category: 'agreement_workflow' }]]));
console.log('PASS: draft validation, expiry, corruption recovery, analytics privacy flags and fixed event payload');
