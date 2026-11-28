const fs=require('fs'),assert=require('assert/strict'),{PGlite}=require('C:/Users/joshu/mfh-payment-sql-proof/node_modules/@electric-sql/pglite');
(async()=>{const db=new PGlite();try{
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',current_setting('request.jwt.claim.session',true))$$;
grant usage on schema auth,public to anon,authenticated,service_role;
create table sow_documents(id uuid primary key,user_id uuid,client_data jsonb,email text,signed_by text,provider_sign text,price numeric,status text default 'Draft');
alter table sow_documents enable row level security;grant select on sow_documents to anon,authenticated;
create policy owner_read on sow_documents for select using(auth.uid()=user_id);
create policy "Public Read System Templates" on sow_documents for select using(user_id is null);`);
for(const name of ['20261128020000_reviewed_agreement_acceptance.sql','20261128050000_recipient_verification_hold.sql','20261128051000_explicit_recipient_ownership.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
const owner='11111111-1111-4111-8111-111111111111',actor='22222222-2222-4222-8222-222222222222',other='88888888-8888-4888-8888-888888888888',doc='33333333-3333-4333-8333-333333333333',session='44444444-4444-4444-8444-444444444444',different='55555555-5555-4555-8555-555555555555';
let count=0;const id=()=>`66666666-6666-4666-8666-${String(++count).padStart(12,'0')}`;
const hash='a'.repeat(64),bad='b'.repeat(64);
await db.query("insert into auth.users values($1,'owner@fixture.invalid',now()),($2,'recipient@fixture.invalid',now()),($3,'other@fixture.invalid',now())",[owner,actor,other]);
await db.query("insert into sow_documents(id,user_id,client_data,price)values($1,$2,'{\"email\":\"recipient@fixture.invalid\"}',200)",[doc,owner]);
async function read(who,sess){await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.session',$2,false)",[who,sess]);await db.exec('set role authenticated');try{return (await db.query('select * from sow_documents')).rows.length;}finally{await db.exec('reset role');}}
async function start(who=actor,sess=session){return db.query('select start_recipient_challenge($1,$2,$3,$4,$5)',[id(),doc,who,sess,hash]);}
async function finish(h=hash,sess=session){return (await db.query('select finish_recipient_challenge($1,$2,$3,$4) ok',[doc,actor,sess,h])).rows[0].ok;}
assert.equal(await read(actor,session),0);assert.equal(await read(owner,session),1);
await assert.rejects(()=>start(other),e=>e.code==='42501');
await db.exec('set role authenticated');await assert.rejects(()=>start(),e=>e.code==='42501');await db.exec('reset role');
await start();assert.equal(await finish(hash,different),false);assert.equal(await finish(bad),false);assert.equal(await read(actor,session),0);
assert.equal(await finish(),true);assert.equal(await finish(),false);assert.equal(await read(actor,session),1);assert.equal(await read(actor,different),0);
await db.query("update sow_documents set price=210 where id=$1",[doc]);assert.equal(await read(actor,session),0);
await start();await db.exec("update agreement_recipient_challenges set expires_at=now()-interval '1 second' where verified_at is null");assert.equal(await finish(),false);
await start();for(let i=0;i<5;i++)assert.equal(await finish(bad),false);assert.equal(await finish(),false);await assert.rejects(()=>start(),e=>e.code==='54000');
// Expire only rate records in this isolated fixture, then prove actual acceptance.
await db.exec("update agreement_recipient_challenges set created_at=now()-interval '2 hours'");await start();assert.equal(await finish(),true);
await assert.rejects(()=>db.query("select accept_session_reviewed_agreement($1,2,$2,'Synthetic Recipient','client',$3)",[doc,actor,different]),e=>e.code==='42501');
await assert.rejects(()=>db.query("select accept_reviewed_agreement($1,2,$2,'Synthetic Recipient','client')",[doc,actor]),e=>e.code==='42501');
await db.query("select accept_session_reviewed_agreement($1,2,$2,'Synthetic Recipient','client',$3)",[doc,actor,session]);
const replay=await db.query("select accept_session_reviewed_agreement($1,2,$2,'Synthetic Recipient','client',$3) r",[doc,actor,session]);assert.equal(replay.rows[0].r.alreadyRecorded,true);
assert.equal((await db.query('select count(*) n from agreement_acceptances')).rows[0].n,1);
await assert.rejects(()=>db.query('update sow_documents set price=1 where id=$1',[doc]),e=>e.code==='42501');
await db.query("update auth.users set email='changed@fixture.invalid' where id=$1",[actor]);assert.equal(await read(actor,session),0);
await db.query("update auth.users set email='recipient@fixture.invalid' where id=$1",[actor]);await db.exec("update agreement_recipient_challenges set access_until=now()-interval '1 second' where verified_at is not null");assert.equal(await read(actor,session),0);
const result={passed:true,scope:'Actual SQL migrations in isolated PGlite; not email delivery or hosted proof',checks:['Auto-confirm alone denies read','Wrong actor and browser RPC denied','Correct code required, wrong session denied','One-time code, expiry and five-attempt limit','Three-per-hour durable rate limit','Version change revokes access','Session-specific acceptance and single receipt on replay','Legacy acceptance stays fail-closed','Signed terms immutable','Email change and access expiry revoke read']};fs.writeFileSync('artifacts/recipient-ownership-sql.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await db.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
