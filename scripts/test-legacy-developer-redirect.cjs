const assert = require('node:assert/strict');
const config = require('../next.config');

(async () => {
  const redirects = await config.redirects();
  const source = '/posts/web-developer-programmer';
  const matching = redirects.filter(rule => rule.source === source);
  assert.equal(matching.length, 1, 'Legacy entry must have exactly one explicit redirect');
  assert.deepEqual(matching[0], {
    source,
    destination: '/templates/web-development-contract',
    permanent: true,
  });
  const fallbackIndex = redirects.findIndex(rule => rule.source === '/posts/:slug*');
  assert.ok(fallbackIndex >= 0, 'Keep the existing legacy-post fallback');
  assert.ok(redirects.findIndex(rule => rule.source === source) < fallbackIndex,
    'Specific developer redirect must win over the homepage fallback');
  console.log('PASS: legacy developer entry uses the verified permanent destination before the catch-all');
})().catch(error => { console.error(error); process.exitCode = 1; });
