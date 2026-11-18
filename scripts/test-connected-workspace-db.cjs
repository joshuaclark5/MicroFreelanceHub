#!/usr/bin/env node
'use strict';
// Offline: actual migration, existing PGlite, disposable file-backed DB. No secrets/network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {createHash,randomUUID} = require('node:crypto');
const root = path.resolve(__dirname,'..');
const out = path.resolve(process.env.WORKSPACE_PROOF_DIR || path.join(root,'..'));
const migrationPath = path.join(root,'supabase/migrations/20261118000000_connected_workspace.sql');
const migration = fs.readFileSync(migrationPath,'utf8');
const tables = ['clients','stages','projects','tasks','agreements'];
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const report = {startedAt:new Date().toISOString(),migration:path.relative(root,migrationPath),migrationSha256:createHash('sha256').update(migration).digest('hex'),engine:'PGlite / embedded PostgreSQL',offline:true,fictionalFixturesOnly:true,checks:[],limitations:[
  'Original sow_documents CREATE TABLE and deployed grants are absent from repository: minimal fictional baseline, not production compatibility proof.',
  'No team/member schema is fabricated. API owner/member/team payload rejection is covered separately by the parent.',
  'SQL non-superuser role tests do not prove Supabase JWT verification or HTTP endpoints.'
]};
let db;
const q = (sql,values=[]) => db.query(sql,values);
const table = name => 'public.workspace_'+name;
async function check(name,fn) {
  try { const detail=await fn(); report.checks.push({name,passed:true,...(detail?{detail}:{})}); console.log('PASS '+name); }
  catch(error) {report.checks.push({name,passed:false,error:error.message,code:error.code});console.error('FAIL '+name+': '+error.message);}
}
async function as(role,uid,fn) {
  await db.exec('reset role');
  await q("select set_config('request.jwt.claim.sub',$1,false)",[uid||'']);
  await db.exec('set role '+role);
  try{return await fn();}finally{await db.exec('reset role');}
}
async function isolated(fn) {await db.exec('begin');try{return await fn();}finally{await db.exec('rollback');}}
async function denied(fn,code) {
  // A savepoint keeps expected errors from masking their SQLSTATE with aborted-transaction errors.
  await db.exec('savepoint expected_failure');
  let error;
  try{await fn();}catch(e){error=e;}
  await db.exec('rollback to savepoint expected_failure; release savepoint expected_failure');
  assert.ok(error,'Expected rejection but operation succeeded');
  assert.equal(error.code,code,'Wrong rejection: '+error.message);
  return {sqlstate:error.code,message:error.message};
}
async function insert(name,values) {
  const keys=Object.keys(values);
  return (await q('insert into '+table(name)+' ('+keys.join(',')+') values ('+keys.map((_,i)=>'$'+(i+1)).join(',')+') returning *',Object.values(values))).rows[0];
}
const sows={a:randomUUID(),b:randomUUID(),spare:randomUUID()};
const rows={a:{},b:{}};
function payload(name,owner=A,set=rows.a) {
  switch(name) {
    case 'clients':return {owner_id:owner,name:'Fictional client '+randomUUID(),email:'fixture@example.test'};
    case 'stages':return {owner_id:owner,name:'Fictional stage '+randomUUID(),position:0};
    case 'projects':return {owner_id:owner,client_id:set.clients.id,stage_id:set.stages.id,name:'Fictional project'};
    case 'tasks':return {owner_id:owner,project_id:set.projects.id,title:'Fictional task',due_date:'2026-12-01'};
    case 'agreements':return {owner_id:owner,project_id:set.projects.id,agreement_id:owner===A?sows.spare:sows.b};
  }
}
async function snapshot() {
  const result={};
  for(const name of tables)result[name]=(await q('select * from '+table(name)+' order by id')).rows;
  result.sow_documents=(await q('select * from public.sow_documents order by id')).rows;
  return result;
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const modulePath=process.env.PGLITE_MODULE||'C:/Users/joshu/mfh-payment-sql-proof/node_modules/@electric-sql/pglite';
  const {PGlite}=require(modulePath);
  report.pgliteModule=modulePath;
  report.databaseDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'mfh-workspace-proof-'));
  // Retain disposable directory as evidence; never delete arbitrary filesystem paths.
  db=new PGlite(report.databaseDirectory);
  await db.exec(
    'create role anon nologin nosuperuser nobypassrls; create role authenticated nologin nosuperuser nobypassrls;'+
    'create schema auth; create table auth.users(id uuid primary key);'+
    "create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;"+
    'grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;'+
    'create table public.sow_documents(id uuid primary key,user_id uuid not null references auth.users(id),title text,client_name text,client_data jsonb);'
  );
  await q('insert into auth.users values ($1),($2)',[A,B]);
  for(const [key,id] of Object.entries(sows))await q('insert into public.sow_documents values ($1,$2,$3,$4,$5)',[id,key==='b'?B:A,'Fictional legacy agreement','Legacy client unchanged',JSON.stringify({email:'legacy@example.test'})]);
  const legacyBefore=(await q('select * from public.sow_documents order by id')).rows;
  await db.exec(migration); // Actual file, unchanged; never replace with copied migration DDL.
  await check('migration preserves legacy rows and creates exactly five workspace tables',async()=>{
    assert.deepEqual((await q('select * from public.sow_documents order by id')).rows,legacyBefore);
    assert.deepEqual((await q("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r=>r.tablename),['sow_documents',...tables.map(n=>'workspace_'+n)].sort());
  });
  await check('five forced RLS owner policies, DML grants, and unprivileged test roles',async()=>{
    for(const name of tables) {
      assert.deepEqual((await q('select relrowsecurity,relforcerowsecurity from pg_class where oid=$1::regclass',[table(name)])).rows[0],{relrowsecurity:true,relforcerowsecurity:true});
      const policies=(await q('select roles,cmd,qual,with_check from pg_policies where schemaname=$1 and tablename=$2',['public','workspace_'+name])).rows;
      assert.equal(policies.length,1);assert.equal(policies[0].cmd,'ALL');assert.match(policies[0].qual,/owner_id = auth.uid/);assert.match(policies[0].with_check,/owner_id = auth.uid/);
      for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])for(const role of ['authenticated','anon'])assert.equal((await q('select has_table_privilege($1,$2,$3) as allowed',[role,table(name),privilege])).rows[0].allowed,role==='authenticated');
    }
    const roles=(await q("select rolsuper,rolbypassrls from pg_roles where rolname in ('authenticated','anon')")).rows;
    assert.equal(roles.length,2);for(const r of roles){assert.equal(r.rolsuper,false);assert.equal(r.rolbypassrls,false);}
  });
  for(const [key,uid] of [['a',A],['b',B]])for(const name of tables)await check(key+' owner inserts '+name,async()=>{
    rows[key][name]=await as('authenticated',uid,()=>insert(name,{...payload(name,uid,rows[key]),...(name==='agreements'?{agreement_id:sows[key]}:{})}));
    assert.equal(rows[key][name].owner_id,uid);
  });
  for(const name of tables) {
    await check('owner reads only own '+name,()=>as('authenticated',A,async()=>{
      const found=(await q('select * from '+table(name))).rows;assert.equal(found.length,1);assert.equal(found[0].id,rows.a[name].id);
    }));
    await check('owner updates '+name+' with server timestamp',()=>as('authenticated',A,async()=>{
      const field=name==='agreements'?'project_id':name==='tasks'?'title':'name';
      const value=name==='agreements'?rows.a.projects.id:'Owner updated '+name;
      const updated=(await q('update '+table(name)+' set '+field+"=$1,updated_at='2000-01-01' where id=$2 returning *",[value,rows.a[name].id])).rows;
      assert.equal(updated.length,1);assert.equal(updated[0][field],value);assert.ok(new Date(updated[0].updated_at)>=new Date(rows.a[name].updated_at));assert.ok(new Date(updated[0].updated_at).getFullYear()>2000);
    }));
    for(const op of ['select','update','delete'])await check('foreign '+op+' sees zero '+name,()=>as('authenticated',B,async()=>{
      const sql=op==='select'?'select * from '+table(name)+' where id=$1':op==='delete'?'delete from '+table(name)+' where id=$1 returning id':'update '+table(name)+' set updated_at=now() where id=$1 returning id';
      assert.equal((await q(sql,[rows.a[name].id])).rows.length,0);
    }));
    await check('spoofed owner insert denied on '+name,()=>isolated(()=>as('authenticated',B,()=>denied(()=>insert(name,payload(name)),'42501'))));
    for(const [field,value] of [['owner_id',B],['id',randomUUID()],['created_at','2000-01-01']])await check('immutable '+field+' on '+name,()=>isolated(()=>as('authenticated',A,()=>denied(()=>q('update '+table(name)+' set '+field+'=$1 where id=$2',[value,rows.a[name].id]),'P0001'))));
    for(const op of ['select','insert','update','delete'])await check('anonymous '+op+' denied on '+name,()=>isolated(()=>as('anon',null,()=>denied(()=>op==='insert'?insert(name,payload(name)):q(op==='select'?'select * from '+table(name):op==='update'?'update '+table(name)+' set updated_at=now()':'delete from '+table(name)),'42501'))));
    await check('authenticated without UID cannot read or insert '+name,()=>isolated(()=>as('authenticated',null,async()=>{
      assert.equal((await q('select * from '+table(name))).rows.length,0);return denied(()=>insert(name,payload(name)),'42501');
    })));
    await check('owner deletes own '+name,()=>isolated(()=>as('authenticated',A,async()=>{
      const row=await insert(name,payload(name));assert.equal((await q('delete from '+table(name)+' where id=$1 returning id',[row.id])).rows.length,1);assert.equal((await q('select id from '+table(name)+' where id=$1',[row.id])).rows.length,0);
    })));
  }
  const foreignUnmapped=randomUUID();
  await q('insert into public.sow_documents(id,user_id,title) values ($1,$2,$3)',[foreignUnmapped,B,'Foreign unmapped fictional agreement']);
  // Foreign agreement is deliberately unmapped: uniqueness must not mask its composite FK.
  const links=[['projects','client_id',rows.b.clients.id],['projects','stage_id',rows.b.stages.id],['tasks','project_id',rows.b.projects.id],['agreements','project_id',rows.b.projects.id],['agreements','agreement_id',foreignUnmapped]];
  for(const [name,field,value] of links)for(const op of ['insert','update'])await check('cross-owner '+name+'.'+field+' '+op+' FK rejected',()=>isolated(()=>as('authenticated',A,()=>denied(()=>op==='insert'?insert(name,{...payload(name),[field]:value}):q('update '+table(name)+' set '+field+'=$1 where id=$2',[value,rows.a[name].id]),'23503'))));
  for(const op of ['insert','update'])await check('duplicate agreement mapping '+op+' rejected',()=>isolated(()=>as('authenticated',A,async()=>{
    if(op==='insert')return denied(()=>insert('agreements',{...payload('agreements'),agreement_id:sows.a}),'23505');
    const row=await insert('agreements',payload('agreements'));return denied(()=>q('update public.workspace_agreements set agreement_id=$1 where id=$2',[sows.a,row.id]),'23505');
  })));
  const invalid=[['clients','name',''],['clients','name','   '],['clients','name','x'.repeat(161)],['clients','email','x'.repeat(255)],['clients','notes','x'.repeat(4001)],['stages','name',''],['stages','name','   '],['stages','name','x'.repeat(81)],['stages','position',-1],['stages','position',1000],['projects','name',''],['projects','name','   '],['projects','name','x'.repeat(161)],['projects','notes','x'.repeat(4001)],['projects','status','invented'],['tasks','title',''],['tasks','title','   '],['tasks','title','x'.repeat(161)],['tasks','notes','x'.repeat(4001)],['tasks','status','invented']];
  for(const [name,field,value] of invalid)for(const op of ['insert','update'])await check('CHECK '+name+'.'+field+' '+op+' rejects '+(typeof value==='string'?'text length '+value.length:value),()=>isolated(()=>as('authenticated',A,()=>denied(()=>op==='insert'?insert(name,{...payload(name),[field]:value}):q('update '+table(name)+' set '+field+'=$1 where id=$2',[value,rows.a[name].id]),'23514'))));
  for(const name of tables)await check('null owner rejected for '+name,()=>isolated(()=>denied(()=>insert(name,{...payload(name),owner_id:null}),'23502')));
  const required={clients:['name'],stages:['name','position'],projects:['client_id','stage_id','name','status'],tasks:['project_id','title','status'],agreements:['project_id','agreement_id']};
  for(const name of tables)for(const field of required[name])await check('null '+name+'.'+field+' rejected',()=>isolated(()=>as('authenticated',A,()=>denied(()=>insert(name,{...payload(name),[field]:null}),'23502'))));
  await check('invalid task date rejected',()=>isolated(()=>as('authenticated',A,()=>denied(()=>insert('tasks',{...payload('tasks'),due_date:'2026-02-30'}),'22008'))));
  await check('stage names unique within owner',()=>isolated(()=>as('authenticated',A,()=>denied(()=>insert('stages',{...payload('stages'),name:'Owner updated stages'}),'23505'))));
  await check('same stage name permitted for different owners',()=>isolated(()=>as('authenticated',B,async()=>{assert.equal((await insert('stages',{...payload('stages',B,rows.b),name:'Owner updated stages'})).owner_id,B);})));
  await check('maximum lengths and stage boundaries accepted',()=>isolated(()=>as('authenticated',A,async()=>{
    await insert('clients',{...payload('clients'),name:'x'.repeat(160),email:'e'.repeat(254),notes:'n'.repeat(4000)});
    await insert('stages',{...payload('stages'),name:'x'.repeat(80),position:999});
    await insert('projects',{...payload('projects'),name:'x'.repeat(160),notes:'n'.repeat(4000),status:'archived'});
    await insert('tasks',{...payload('tasks'),title:'x'.repeat(160),notes:'n'.repeat(4000),status:'done',due_date:null});
  })));
  for(const name of ['clients','stages','projects'])await check('referenced '+name+' deletion restricted',()=>isolated(()=>as('authenticated',A,()=>denied(()=>q('delete from '+table(name)+' where id=$1',[rows.a[name].id]),'23001'))));
  for(const child of ['tasks','agreements'])await check(child+' alone restricts project deletion',()=>isolated(()=>as('authenticated',A,async()=>{
    const project=await insert('projects',payload('projects'));await insert(child,{...payload(child),project_id:project.id});return denied(()=>q('delete from public.workspace_projects where id=$1',[project.id]),'23001');
  })));
  await check('legacy agreement deletion cascades mapping only',()=>isolated(async()=>{
    // Admin deletion tests FK semantics, not fabricated legacy RLS or deletion permissions.
    await q('delete from public.sow_documents where id=$1',[sows.a]);
    assert.equal((await q('select * from public.workspace_agreements where id=$1',[rows.a.agreements.id])).rows.length,0);
    assert.equal((await q('select * from public.workspace_projects where id=$1',[rows.a.projects.id])).rows.length,1);
    assert.equal((await q('select * from public.workspace_agreements where id=$1',[rows.b.agreements.id])).rows.length,1);
  }));
  await check('mapping deletion preserves legacy agreement',()=>isolated(async()=>{
    await as('authenticated',A,()=>q('delete from public.workspace_agreements where id=$1',[rows.a.agreements.id]));assert.equal((await q('select * from public.sow_documents where id=$1',[sows.a])).rows.length,1);
  }));
  await check('review-only mapping worksheet and rollback plan do not alter data',async()=>{
    const beforeReview=await snapshot();
    for(const file of ['legacy-mapping-review.sql','rollback-review.sql']) {
      try {const result=await db.exec(fs.readFileSync(path.join(root,'scripts/workspace-review',file),'utf8'));assert.ok(result.length>0);}
      finally {await db.exec('rollback');}
    }
    assert.deepEqual(await snapshot(),beforeReview);
  });
  const before=await snapshot();await db.close();db=null;db=new PGlite(report.databaseDirectory);
  await check('file-backed close/reopen preserves all rows and updated values',async()=>{assert.deepEqual(await snapshot(),before);return {closedAndReopened:true,tables:tables.length,databaseDirectory:report.databaseDirectory};});
  await check('reopened DB retains owner isolation and foreign-key enforcement',async()=>{
    await as('authenticated',B,async()=>{assert.equal((await q('select * from public.workspace_projects where id=$1',[rows.a.projects.id])).rows.length,0);});
    await isolated(()=>as('authenticated',A,()=>denied(()=>insert('tasks',{...payload('tasks'),project_id:rows.b.projects.id}),'23503')));
  });
  await check('legacy fixture values unchanged after workspace operations',async()=>{assert.deepEqual((await q('select * from public.sow_documents where id<>$1 order by id',[foreignUnmapped])).rows,legacyBefore);});
})().catch(error=>{report.checks.push({name:'fatal setup or execution',passed:false,error:error.message,code:error.code});console.error(error);}).finally(async()=>{
  if(db)try{await db.close();}catch(error){report.checks.push({name:'database close',passed:false,error:error.message});}
  report.finishedAt=new Date().toISOString();report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.filter(c=>!c.passed).length;report.success=report.failed===0;
  const newline=String.fromCharCode(10);
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'db-proof.json'),JSON.stringify(report,null,2)+newline);
  fs.writeFileSync(path.join(out,'db-proof.log'),report.checks.map(c=>(c.passed?'PASS ':'FAIL ')+c.name+(c.error?': '+c.error:'')).join(newline)+newline+report.passed+' passed; '+report.failed+' failed'+newline);
  console.log(report.passed+' passed; '+report.failed+' failed. Evidence: '+path.join(out,'db-proof.json'));if(report.failed)process.exitCode=1;
});
