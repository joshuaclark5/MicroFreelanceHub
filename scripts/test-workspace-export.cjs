const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Intl,URLSearchParams});return exports;}
const {workspaceCsv}=load('app/lib/workspaceExport.ts');
const clients=[{id:'client',name:'=HYPERLINK("bad")',email:'person@example.test',phone:'+18015550000',notes:'First line\n"quoted", second line',owner_id:'must-not-leak',secret:'must-not-leak'}];
const data={clients,stages:[{id:'stage',name:'In progress'}],projects:[{id:'project',name:'Website',client_id:'client',stage_id:'stage',status:'active'}],tasks:[],agreements:[],'available-agreements':[]};
const csv=workspaceCsv('clients',clients,data);assert.ok(csv.startsWith('\uFEFF"id","name","email","phone","notes"\r\n'));assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.includes('"\'+18015550000"'));assert.ok(csv.includes('First line\n""quoted"", second line'));assert.ok(!csv.includes('must-not-leak'));
const projects=workspaceCsv('projects',data.projects,data);assert.ok(projects.includes('"client_id","client_name","stage_id","stage_name"'));assert.ok(projects.includes('In progress'));assert.ok(projects.includes('Website'));
const task=workspaceCsv('tasks',[{id:'task',title:'\t=2+2',project_id:'missing',due_date:null,status:'open'}],data);assert.ok(task.includes("'\t=2+2"));assert.ok(task.includes('Record unavailable'));assert.ok(!task.includes('undefined'));
assert.equal(workspaceCsv('clients',[],data).split('\r\n').length,2);
console.log('PASS workspace CSV: explicit columns, escaped formulas/quotes/newlines, related names, missing relations, empty export, no owner/secrets');

// Guard the rendered workspace labels against accidental UTF-8/Windows-1252 conversion.
const labelsSource=fs.readFileSync("app/workspace/Workspace.tsx","utf8");
assert.ok(labelsSource.includes("Open agreements \u2192"));
assert.ok(labelsSource.includes("Loading your saved workspace\u2026"));
assert.ok(!/[\u00c2\u00c3\ufffd]/.test(labelsSource));
