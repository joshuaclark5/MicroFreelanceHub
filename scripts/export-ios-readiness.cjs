// Local iOS JavaScript readiness check only. Does not build/sign/upload an IPA.
// Uses only the existing public backend URL and anon key; no network mutation.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts', 'ios-readiness-export');
const receiptFile = path.join(root, 'artifacts', 'ios-readiness-receipt.json');
const sourceConfig = 'C:/Users/joshu/Downloads/MicroFreelanceHub-GitHubPush/MicroFreelanceHubFrontend/.env.local';
const config = require('dotenv').parse(fs.readFileSync(sourceConfig));
assert.equal(config.NEXT_PUBLIC_SUPABASE_URL, 'https://rjgttmwrbyjqifodjnqm.supabase.co');
const claims = JSON.parse(Buffer.from(config.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.')[1], 'base64url'));
assert.equal(claims.role, 'anon', 'Only the public anonymous backend key is allowed');
assert.equal(claims.ref, 'rjgttmwrbyjqifodjnqm', 'Backend key project mismatch');
const app = JSON.parse(fs.readFileSync(path.join(root, 'mobile/app.json'), 'utf8')).expo;
assert.equal(app.ios.bundleIdentifier, 'com.microfreelancehub.mobile');
assert.ok(app.platforms.includes('ios'));
function digest() {
  const files = cp.execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'mobile', 'app/lib'], {cwd: root, encoding: 'utf8', windowsHide: true}).trim().split(/\r?\n/).filter(Boolean).sort();
  const hash = crypto.createHash('sha256');
  for (const file of files) hash.update(file + '\0').update(fs.readFileSync(path.join(root, file)));
  return hash.digest('hex');
}
const sourceSha256 = digest();
const sourceCommit = cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8', windowsHide: true}).trim();
const dirty = !!cp.execFileSync('git', ['status', '--porcelain', '--', 'mobile', 'app/lib'], {cwd: root, encoding: 'utf8', windowsHide: true}).trim();
// Explicit store mode suppresses website purchase-path shortcuts. This is not
// an App Store approval claim or a replacement for login/deletion review.
const env = {...process.env, NODE_ENV: 'production', CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_NO_DOTENV: '1', EXPO_PUBLIC_DISTRIBUTION: 'appstore', EXPO_PUBLIC_SUPABASE_URL: config.NEXT_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY: config.NEXT_PUBLIC_SUPABASE_ANON_KEY};
fs.mkdirSync(path.dirname(receiptFile), {recursive: true});
fs.writeFileSync(receiptFile, JSON.stringify({startedAt: new Date().toISOString(), status: 'running', sourceCommit, sourceSha256, dirty, nativeBuild: false, uploaded: false}, null, 2));
const result = cp.spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'ios', '--max-workers', '1', '--output-dir', output], {cwd: path.join(root, 'mobile'), env, stdio: 'inherit', windowsHide: true});
const unchanged = sourceSha256 === digest();
const receipt = {finishedAt: new Date().toISOString(), status: result.status === 0 && unchanged ? 'passed' : 'failed', exitCode: result.status, sourceCommit, sourceSha256, sourceUnchanged: unchanged, dirty, platform: 'ios', distribution: 'appstore', version: app.version, bundleIdentifier: app.ios.bundleIdentifier, output, nativeBuild: false, signed: false, deviceTested: false, uploaded: false};
fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
process.exitCode = result.status || (unchanged ? 0 : 1);
if (result.error || result.status === null) process.exitCode = 1;
