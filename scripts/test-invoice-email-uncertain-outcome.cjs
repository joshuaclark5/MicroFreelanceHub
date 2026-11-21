'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app/dashboard/page.tsx'), 'utf8');
const start = source.indexOf('const handleSendInvoice = async');
const end = source.indexOf('const handleCopyPayLink = async', start);
assert.notEqual(start, -1, 'invoice email handler must exist');
assert.notEqual(end, -1, 'invoice email handler boundary must exist');

const handler = source.slice(start, end);
const failureCopy = 'We could not confirm whether the invoice email was delivered. Check with the client before trying again to avoid sending a duplicate. You can copy and share the payment link instead.';

assert.equal((handler.match(new RegExp(failureCopy, 'g')) || []).length, 2, 'both provider and thrown errors should use uncertainty-safe guidance');
const providerError = handler.indexOf('if (invoiceError)');
const providerAlert = handler.indexOf(`alert('${failureCopy}');`, providerError);
assert.ok(providerError >= 0 && providerAlert > providerError, 'provider errors should show uncertainty-safe guidance');
assert.match(handler.slice(providerError, handler.indexOf('setInvoiceSentIds')), /return;/, 'provider errors must return before marking sent');
assert.match(handler, /setInvoiceSentIds\(\[\.\.\.invoiceSentIds,\s*sow\.id\]\);/);
assert.ok(providerError < handler.indexOf('setInvoiceSentIds'), 'failed/uncertain sends must not be marked sent');
assert.doesNotMatch(handler, /Please try again|try again immediately/i, 'uncertain delivery must not encourage blind resend');

console.log('PASS invoice email uncertainty is reported without marking sent or encouraging a blind retry');
