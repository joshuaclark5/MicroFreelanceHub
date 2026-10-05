const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/templateLibrarySummary.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsForTest });
const { templateLibrarySummary: summarize, TEMPLATE_SUMMARY_FALLBACK: fallback } = exportsForTest;
for (const input of [
  'This agreement guarantees you get paid for every custom formula.',
  'This invoice protects against liability for third-party actions.',
  'A legally binding contract that prevents lawsuits.',
  'This contract ensures final payment.',
  'It eliminates scope creep and secures your cash flow.',
  'A legal framework to protect the recruiter and client.',
  'It forces clients to prioritize the debt.',
  'Get paid reliably with this template.',
  'This NDA provides robust protection.',
  'An enforceable contract.',
]) assert.equal(summarize(input), fallback, input);
for (const input of [
  'Outline scope, pricing, approvals, and payment details.',
  'Record invoice numbers, payment links, and deadlines.',
  'Review confidentiality responsibilities before sharing project files.',
]) assert.equal(summarize(input), input);
assert.equal(summarize(null), summarize(undefined));
assert.equal(summarize('  '), summarize(''));
assert.ok(fs.readFileSync('app/templates/TemplatesLibraryClient.tsx', 'utf8').includes('templateLibrarySummary(template.ai_summary)'));
console.log('PASS: risky library claims replaced; neutral summaries and empty-state copy retained');
