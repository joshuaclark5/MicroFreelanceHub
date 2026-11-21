const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app', 'login', 'page.tsx'), 'utf8');
const labelsById = new Map();
const inputsById = new Set();

for (const match of source.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
  const htmlFor = match[1].match(/\bhtmlFor="([^"]+)"/);
  if (htmlFor) labelsById.set(htmlFor[1], match[2].replace(/\s+/g, ' ').trim());
}

for (const match of source.matchAll(/<input\b([^>]*)\/?\s*>/g)) {
  const id = match[1].match(/\bid="([^"]+)"/);
  if (id) inputsById.add(id[1]);
}

assert.ok(inputsById.has('auth-email'), 'Email input must have a stable id');
assert.equal(labelsById.get('auth-email'), 'Email address', 'Email input needs a programmatic label');
assert.ok(inputsById.has('auth-password'), 'Password input must have a stable id');
assert.match(labelsById.get('auth-password') || '', /Password/, 'Password input needs a programmatic label');
assert.ok(labelsById.get('auth-password').includes('Create password'), 'Signup mode must identify the new-password field');

console.log('PASS: login and signup email/password fields have accessible labels');
