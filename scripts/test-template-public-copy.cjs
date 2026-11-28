const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(name) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`app/lib/${name}.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: p => load(p.replace('./', '')) });
  return exports;
}
const { templatePublicCopy: clean, PUBLIC_TEMPLATE_FALLBACK: fallback } = load('templatePublicCopy');
for (const input of [
  'It shifts the liability of ADA compliance back to the property owner.',
  'The Contractor is not liable for paint failure.',
  'A client is contractually obligated to pay, preventing a financial loss.',
  'An independent contractor with protected boundaries.',
  '<p>Legally <strong>binding</strong> protection.</p>',
  'Guaranteed paym&#101;nt.',
  'guaran\u200bteed payment',
  'ADA-compliant markings.',
  'An enforceable contract.',
  'It prevents a total financial wash.',
  'Legal pr&unknown;tection',
]) assert.equal(clean(input), fallback, input);
assert.equal(clean('<p>Scope &amp; timing</p><p>Two revision rounds.</p>'), 'Scope & timing\n\nTwo revision rounds.');
assert.equal(clean('Owner-entered quantities, site access and weather assumptions.'), 'Owner-entered quantities, site access and weather assumptions.');
assert.equal(clean(null, 'Business project'), 'Business project');
assert.equal(clean({ content: 'invalid' }), fallback);
assert.equal(clean('<script>alert(1)</script><p>Review the scope.</p>'), 'Review the scope.');
const page = fs.readFileSync('app/templates/[slug]/page.tsx', 'utf8');
assert.ok(!page.includes('__html: doc.content'), 'raw template HTML must not render');
assert.ok(!page.includes('{faq.q}'));
assert.ok(!page.includes('{item}</'));
assert.ok(page.includes('templatePublicCopy(doc.seo_title'));
assert.ok(page.includes('templatePublicCopy(doc.content)'));
assert.ok(page.includes("replace(/</g, '\\\\u003c')"), 'JSON-LD escapes raw tag starts');
console.log('PASS: public claims/encoded claims replaced; neutral project text retained; content, metadata, lists and FAQ guarded. No database writes.');
