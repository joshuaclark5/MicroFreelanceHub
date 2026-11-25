// Opt-in integration acceptance on the already approved isolated staging project only.
// Usage: node scripts/test-mobile-invoices-hosted.cjs --staging <private-key-json> <receipt-json>
// Only fresh synthetic accounts/rows are created. No schema, production, email or payment changes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const { promisify } = require('node:util');
const { createRequire } = require('node:module');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const ts = require('../mobile/node_modules/typescript');
const mobileRequire = createRequire(path.resolve(__dirname, '../mobile/package.json'));
const { createClient } = mobileRequire('@supabase/supabase-js');

const [flag, keyFile, output] = process.argv.slice(2);
if (flag !== '--staging' || !keyFile || !output) {
  console.error('Explicit --staging, private key file and a new receipt path are required.');
  process.exit(2);
}
if (fs.existsSync(output)) {
  console.error('Refusing to overwrite an existing receipt. Use a new path.');
  process.exit(2);
}
const root = path.resolve(__dirname, '..');
const project = 'lfzaivnvoyvdmvvijnoq';
const url = 'https://' + project + '.supabase.co';
const runId = randomUUID();
const users = [], checks = [], cleanup = [], transport = [], diagnostics = [];
const accountCreateRequests = [];
const execFile = promisify(cp.execFile);
const cli = process.env.MFH_SUPABASE_CLI || 'C:/Users/joshu/AppData/Local/npm-cache/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-windows-x64/bin/supabase.exe';
if (!fs.existsSync(cli)) throw new Error('Existing staging SQL CLI is required for atomic synthetic cleanup.');
let outstandingRequests = 0;
let outstandingOperations = 0;
let stage = 'credential admission', failed = false;
function save() {
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({
    at: new Date().toISOString(), runId, project, stage, failed, syntheticOnly: true,
    sourceSha256: createHash('sha256').update(fs.readFileSync(path.join(root, 'mobile/src/invoiceData.ts'))).digest('hex'),
    users: users.map(({ id, email }) => ({ id, email })), accountCreateRequests, checks, cleanup, diagnostics, transport, outstandingRequests, outstandingOperations,
    sdkVersion: mobileRequire('@supabase/supabase-js/package.json').version,
    postgrestVersion: mobileRequire('@supabase/postgrest-js/package.json').version,
    cleanupComplete: accountCreateRequests.length > 0 && accountCreateRequests.every(c => c.state === 'returned') && users.every(u => cleanup.some(c => c.authUser === u.id && c.verifiedAbsent)),
    limitations: ['Node execution of actual native service, not native device acceptance.',
      'Lost response is simulated after an actual committed hosted RPC.',
      'Only invoice list/reference reads and draft creation are in this candidate scope.'],
    schemaChanges: false, productionWrites: false, deviceTest: false,
  }, null, 2));
}
function ok(result) {
  if (result.error) throw new Error('Backend rejected request (' + (result.error.code || result.error.status || 'unknown') + ').');
  return result.data;
}
async function check(name, test) {
  stage = name; save(); await test(); checks.push(name); save(); console.log('PASS ' + name);
}
function mod(relative, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: n => {
    if (!(n in imports)) throw new Error('Unexpected source import.');
    return imports[n];
  }, Date, Error, Set, Map, BigInt });
  return exports;
}
const shared = mod('app/lib/workspaceInvoices.ts');
const presentation = mod('app/lib/workspacePresentation.ts');
const api = mod('mobile/src/invoiceData.ts', {
  '../../app/lib/workspaceInvoices': shared, '../../app/lib/workspacePresentation': presentation,
});
for (const name of ['loadInvoices', 'loadInvoiceRefs', 'createInvoiceDraft']) {
  const original = api[name];
  api[name] = async (...args) => {
    outstandingOperations++;
    try { return await original(...args); }
    finally { outstandingOperations--; save(); }
  };
}
const tables = ['workspace_invoice_occurrences', 'workspace_invoice_audit', 'workspace_invoice_operations',
  'workspace_invoice_drafts', 'workspace_invoice_schedules', 'workspace_invoice_allowance_entries',
  'workspace_invoice_allowances', 'workspace_invoice_counters',
  'workspace_projects', 'workspace_stages', 'workspace_clients'];
