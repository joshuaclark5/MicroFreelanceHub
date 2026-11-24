const fs=require('fs'),ts=require('typescript'),vm=require('vm'),assert=require('assert/strict');
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
const {brandedEmail}=load('app/lib/emailDesign.ts'),{welcomeEmail}=load('supabase/functions/_shared/welcome.ts');
const html=brandedEmail('Review <img src=x>','Hello <script>alert(1)</script>\nAmount: $12 & tax');
assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('Amount: $12 &amp; tax'));
assert.ok(brandedEmail('Review', 'https://example.test/review?a=1&b=2').includes('href="https://example.test/review?a=1&amp;b=2"'));
const welcome=welcomeEmail('Alex <img src=x>');assert.ok(!welcome.html.includes('<img'));assert.ok(welcome.html.includes('Alex &lt;img'));assert.ok(welcome.text.includes('/workspace/setup'));
assert.ok(!/App Store|Google Play|1099|first 3|Street/.test(welcome.html));
const out=process.env.QA_OUT||'artifacts/email-design';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/welcome.html',welcomeEmail('Alex').html);fs.writeFileSync(out+'/workspace-message.html',brandedEmail('Your project update','Hi Alex,\n\nYour project review is scheduled for Thursday. Please review the project notes before our meeting.\n\nThank you,\nNorthstar Studio'));
console.log('PASS escaped content, plain-text alternative, real setup links and unsupported-claim checks; previews generated, no email sent.');
