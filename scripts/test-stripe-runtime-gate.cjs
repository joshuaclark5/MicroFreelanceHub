const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const sourcePath = path.join(__dirname, '..', 'app', 'lib', 'stripeRuntime.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const js = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 });
const testModule = { exports: {} };
vm.runInNewContext(js, { module: testModule, exports: testModule.exports, process });
const { getStripeSecretKey } = testModule.exports;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function rejects(env, message) {
  let thrown = false;
  try { getStripeSecretKey(env); } catch { thrown = true; }
  assert(thrown, message);
}

assert(getStripeSecretKey({ STRIPE_SECRET_KEY: 'sk_test_fixture', VERCEL_ENV: 'preview' }) === 'sk_test_fixture', 'Preview should allow test keys');
assert(getStripeSecretKey({ STRIPE_SECRET_KEY: 'rk_test_fixture', VERCEL_ENV: 'preview' }) === 'rk_test_fixture', 'Preview should allow restricted test keys');
assert(getStripeSecretKey({ STRIPE_SECRET_KEY: 'sk_test_fixture', VERCEL_ENV: 'production' }) === 'sk_test_fixture', 'Production may use a test key during a controlled configuration period');
assert(getStripeSecretKey({ STRIPE_SECRET_KEY: 'sk_live_fixture', VERCEL_ENV: 'production' }) === 'sk_live_fixture', 'Production should allow its configured live key');
rejects({ STRIPE_SECRET_KEY: 'sk_live_fixture', VERCEL_ENV: 'preview' }, 'Preview must reject live keys');
rejects({ STRIPE_SECRET_KEY: 'sk_live_fixture', VERCEL_ENV: 'development' }, 'Development must reject live keys');
rejects({ STRIPE_SECRET_KEY: 'sk_live_fixture' }, 'Local runtime must reject live keys');
rejects({ VERCEL_ENV: 'preview' }, 'Missing keys must fail closed');
const files = execFileSync('git', ['ls-files', 'app'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim().split(/\r?\n/).filter(file => /\.tsx?$/.test(file));
for (const file of files) {
  const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert(!/new\s+Stripe\s*\(\s*process\.env\.STRIPE_SECRET_KEY/.test(text), `${file} must not bypass the runtime key gate`);
  if (/new\s+Stripe\s*\(/.test(text) && file !== 'app/lib/stripeRuntime.ts') {
    assert(/getStripeSecretKey/.test(text), `${file} must use the runtime key gate`);
  }
}
console.log('8 Stripe runtime gate cases passed, plus route source scan');
