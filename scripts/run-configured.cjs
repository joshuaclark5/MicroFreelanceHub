#!/usr/bin/env node
'use strict';
// Load an explicitly selected private environment without copying it into a checkout.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const args = process.argv.slice(2);
const mode = args[0];
if (!['check', 'build', 'start'].includes(mode) || !process.env.MFH_ENV_FILE || !path.isAbsolute(process.env.MFH_ENV_FILE)) {
  console.error('Use check|build|start with MFH_ENV_FILE set to an absolute private environment-file path.');
  process.exit(1);
}
let parsed;
try { parsed = require('dotenv').parse(fs.readFileSync(process.env.MFH_ENV_FILE)); }
catch { console.error('The configured private environment file could not be read.'); process.exit(1); }
// An explicit file wins over inherited shell variables; never silently mix Stripe modes.
const env = {...process.env, ...parsed};
const required = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY'];
const missing = required.filter(name => !env[name]?.trim());
if (missing.length) { console.error('Missing required environment names: ' + missing.join(', ')); process.exit(1); }
if (!/^https:\/\//.test(env.NEXT_PUBLIC_SUPABASE_URL) || !/^(sk|rk)_(test|live)_/.test(env.STRIPE_SECRET_KEY)) {
  console.error('Invalid Supabase URL or Stripe key format. Values are not displayed.'); process.exit(1);
}
const stripeMode = /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY) ? 'test' : 'live';
if (env.MFH_EXPECT_STRIPE_MODE && env.MFH_EXPECT_STRIPE_MODE !== stripeMode) {
  console.error('Stripe mode does not match MFH_EXPECT_STRIPE_MODE. Refusing to start.'); process.exit(1);
}
console.log('Required build/runtime configuration present. Stripe mode: ' + stripeMode + '. No provider requests made by this check.');
if (mode === 'check') process.exit(0);
const nextArgs = [require.resolve('next/dist/bin/next'), mode];
if (mode === 'start') {
  const port = Number(env.PORT || 3087);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {console.error('Invalid local port.');process.exit(1);}
  // Local QA only. Browser fixtures must intercept external mutation paths.
  nextArgs.push('-p', String(port), '-H', '127.0.0.1');
}
const result = spawnSync(process.execPath, nextArgs, {env, stdio:'inherit'});
process.exit(result.status ?? 1);
