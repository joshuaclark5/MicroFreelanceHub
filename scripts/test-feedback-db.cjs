const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const {PGlite}=require('C:/Users/joshu/mfh-payment-sql-proof/node_modules/@electric-sql/pglite');
(async()=>{const db=new PGlite();try{
 await db.exec('create role anon nologin nosuperuser;create role authenticated nologin nosuperuser;create role service_role nologin nosuperuser bypassrls;grant usage on schema public to anon,authenticated,service_role;');
 await db.exec(fs.readFileSync('supabase/migrations/20261125060000_feedback_email.sql','utf8'));
 const call=async(id=crypto.randomUUID(),hash='hash',rate='ip')=>(await db.query('select public.claim_feedback_report($1,$2,$3,$4,$5) result',[id,hash,rate,'Fictional report',''])).rows[0].result.action;
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(()=>db.query('select * from feedback_reports'),e=>e.code==='42501');await assert.rejects(()=>call(),e=>e.code==='42501');await db.exec('reset role');}
 await db.exec('set role service_role');const id=crypto.randomUUID();assert.equal(await call(id),'send');assert.equal(await call(id),'sending');assert.equal(await call(id,'changed'),'conflict');await db.query("update feedback_reports set status='accepted' where id=$1",[id]);assert.equal(await call(id),'accepted');
 for(let n=0;n<4;n++)assert.equal(await call(),'send');assert.equal(await call(),'limited');assert.equal((await db.query('select count(*)::int n from feedback_reports')).rows[0].n,5);
 for(let n=5;n<100;n++)assert.equal(await call(crypto.randomUUID(),'hash','ip-'+n),'send');assert.equal(await call(crypto.randomUUID(),'hash','new-ip'),'limited');
 assert.equal(await call(id),'accepted');console.log('PASS actual migration: service-only receipt access, duplicate claim, payload conflict, accepted recovery, per-source and global hourly limits; isolated PGlite, no production writes');
 }finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
