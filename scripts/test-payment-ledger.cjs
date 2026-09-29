const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      grant usage on schema auth to authenticated, anon;
      create table public.sow_documents (id uuid primary key, price numeric, status text, last_payment_date timestamptz, user_id uuid default '00000000-0000-4000-8000-000000000010', signed_by text, provider_sign text);
      insert into public.sow_documents (id, price, status, last_payment_date) values
        ('00000000-0000-4000-8000-000000000001', 1000, 'Signed', null),
        ('00000000-0000-4000-8000-000000000002', 1000, 'Paid', null),
        ('00000000-0000-4000-8000-000000000003', 1000, 'Signed', null);
    `);
    await db.exec(fs.readFileSync('supabase/migrations/20260929000000_agreement_payment_receipts.sql', 'utf8'));
    const id = '00000000-0000-4000-8000-000000000001';
    const pay = (session, amount, currency = 'usd', target = id) => db.query('select public.record_agreement_payment($1::uuid, $2::text, $3::bigint, $4::text)', [target, session, amount, currency]);
    const state = async () => (await db.query('select status, payment_received_cents from public.sow_documents where id = $1', [id])).rows[0];
    await pay('cs_deposit', 50000);
    assert.equal((await state()).status, 'Signed');
    assert.equal(Number((await state()).payment_received_cents), 50000);
    await pay('cs_deposit', 50000);
    assert.equal(Number((await state()).payment_received_cents), 50000, 'Replayed confirmation must not double count');
    await assert.rejects(pay('cs_deposit', 50000, 'usd', '00000000-0000-4000-8000-000000000003'));
    await assert.rejects(pay('cs_invalid', -1));
    await assert.rejects(pay('cs_invalid', 1, 'eur'));
    await pay('cs_balance', 50000);
    assert.equal((await state()).status, 'Paid');
    assert.equal(Number((await state()).payment_received_cents), 100000);
    assert.equal(Number((await db.query("select payment_received_cents from public.sow_documents where id = '00000000-0000-4000-8000-000000000002'")).rows[0].payment_received_cents), 100000);
    await db.exec('set role anon');
    await assert.rejects(pay('cs_forged', 100));
    await db.exec('reset role');
    await db.exec(`update public.sow_documents set signed_by = 'Client', provider_sign = 'Owner' where id = '${id}'`);
    await db.exec("grant select, update on public.sow_documents to authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000010', false); set role authenticated;");
    await assert.rejects(db.exec(`update public.sow_documents set payment_received_cents = 999999 where id = '${id}'`), /Verified server action required/);
    await assert.rejects(db.exec(`update public.sow_documents set provider_sign = 'Forged' where id = '${id}'`), /Verified server action required/);
    await assert.rejects(db.exec(`update public.sow_documents set price = 1500 where id = '${id}'`), /Changed agreements require new signatures/);
    await db.exec(`update public.sow_documents set price = 1500, status = 'Draft', signed_by = null, provider_sign = null where id = '${id}'`);
    assert.equal(Number((await state()).payment_received_cents), 100000, 'Change orders preserve money already received');
    await assert.rejects(db.exec(`update public.sow_documents set status = 'Paid' where id = '${id}'`), /Verified server action required/);
    await db.exec('reset role');
    await db.exec(`
      alter table public.sow_documents
        add column client_name text, add column client_data jsonb,
        add column email text, add column title text, add column due_date date,
        add column dunning_enabled boolean default true,
        add column dunning_emails_sent jsonb default '[]', add column dunning_last_error text;
      create schema net;
      create table public.test_mail_requests (body jsonb);
      create function net.http_post(url text, body jsonb, headers jsonb) returns bigint
      language plpgsql as 'begin insert into public.test_mail_requests values (body); return 1; end';
      update public.sow_documents set email = 'fixture@example.test', due_date = current_date - 5;
      update public.sow_documents set status = 'Signed', signed_by = 'Client', provider_sign = 'Owner' where id = '${id}';
    `);
    await db.exec(fs.readFileSync('supabase/migrations/20260929000001_balance_aware_reminders.sql', 'utf8'));
    await db.exec('select public.process_daily_dunning()');
    const reminders = (await db.query('select body from public.test_mail_requests')).rows;
    assert.equal(reminders.length, 1, 'Skip paid and unsigned documents');
    assert.equal(Number(reminders[0].body.amount_due), 500, 'Reminder excludes received money');
    await db.exec('select public.process_daily_dunning()');
    assert.equal((await db.query('select body from public.test_mail_requests')).rows.length, 1, 'Do not repeat same milestone');
    console.log('PASS: PostgreSQL migration, paid-record backfill, partial/full balances, receipt replay, cross-agreement conflict rollback, invalid amounts/currency and anonymous RPC rejection (isolated PGlite database).');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
