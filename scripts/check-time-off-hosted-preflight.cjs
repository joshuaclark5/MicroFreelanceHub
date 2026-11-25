// Read-only hosted schema/config baseline. Output details stay in private evidence.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root='C:/Users/joshu/mfh-private-backups/time-off-preflight-'+Date.now();fs.mkdirSync(root,{recursive:true});
const cli='C:/Users/joshu/AppData/Local/npm-cache/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-windows-x64/bin/supabase.exe';
const query=`select jsonb_build_object(
 'databaseOwner',(select pg_get_userbyid(datdba) from pg_database where datname=current_database()),
 'functions',(select jsonb_object_agg(signature,jsonb_build_object('hash',md5(pg_get_functiondef(signature::regprocedure)),'owner',(select pg_get_userbyid(proowner) from pg_proc where oid=signature::regprocedure))) from unnest(array['public.public_booking_service(text,jsonb)','public.public_booking_window(text,date,timestamptz)','public.workspace_scheduling_mutate(jsonb)']) signature),
 'newObjects',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (proname like 'workspace_time_off_%' or proname like 'prototype_time_off%')),
 'timeOffTable',to_regclass('public.workspace_scheduling_time_off'),
 'latestMigrations',(select jsonb_agg(version order by version) from (select version from supabase_migrations.schema_migrations order by version desc limit 8)m),
 'roleSettings',(select coalesce(jsonb_agg(jsonb_build_object('role',coalesce(r.rolname,'all'),'database',coalesce(d.datname,'all'),'setting',v)),'[]'::jsonb) from pg_db_role_setting s left join pg_roles r on r.oid=s.setrole left join pg_database d on d.oid=s.setdatabase cross join lateral unnest(s.setconfig)v where split_part(v,'=',1) in ('pgrst.db_tx_end','pgrst.db_tx_allow_override','statement_timeout','pgrst.db_pre_request')),
 'readProbeTable',(select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname in ('professions','templates') and has_table_privilege('anon',c.oid,'SELECT') order by relname limit 1)
) proof;`;
fs.writeFileSync(root+'/preflight.sql',query);
const expected={'public.public_booking_service(text,jsonb)':'084c690454746777d72de90adced7c03','public.public_booking_window(text,date,timestamptz)':'0e4c72411872fbcba67cc8b8d83ea865','public.workspace_scheduling_mutate(jsonb)':'0bc533ea3a8b5ebaf170859d9ef53cfe'};
const results=[];
for(const [name,ref] of [['staging','lfzaivnvoyvdmvvijnoq'],['production','rjgttmwrbyjqifodjnqm']]){
 const r=cp.spawnSync(cli,['db','query','--remote='+ref,'--read-only','--file',root+'/preflight.sql','--output','json'],{encoding:'utf8',timeout:55000,windowsHide:true});fs.writeFileSync(root+'/'+name+'-raw.json',r.stdout||'');fs.writeFileSync(root+'/'+name+'-log.txt',r.stderr||'');assert.equal(r.status,0,name+' read-only query failed; inspect private log');
 const data=JSON.parse(r.stdout).rows[0].proof;fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(data,null,2));
 for(const [signature,hash]of Object.entries(expected)){assert.equal(data.functions[signature].hash,hash,name+' baseline changed');assert.equal(data.functions[signature].owner,'postgres');}
 assert.equal(data.newObjects,0);assert.equal(data.timeOffTable,null);
 results.push({name,ref,baselineMatches:true,databaseOwner:data.databaseOwner,roleSettings:data.roleSettings,readProbeTable:data.readProbeTable});
}
fs.mkdirSync('artifacts/time-off-hosted-preflight',{recursive:true});fs.writeFileSync('artifacts/time-off-hosted-preflight/result.json',JSON.stringify({at:new Date().toISOString(),privateRoot:root,readOnly:true,results},null,2));console.log(JSON.stringify({readOnly:true,baselineMatches:true,privateRoot:root,projects:results.map(r=>({name:r.name,databaseOwner:r.databaseOwner,readProbeTable:r.readProbeTable,roleSettings:r.roleSettings}))}));
