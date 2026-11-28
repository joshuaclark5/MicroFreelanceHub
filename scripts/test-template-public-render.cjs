const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let document;
const db = { from() { return { select() { return { eq() { return { async single() { return { data: document }; } }; } }; } }; } };
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, process: { env: {} }, require(name) {
    if (name === '@supabase/supabase-js') return { createClient: () => db };
    if (name === 'next/navigation') return { notFound() { throw Error('not found'); }, redirect() { throw Error('redirect'); } };
    if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name.includes('/components/')) return { default: () => null };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), `${name}.ts`));
    return require(name);
  } });
  return exports;
}
(async () => {
  const page = load('app/templates/[slug]/page.tsx');
  for (const [slug, job] of [['parking-lot-striper-contract-template', 'Parking Lot Striper'], ['graphic-designer-service-agreement', 'Graphic Designer']]) {
    document = {
      job_title: job, document_type: 'Contract', seo_title: 'Guaranteed payment and legal protection',
      content: '<p>The Contractor is not liable for defects. It shifts liability back to the owner.</p>',
      pain_point_hook: 'A template protects your business.', snippet_answer: 'A legally binding contract.',
      why_it_matters: 'It prevents a total financial wash.', real_world_scenario: 'The client is contractually obligated to pay.',
      deliverables: ['Two revision rounds.', 'ADA-compliant markings.'],
      faqs: [{ q: 'Does this guarantee payment?', a: 'It guarantees payment.' }, { q: 'What should I include?', a: 'Scope, schedule and payment details.' }],
      best_practices: [{ title: 'Protect yourself legally', description: 'Limit liability.' }],
    };
    const before = JSON.stringify(document);
    const metadata = await page.generateMetadata({ params: { slug } });
    const html = renderToStaticMarkup(await page.default({ params: { slug } }));
    const searchable = html + JSON.stringify(metadata);
    for (const phrase of ['not liable', 'shifts liability', 'contractually obligated', 'guarantee payment', 'guarantees payment', 'Guaranteed payment', 'ADA-compliant', 'protected boundaries', 'financial wash', 'Built from real freelance']) assert.ok(!searchable.includes(phrase), phrase);
    assert.ok(html.includes('Two revision rounds.'));
    assert.ok(html.includes(`/create?template=${slug}`));
    assert.equal(metadata.alternates.canonical, `https://www.microfreelancehub.com/templates/${slug}`);
    assert.ok(html.includes('A starting point for your project'));
    assert.equal(JSON.stringify(document), before, 'presentation must not mutate stored input');
    const structured = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
    assert.equal(structured.length, 2);
    for (const match of structured) JSON.parse(match[1]);
  }
  console.log('PASS: actual async template page + metadata rendered for both cohorts; unsafe claims absent across HTML/schema/metadata, safe details/CTA/canonical retained, no document mutations. Mock DB, not hosted browser proof.');
})().catch(error => { console.error(error); process.exitCode = 1; });
