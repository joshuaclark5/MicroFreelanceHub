const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {PGlite}=require(process.env.PGLITE_MODULE||'C:/Users/joshu/mfh-payment-sql-proof/node_modules/@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.INVOICE_EVIDENCE||path.join(root,'../evidence-invoices'));fs.mkdirSync(out,{recursive:true});
const dir=fs.mkdtempSync(path.join(out,'pglite-'));let db;const A=randomUUID(),B=randomUUID(),ca=randomUUID(),cb=randomUUID(),ca2=randomUUID(),pa=randomUUID(),pb=randomUUID(),sa=randomUUID(),sb=randomUUID();let count=0;const checks=[];
const q=(s,p=[])=>db.query(s,p);async function test(n,f){await f();checks.push(n);count++;console.log('PASS '+n);}
async function actor(a,role='authenticated'){await db.exec('reset role');await q("select set_config('request.jwt.claim.sub',$1,false)",[a||'']);await db.exec('set role '+role);}
const doc={clientId:ca,projectId:pa,seller:'Fictional seller',currency:'USD',issueDate:'2026-01-31',dueDate:'2026-02-10',memo:'Fixture',lines:[{description:'Design',quantity:3,unitMinor:105}]};
const payload=(a,x)=>({operationId:randomUUID(),expectedActorId:a,...x});const rpc=p=>q('select public.workspace_invoice_mutate($1::jsonb) as result',[JSON.stringify(p)]).then(r=>r.rows[0].result);const call=x=>rpc(payload(A,x));
const conflictMigration=fs.readFileSync(path.join(root,'supabase/migrations/20261125230000_invoice_terminal_conflicts.sql'),'utf8');
const permanent=e=>e.code==='P0001';
async function databaseFingerprint(){
 await db.exec('reset role');
 const tables=(await q("select schemaname,tablename from pg_tables where schemaname in ('public','auth') order by schemaname,tablename")).rows;
 const rows=[];
 for(const t of tables){
  const name='"'+t.schemaname.replace(/"/g,'""')+'"."'+t.tablename.replace(/"/g,'""')+'"';
  rows.push({table:name,...(await q("select count(*)::int as count,md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' order by to_jsonb(t)::text),'')) as hash from "+name+' t')).rows[0]});
 }
 const tablesAndPolicies=(await q("select c.oid,c.relname,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity,(select jsonb_agg(to_jsonb(p) order by p.polname) from pg_policy p where p.polrelid=c.oid) as policies from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname")).rows;
 const otherFunctions=(await q("select p.oid,pg_get_functiondef(p.oid) as definition,p.proowner,p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and p.oid<>'public.workspace_invoice_mutate(jsonb)'::regprocedure order by p.oid")).rows;
 return {rows,tablesAndPolicies,otherFunctions};
}
async function functionMetadata(){return (await q("select oid,proowner,proacl,prosecdef,proconfig,provolatile,proisstrict,proparallel,proargtypes::text,prorettype from pg_proc where oid='public.workspace_invoice_mutate(jsonb)'::regprocedure")).rows[0];}
async function functionDefinition(){return (await q("select pg_get_functiondef('public.workspace_invoice_mutate(jsonb)'::regprocedure) as definition")).rows[0].definition;}
(async()=>{db=new PGlite(dir);await db.exec("create role anon nologin nosuperuser nobypassrls;create role authenticated nologin nosuperuser nobypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table public.sow_documents(id uuid primary key,user_id uuid references auth.users(id));create table public.invoices(id uuid primary key,marker text);insert into public.invoices values(gen_random_uuid(),'legacy unchanged');");
await q('insert into auth.users values($1),($2)',[A,B]);await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261118000000_connected_workspace.sql'),'utf8'));await q('insert into workspace_clients(id,owner_id,name) values($1,$2,$3),($4,$5,$6),($7,$2,$8)',[ca,A,'Client A',cb,B,'Client B',ca2,'Client A2']);await q('insert into workspace_stages(id,owner_id,name) values($1,$2,$3),($4,$5,$6)',[sa,A,'Stage A',sb,B,'Stage B']);await q('insert into workspace_projects(id,owner_id,client_id,stage_id,name) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)',[pa,A,ca,sa,'Project A',pb,B,cb,sb,'Project B']);
await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261118030000_workspace_invoices.sql'),'utf8'));await actor(A);
await test('guarded conflict migration, exact rollback, unchanged records/grants and baseline drift rejection',async()=>{
 const seedOperation=payload(A,{action:'create',document:doc});
 const seed=await rpc(seedOperation);
 const before=await functionDefinition(),metadata=await functionMetadata(),fingerprint=await databaseFingerprint();
 assert.equal((before.match(/errcode='40001'/g)||[]).length,6);
 fs.writeFileSync(path.join(out,'invoice-conflict-before.sql'),before);
 // Refuse an unreviewed function body without overwriting it or any data.
 const drift=before.replace("raise exception 'Invalid action'","raise exception 'Unreviewed action'");
 assert.notEqual(drift,before);await db.exec(drift);
 await assert.rejects(()=>db.exec(conflictMigration),e=>e.message.includes('reviewed baseline'));
 await db.exec('rollback');assert.equal(await functionDefinition(),drift);assert.deepEqual(await databaseFingerprint(),fingerprint);
 await db.exec(before);
 // Refuse changed security configuration before replacing the function.
 await db.exec('alter function public.workspace_invoice_mutate(jsonb) security invoker');
 const invoker=await functionDefinition();
 await assert.rejects(()=>db.exec(conflictMigration),e=>e.message.includes('security configuration'));
 await db.exec('rollback');assert.equal(await functionDefinition(),invoker);
 await db.exec(before);
 await test('staging-like indentation and CRLF normalize without changing data or attributes',async()=>{
  const originalSource=(await q("select prosrc from pg_proc where oid='public.workspace_invoice_mutate(jsonb)'::regprocedure")).rows[0].prosrc;
  const formattedSource=originalSource.replace(/\r\n/g,'\n').split('\n').map(line=>line?'    '+line+' \t':line).join('\r\n');
  assert.notEqual(formattedSource,originalSource);
  await db.exec(before.replace(originalSource,()=>formattedSource));
  const formattedBefore=await functionDefinition();
  assert.ok(formattedBefore.includes(formattedSource));
  await db.exec(conflictMigration);
  assert.equal(await functionDefinition(),formattedBefore.replaceAll("errcode='40001'","errcode='P0001'"));
  assert.deepEqual(await functionMetadata(),metadata);assert.deepEqual(await databaseFingerprint(),fingerprint);
  await db.exec(before);assert.equal(await functionDefinition(),before);
 });
 await db.exec(conflictMigration);
 const after=before.replaceAll("errcode='40001'","errcode='P0001'");
 assert.equal(await functionDefinition(),after);assert.deepEqual(await functionMetadata(),metadata);assert.deepEqual(await databaseFingerprint(),fingerprint);
 await test('repeated conflict migration refuses without changing definition or fingerprints',async()=>{
  await assert.rejects(()=>db.exec(conflictMigration),e=>e.message.includes('reviewed baseline'));
  await db.exec('rollback');
  assert.equal(await functionDefinition(),after);assert.deepEqual(await functionMetadata(),metadata);assert.deepEqual(await databaseFingerprint(),fingerprint);
 });
 await actor(A);assert.equal((await rpc(seedOperation)).id,seed.id);
 await assert.rejects(()=>rpc({...seedOperation,document:{...doc,memo:'changed'}}),permanent);
 // Restore the actual captured definition, never an indiscriminate reverse replacement.
 await db.exec('reset role;begin');await db.exec(before);assert.equal(await functionDefinition(),before);
 await actor(A);await assert.rejects(()=>rpc({...seedOperation,document:{...doc,memo:'changed'}}),e=>e.code==='40001');
 await db.exec('rollback');assert.equal(await functionDefinition(),after);
 await db.exec('reset role');await db.exec(before);assert.deepEqual(await databaseFingerprint(),fingerprint);assert.deepEqual(await functionMetadata(),metadata);
 await db.exec(conflictMigration);assert.equal(await functionDefinition(),after);assert.deepEqual(await databaseFingerprint(),fingerprint);
 fs.writeFileSync(path.join(out,'invoice-conflict-migration-proof.json'),JSON.stringify({forwardRollbackForward:true,unchangedMetadata:true,unchangedDataAndPolicies:true,bodyDriftRefused:true,securityDriftRefused:true,repeatedApplicationRefused:true,indentationAndCrlfAccepted:true,changedCodeCount:6,tableFingerprints:fingerprint.rows},null,2));
 await actor(A);await call({action:'delete',id:seed.id,version:seed.version});
});
let inv,issued,schedule;
await test('actual migration upgrade preserves legacy invoices',async()=>{await db.exec('reset role');assert.equal((await q('select marker from invoices')).rows[0].marker,'legacy unchanged');await actor(A);});
await test('create, exact totals, durable operation retry and permanent changed-body conflict',async()=>{const p=payload(A,{action:'create',document:doc});inv=await rpc(p);assert.equal(inv.total_minor,315);assert.equal((await rpc(p)).id,inv.id);await assert.rejects(()=>rpc({...p,document:{...doc,memo:'different'}}),permanent);assert.equal((await q('select count(*)::int as n from workspace_invoice_drafts')).rows[0].n,1);});
await test('crossowner client, project and same-owner inconsistent project rejected',async()=>{for(const d of [{...doc,clientId:cb,projectId:null},{...doc,projectId:pb},{...doc,clientId:ca2}])await assert.rejects(()=>call({action:'create',document:d}));});
await test('SQL rejects unknown/null/decimal/overflow/date inputs',async()=>{for(const d of [{...doc,owner_id:B},{...doc,seller:null},{...doc,currency:null},{...doc,lines:[{description:null,quantity:1,unitMinor:2}]},{...doc,lines:[{description:'x',quantity:1.5,unitMinor:2}]},{...doc,lines:[{description:'x',quantity:10000,unitMinor:100000000}]},{...doc,dueDate:'2026-02-30'}])await assert.rejects(()=>call({action:'create',document:d}));await assert.rejects(()=>rpc({...payload(A,{action:'create',document:doc}),owner_id:B}));});
await test('edit CAS race yields one winner and permanent stale-version conflict',async()=>{const r=await Promise.allSettled([call({action:'edit',id:inv.id,version:1,document:{...doc,memo:'one'}}),call({action:'edit',id:inv.id,version:1,document:{...doc,memo:'two'}})]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.ok(permanent(r.find(x=>x.status==='rejected').reason));inv=r.find(x=>x.status==='fulfilled').value;});
await test('explicit review total and version gate issue; permanent conflicts and issue race one winner',async()=>{await assert.rejects(()=>call({action:'issue',id:inv.id,version:inv.version,reviewedTotalMinor:314}),permanent);const r=await Promise.allSettled([call({action:'issue',id:inv.id,version:inv.version,reviewedTotalMinor:315}),call({action:'issue',id:inv.id,version:inv.version,reviewedTotalMinor:315})]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.ok(permanent(r.find(x=>x.status==='rejected').reason));issued=r.find(x=>x.status==='fulfilled').value;assert.equal(issued.number,1);assert.equal(issued.snapshot.clientSnapshot.name,'Client A');});
await test('all protected tables reject direct authenticated DML and have forced RLS',async()=>{const tables=['drafts','schedules','occurrences','audit','counters','operations','allowances','allowance_entries'];for(const t of tables){for(const sql of ['delete from workspace_invoice_'+t,'update workspace_invoice_'+t+' set owner_id=owner_id','insert into workspace_invoice_'+t+'(owner_id) values(gen_random_uuid())'])await assert.rejects(()=>q(sql),e=>e.code==='42501');const r=(await q('select relrowsecurity,relforcerowsecurity from pg_class where oid=$1::regclass',['workspace_invoice_'+t])).rows[0];assert.ok(r.relrowsecurity&&r.relforcerowsecurity);}});
await test('issued edit/delete/reset denied and void preserves immutable snapshot plus audit',async()=>{await assert.rejects(()=>call({action:'edit',id:issued.id,version:issued.version,document:doc}),permanent);await assert.rejects(()=>call({action:'delete',id:issued.id,version:issued.version}),permanent);await db.exec('reset role');await assert.rejects(()=>q('update workspace_invoice_drafts set snapshot=$1 where id=$2',['{}',issued.id]));await actor(A);const v=await call({action:'void',id:issued.id,version:issued.version,reason:'Corrected outside this record'});assert.deepEqual(v.snapshot,issued.snapshot);assert.equal((await q('select * from workspace_invoice_audit')).rows.length,2);});
await test('referenced project client cannot drift',async()=>{await assert.rejects(()=>q('update workspace_projects set client_id=$1 where id=$2',[ca2,pa]));});
await test('monthly month-end and duplicate generation races',async()=>{schedule=await call({action:'schedule',document:doc,frequency:'monthly',anchor:'2026-01-31'});const r=await Promise.all([call({action:'generate',id:schedule.id,occurrence:'2026-02-28'}),call({action:'generate',id:schedule.id,occurrence:'2026-02-28'})]);assert.equal(r[0].id,r[1].id);assert.equal(r[0].document.dueDate,'2026-03-10');await assert.rejects(()=>call({action:'generate',id:schedule.id,occurrence:'2026-03-28'}));const march=await call({action:'generate',id:schedule.id,occurrence:'2026-03-31'});assert.equal(march.document.issueDate,'2026-03-31');const leap=await call({action:'generate',id:schedule.id,occurrence:'2028-02-29'});assert.equal(leap.status,'draft');});
await test('weekly policy, permanent stale schedule version, pause/resume CAS and no automatic issue',async()=>{let s=await call({action:'schedule',document:doc,frequency:'weekly',anchor:'2026-01-31'});await assert.rejects(()=>call({action:'generate',id:s.id,occurrence:'2026-02-06'}));s=await call({action:'pause',id:s.id,version:1});await assert.rejects(()=>call({action:'resume',id:s.id,version:1}),permanent);await assert.rejects(()=>call({action:'generate',id:s.id,occurrence:'2026-02-07'}));s=await call({action:'resume',id:s.id,version:2});assert.equal((await call({action:'generate',id:s.id,occurrence:'2026-02-07'})).number,null);});
await test('manual allowance concurrent debit cannot overdraw; failed entry rolls back',async()=>{await call({action:'allowance',currency:'USD',amountMinor:100,reason:'Manual opening allowance, not cash'});const r=await Promise.allSettled([call({action:'allowance',currency:'USD',amountMinor:-80,reason:'Work A'}),call({action:'allowance',currency:'USD',amountMinor:-80,reason:'Work B'})]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(Number((await q('select balance_minor from workspace_invoice_allowances')).rows[0].balance_minor),20);assert.equal((await q('select * from workspace_invoice_allowance_entries')).rows.length,2);});
await test('crossowner reads, guessed writes, permanent actor conflict and anonymous execute fail closed',async()=>{await actor(B);for(const t of ['drafts','schedules','audit','allowance_entries','operations'])assert.equal((await q('select * from workspace_invoice_'+t)).rows.length,0);await assert.rejects(()=>rpc(payload(B,{action:'void',id:issued.id,version:2,reason:'foreign'})));await assert.rejects(()=>call({action:'create',document:doc}),permanent);await actor(null,'anon');await assert.rejects(()=>call({action:'create',document:doc}),e=>e.code==='42501');await actor(A);});
await test('draft delete and unique sequential issue numbering',async()=>{const d=await call({action:'create',document:doc});await call({action:'delete',id:d.id,version:1});assert.equal((await q('select * from workspace_invoice_drafts where id=$1',[d.id])).rows.length,0);const x=await call({action:'create',document:doc});const y=await call({action:'create',document:doc});const r=await Promise.all([call({action:'issue',id:x.id,version:1,reviewedTotalMinor:315}),call({action:'issue',id:y.id,version:1,reviewedTotalMinor:315})]);assert.deepEqual(r.map(i=>i.number).sort(),[2,3]);});
await test('file-backed close/reopen retains issued snapshot, recurrence uniqueness and allowance',async()=>{await db.close();db=new PGlite(dir);await actor(A);assert.equal((await q('select snapshot from workspace_invoice_drafts where id=$1',[issued.id])).rows[0].snapshot.number,1);assert.equal(Number((await q('select balance_minor from workspace_invoice_allowances')).rows[0].balance_minor),20);const old=await call({action:'generate',id:schedule.id,occurrence:'2026-02-28'});assert.equal(old.document.issueDate,'2026-02-28');});
await db.close();fs.writeFileSync(path.join(out,'db-proof.json'),JSON.stringify({passed:count,checks,dir,limitations:['PGlite serializes concurrent submitted statements; PostgreSQL multi-connection contention remains staging gate.','Fictional minimal legacy baseline; no live schema compatibility claim.']},null,2));console.log(count+' SQL groups passed');})().catch(async e=>{console.error(e);try{await db.close();}catch{}process.exitCode=1;});
