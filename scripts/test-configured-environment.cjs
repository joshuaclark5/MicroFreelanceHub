const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mfh-env-fixture-'));
const file=path.join(dir,'fixture.env');
const fixture='NEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=fictional-anon\nSUPABASE_SERVICE_ROLE_KEY=fictional-service\nSTRIPE_SECRET_KEY=sk_live_FICTIONAL_NOT_A_KEY\n';
function run(content,extra={}){fs.writeFileSync(file,content);return spawnSync(process.execPath,['scripts/run-configured.cjs','check'],{encoding:'utf8',env:{...process.env,MFH_ENV_FILE:file,MFH_EXPECT_STRIPE_MODE:'',...extra}});}
try {
 let r=run(fixture);assert.equal(r.status,0);assert.match(r.stdout,/Stripe mode: live/);
 assert.ok(!(r.stdout+r.stderr).includes('fictional-service'));assert.ok(!(r.stdout+r.stderr).includes('sk_live_FICTIONAL'));
 r=run(fixture,{MFH_EXPECT_STRIPE_MODE:'test'});assert.equal(r.status,1);assert.match(r.stderr,/Refusing/);
 r=run(fixture.replace('sk_live_','sk_test_'),{MFH_EXPECT_STRIPE_MODE:'test'});assert.equal(r.status,0);
 r=run(fixture.replace('STRIPE_SECRET_KEY=sk_live_FICTIONAL_NOT_A_KEY','STRIPE_SECRET_KEY='));assert.equal(r.status,1);assert.match(r.stderr,/STRIPE_SECRET_KEY/);
 r=run(fixture,{MFH_ENV_FILE:'relative.env'});assert.equal(r.status,1);
 console.log('PASS configured environment: isolated fixtures, required fields, mode mismatch rejection, no credential values printed');
} finally {fs.rmSync(file,{force:true});fs.rmdirSync(dir);}