let admin;
async function measuredFetch(input, init = {}) {
  const started = Date.now(), method = init.method || 'GET';
  const signal = init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000);
  const entry = { method, path: new URL(String(input)).pathname, startedAt: new Date(started).toISOString() };
  outstandingRequests++;
  try {
    const response = await fetch(input, { ...init, signal });
    // Consume a clone before recording completion, so headers alone are not quiescence.
    await response.clone().arrayBuffer();
    Object.assign(entry, { status: response.status, elapsedMs: Date.now() - started });
    return response;
  } catch (error) {
    Object.assign(entry, { errorName: error.name, aborted: signal.aborted, elapsedMs: Date.now() - started });
    throw error;
  } finally { entry.endedAt = new Date().toISOString(); outstandingRequests--; transport.push(entry); save(); }
}
function rpcDiagnostic(name, response, op) {
  diagnostics.push({ at: new Date().toISOString(), name, status: response.status, errorCode: response.error?.code || null,
    category: response.error?.code === 'P0001' ? 'terminal application rejection' : response.status === 0 ? 'transport failure' : response.error ? 'backend rejection' : 'success',
    operationId: op.operationId,
    returnedInvoiceId: /^[0-9a-f-]{36}$/.test(response.data?.id || '') ? response.data.id : null,
    operationDigest: createHash('sha256').update(JSON.stringify(op)).digest('hex') }); save();
}
async function atomicCleanup(user) {
  assert.equal(outstandingRequests, 0, 'Client transport is not quiescent.');
  assert.equal(outstandingOperations, 0, 'Native service promises are not settled.');
  assert.match(user.id, /^[0-9a-f-]{36}$/);
  assert.match(runId, /^[0-9a-f-]{36}$/);
  assert.match(user.email, new RegExp('^mfh-invoice-' + runId + '-[01]@example\\.invalid$'));
  const identity = ok(await admin.auth.admin.getUserById(user.id)).user;
  assert.equal(identity.email, user.email);
  assert.equal(identity.user_metadata.mfh_invoice_acceptance, runId);
  // A timed-out HTTP call may still run upstream. This transaction locks the marked
  // owner counter then marked auth user before removing any dedupe receipt. Admitted RPCs
  // must finish first; later requests fail the counter/auth FK after this commits.
  // A CLI timeout is uncertain: inspect this receipt, never blindly resubmit cleanup.
  const sql = `begin; set local lock_timeout='10s'; set local statement_timeout='30s';
do $cleanup$ begin
 perform 1 from public.workspace_invoice_counters where owner_id='${user.id}'::uuid for update;
 perform 1 from auth.users where id='${user.id}'::uuid and email='${user.email}' and raw_user_meta_data->>'mfh_invoice_acceptance'='${runId}' for update;
 if not found then raise exception 'Synthetic cleanup identity mismatch'; end if;
 ${tables.map(table => `delete from public.${table} where owner_id='${user.id}'::uuid;`).join('\n ')}
 delete from auth.users where id='${user.id}'::uuid and email='${user.email}' and raw_user_meta_data->>'mfh_invoice_acceptance'='${runId}';
end $cleanup$;
commit;`;
  cleanup.push({ actor: user.id, atomicCleanupSubmitted: true, clientRequestsOutstanding: outstandingRequests }); save();
  const result = await execFile(cli, ['db', 'query', '--remote=' + project, '--yes', sql, '--output', 'json'],
    { encoding: 'utf8', timeout: 55000, windowsHide: true, maxBuffer: 1024 * 1024 });
  assert.ok(result.stdout, 'No cleanup execution receipt.');
  for (const table of tables) {
    const remaining = await admin.from(table).select('owner_id', { count: 'exact', head: true }).eq('owner_id', user.id);
    const verifiedAbsent = !remaining.error && remaining.count === 0;
    cleanup.push({ table, actor: user.id, verifiedAbsent, status: remaining.status, count: remaining.count, code: remaining.error?.code }); save();
    assert.ok(verifiedAbsent, 'Synthetic table cleanup unverified.');
  }
  const absent = await admin.auth.admin.getUserById(user.id);
  const verifiedAbsent = absent.error?.status === 404 && !absent.data?.user;
  cleanup.push({ authUser: user.id, verifiedAbsent }); save();
  assert.ok(verifiedAbsent, 'Synthetic auth cleanup unverified.');
  await user.db.auth.signOut({ scope: 'local' });
}
(async () => {
  try {
    const bytes = fs.readFileSync(keyFile);
    const keys = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
    const anon = keys.find(k => k.id === 'anon')?.api_key;
    const service = keys.find(k => k.id === 'service_role')?.api_key;
    for (const [token, role] of [[anon, 'anon'], [service, 'service_role']]) {
      const claim = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
      assert.equal(claim.ref, project, 'Non-staging credential refused.');
      assert.equal(claim.role, role, 'Wrong credential role refused.');
    }
    const projects = await execFile(cli, ['projects', 'list', '--output', 'json'], { encoding: 'utf8', timeout: 55000, windowsHide: true });
    const target = JSON.parse(projects.stdout).find(item => item.id === project);
    assert.equal(target?.name, 'MicroFreelanceHub-stage-latest-20261120');
    assert.equal(target?.status, 'ACTIVE_HEALTHY');
    const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: measuredFetch } };
    admin = createClient(url, service, options);
    await check('Known isolated staging admission and existing schema readable', async () => {
      // No customer data retrieved. A missing schema is a stop, never permission to apply migrations.
      for (const table of tables) ok(await admin.from(table).select('owner_id', { head: true }).limit(0));
    });
    await check('Fresh synthetic accounts authenticated', async () => {
      for (let i = 0; i < 2; i++) {
        const email = 'mfh-invoice-' + runId + '-' + i + '@example.invalid';
        const password = randomUUID() + randomUUID();
        const creation = { email, state: 'pending' }; accountCreateRequests.push(creation); save();
        const created = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true,
          user_metadata: { mfh_invoice_acceptance: runId } })).user;
        const db = createClient(url, anon, options);
        creation.state = 'returned';
        users.push({ id: created.id, email, db }); save();
        const session = ok(await db.auth.signInWithPassword({ email, password }));
        assert.equal(session.user.id, created.id);
      }
    });
    const [a, b] = users;
    let clientA, clientB, projectA;
    await check('Synthetic owner-specific client and project references', async () => {
      clientA = ok(await admin.from('workspace_clients').insert({ owner_id: a.id, name: 'Fictional invoice client A' }).select('id').single());
      clientB = ok(await admin.from('workspace_clients').insert({ owner_id: b.id, name: 'Fictional invoice client B' }).select('id').single());
      const stageA = ok(await admin.from('workspace_stages').insert({ owner_id: a.id, name: 'Fictional invoice stage', position: 0 }).select('id').single());
      projectA = ok(await admin.from('workspace_projects').insert({ owner_id: a.id, client_id: clientA.id, stage_id: stageA.id, name: 'Fictional invoice project', status: 'active' }).select('id').single());
      const clients = await api.loadInvoiceRefs(a.db, a.id, 'clients');
      assert.equal(clients.rows.length, 1); assert.equal(clients.rows[0].id, clientA.id);
      assert.equal(clients.next, null);
      assert.deepEqual(Object.keys(clients.rows[0]).sort(), ['id', 'name', 'owner_id']);
      const projects = await api.loadInvoiceRefs(a.db, a.id, 'projects');
      assert.equal(projects.rows.length, 1); assert.equal(projects.rows[0].id, projectA.id);
      assert.equal(projects.rows[0].client_id, clientA.id);
      assert.equal((await api.loadInvoiceRefs(b.db, b.id, 'projects')).rows.length, 0);
    });
    function operation(currency = 'USD', price = '12.50') {
      return api.prepareInvoiceDraft(a.id, randomUUID(), {
        ...api.freshInvoice(new Date('2026-11-25T12:00:00Z')), clientId: clientA.id, projectId: projectA.id,
        seller: 'Fictional staging seller', currency, issueDate: '2026-11-25', dueDate: '2026-12-02',
        memo: 'Synthetic acceptance only', lines: [{ description: 'Fictional design work', quantity: '3', price }],
      });
    }
    async function ownerInvoiceFingerprint(actor) {
      const rows = {};
      for (const table of tables.filter(table => table.startsWith('workspace_invoice_'))) {
        const data = ok(await admin.from(table).select('*').eq('owner_id', actor));
        rows[table] = data.map(row => JSON.stringify(row)).sort();
      }
      return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    }
    async function terminalConflict(db, op, label, actors = [a.id]) {
      const before = []; for (const actor of actors) before.push(await ownerInvoiceFingerprint(actor));
      const began = Date.now();
      const result = await db.rpc('workspace_invoice_mutate', { p: op });
      const elapsedMs = Date.now() - began;
      rpcDiagnostic(label, result, op);
      const diagnostic = diagnostics.at(-1); diagnostic.elapsedMs = elapsedMs; save();
      assert.equal(result.status, 400, 'Permanent application conflict must return terminal HTTP 400.');
      assert.equal(result.error?.code, 'P0001');
      assert.ok(elapsedMs < 5000, 'Permanent conflict response exceeded five seconds.');
      const after = []; for (const actor of actors) after.push(await ownerInvoiceFingerprint(actor));
      assert.deepEqual(after, before, 'Rejected operation changed invoice rows, counters, snapshots or deduplication records.');
      diagnostic.invoiceRowsUnchanged = true; diagnostic.beforeOwnerHashes = before; diagnostic.afterOwnerHashes = after; save();
    }
    let usdOp, usd;
    await check('Actual native reviewed USD draft save and exact total', async () => {
      usdOp = operation(); usd = await api.createInvoiceDraft(a.db, usdOp);
      assert.equal(usd.total_minor, 3750); assert.equal(usd.owner_id, a.id);
      assert.equal(usd.status, 'draft'); assert.equal(usd.number, null); assert.equal(usd.version, 1);
      diagnostics.push({ at: new Date().toISOString(), name: 'baseline reviewed USD operation',
        operationId: usdOp.operationId, returnedInvoiceId: usd.id,
        operationDigest: createHash('sha256').update(JSON.stringify(usdOp)).digest('hex') });
    });
    await check('Concurrent same-operation retry returns exactly one saved draft', async () => {
      const settled = await Promise.allSettled([api.createInvoiceDraft(a.db, usdOp), api.createInvoiceDraft(a.db, usdOp)]);
      assert.ok(settled.every(result => result.status === 'fulfilled'), 'One or more concurrent native retries failed.');
      const rows = settled.map(result => result.value);
      assert.ok(rows.every(r => r.id === usd.id));
      const page = await api.loadInvoices(a.db, a.id);
      assert.equal(page.rows.length, 1); assert.equal(page.rows[0].id, usd.id);
      assert.equal(page.next, null);
    });
    await check('Changed-body operation reuse rejected by hosted RPC', async () => {
      const changedOp = { ...usdOp, document: { ...usdOp.document, memo: 'Different request' } };
      await terminalConflict(a.db, changedOp, 'changed-body reuse');
      const page = await api.loadInvoices(a.db, a.id);
      assert.equal(page.rows.length, 1); assert.equal(page.rows[0].id, usd.id);
      assert.equal(page.rows[0].document.memo, usdOp.document.memo);
    });
    await check('JPY and KWD exact minor-unit conversions survive hosted receipts', async () => {
      const jpy = await api.createInvoiceDraft(a.db, operation('JPY', '125'));
      const kwd = await api.createInvoiceDraft(a.db, operation('KWD', '12.345'));
      assert.equal(jpy.total_minor, 375); assert.equal(kwd.total_minor, 37035);
    });
    await check('Lost response after committed hosted RPC recovers original identity', async () => {
      const op = operation('USD', '0.01');
      const lost = { auth: a.db.auth, rpc: async (name, args) => {
        ok(await a.db.rpc(name, args)); throw new Error('Simulated response loss after hosted commit');
      } };
      await assert.rejects(() => api.createInvoiceDraft(lost, op), /Simulated response loss/);
      const recovered = await api.createInvoiceDraft(a.db, op);
      assert.equal(recovered.total_minor, 3);
      const repeated = await api.createInvoiceDraft(a.db, op); assert.equal(recovered.id, repeated.id);
      const page = await api.loadInvoices(a.db, a.id); assert.equal(page.rows.length, 4);
      assert.ok(page.rows.every(r => r.owner_id === a.id));
    });
    await check('Other-account list and guessed-id reads reveal no invoice rows', async () => {
      assert.equal((await api.loadInvoices(b.db, b.id)).rows.length, 0);
      assert.equal(ok(await b.db.from('workspace_invoice_drafts').select('id')).length, 0);
      assert.equal(ok(await b.db.from('workspace_invoice_drafts').select('id').eq('id', usd.id)).length, 0);
    });
    await check('Native actor fence and hosted actor/relationship checks reject foreign writes', async () => {
      await assert.rejects(() => api.createInvoiceDraft(b.db, usdOp), api.InvoiceAccountChanged);
      await assert.rejects(() => api.loadInvoices(b.db, a.id), api.InvoiceAccountChanged);
      await terminalConflict(b.db, usdOp, 'actor mismatch', [a.id, b.id]);
      const foreign = { ...usdOp, expectedActorId: b.id, operationId: randomUUID(), document: { ...usdOp.document, projectId: null } };
      const foreignResult = await b.db.rpc('workspace_invoice_mutate', { p: foreign });
      rpcDiagnostic('foreign client', foreignResult, foreign);
      assert.ok(foreignResult.status > 0 && ['23503', 'P0001'].includes(foreignResult.error?.code));
      const wrongClient = { ...usdOp, operationId: randomUUID(), document: { ...usdOp.document, clientId: clientB.id } };
      const wrongClientResult = await a.db.rpc('workspace_invoice_mutate', { p: wrongClient });
      rpcDiagnostic('project client mismatch', wrongClientResult, wrongClient);
      assert.ok(wrongClientResult.status > 0 && ['23503', 'P0001'].includes(wrongClientResult.error?.code));
    });
    await check('Anonymous RPC and authenticated direct draft deletion denied', async () => {
      const anonDb = createClient(url, anon, options);
      assert.equal((await anonDb.rpc('workspace_invoice_mutate', { p: usdOp })).error?.code, '42501');
      assert.equal((await a.db.from('workspace_invoice_drafts').delete().eq('id', usd.id)).error?.code, '42501');
      assert.equal((await api.loadInvoices(a.db, a.id)).rows.length, 4);
    });
    await check('Remaining four permanent conflict branches return promptly without changing rows', async () => {
      const rawOperation = values => ({ operationId: randomUUID(), expectedActorId: a.id, ...values });
      await terminalConflict(a.db, rawOperation({ action: 'edit', id: usd.id, version: 2, document: usdOp.document }), 'stale invoice version');
      await terminalConflict(a.db, rawOperation({ action: 'issue', id: usd.id, version: 1, reviewedTotalMinor: 3749 }), 'review total mismatch');
      const issueOp = rawOperation({ action: 'issue', id: usd.id, version: 1, reviewedTotalMinor: 3750 });
      const issued = ok(await a.db.rpc('workspace_invoice_mutate', { p: issueOp }));
      assert.equal(issued.status, 'issued'); assert.equal(issued.version, 2);
      const again = ok(await a.db.rpc('workspace_invoice_mutate', { p: issueOp }));
      assert.equal(again.id, issued.id); assert.deepEqual(again.snapshot, issued.snapshot);
      await terminalConflict(a.db, rawOperation({ action: 'edit', id: issued.id, version: 2, document: { ...usdOp.document, memo: 'Attempted issued change' } }), 'non-draft mutation');
      const scheduleOp = rawOperation({ action: 'schedule', document: usdOp.document, frequency: 'weekly', anchor: '2026-11-25' });
      const schedule = ok(await a.db.rpc('workspace_invoice_mutate', { p: scheduleOp }));
      assert.equal(schedule.version, 1);
      await terminalConflict(a.db, rawOperation({ action: 'pause', id: schedule.id, version: 2 }), 'stale schedule version');
      const page = await api.loadInvoices(a.db, a.id);
      assert.equal(page.rows.length, 4);
      assert.deepEqual(page.rows.find(row => row.id === issued.id).snapshot, issued.snapshot);
    });
  } catch (e) {
    failed = true;
    diagnostics.push({ phase: stage, errorName: e.name, code: e.code || null,
      expected: typeof e.expected === 'string' ? e.expected : undefined,
      actual: typeof e.actual === 'string' || e.actual === undefined || e.actual === null ? e.actual ?? null : undefined });
    // Never print backend bodies, session data, keys or whole error objects.
    console.error('FAIL at ' + stage + ' (' + (e.code || e.name || 'Error') + ').');
    process.exitCode = 1;
  } finally {
    stage = 'scoped synthetic cleanup'; save();
    if (accountCreateRequests.some(request => request.state !== 'returned')) {
      failed = true; process.exitCode = 1;
      diagnostics.push({ phase: 'cleanup', category: 'Unconfirmed synthetic account creation; recover only the receipt email and exact run marker before another run.' }); save();
    }
    for (const user of users) {
      try {
        await atomicCleanup(user);
      } catch (e) {
        failed = true; process.exitCode = 1;
        cleanup.push({ actor: user.id, verifiedAbsent: false, phase: 'cleanup failure', code: e.code || e.name }); save();
        console.error('Synthetic cleanup incomplete; inspect receipt; no broad retry performed.');
      }
    }
    stage = failed ? 'failed' : 'complete'; save();
  }
  if (!failed) console.log(JSON.stringify({ passed: checks.length, cleanupComplete: true, productionWrites: false, deviceTest: false }));
})();
