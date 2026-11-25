const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const old='support@microfreelancehub.com',monitored='admin@microfreelancehub.com';
// Outbound domain sending identities are not inbound support mailboxes.
const senderOnly=new Map([
 ['app/api/feedback/route.ts',/from:'support@microfreelancehub\.com'/],
 ['app/api/partners/apply/route.ts',/const FROM_EMAIL = 'MicroFreelanceHub <support@microfreelancehub\.com>'/],
 ['app/api/challenge/signup/route.ts',/from:'MicroFreelanceHub <support@microfreelancehub\.com>'/],
 ['app/edit/[id]/page.tsx',/From:<\/span> MicroFreelanceHub &lt;support@microfreelancehub\.com&gt;/],
]);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk('app').filter(f=>/\.[jt]sx?$/.test(f))){
 const name=file.replaceAll('\\','/'),text=fs.readFileSync(file,'utf8');
 for(const line of text.split(/\r?\n/).filter(l=>l.includes(old)))assert.ok(senderOnly.get(name)?.test(line),'Unmonitored inbound contact: '+name);
 assert.ok(!text.includes('mailto:'+old),'Unmonitored mailto contact: '+name);
}
for(const file of ['app/components/WorkspaceNav.tsx','app/actions/delete-account.ts','app/security/page.tsx','app/settings/page.tsx','app/templates/[slug]/page.tsx','app/HomePage.tsx','app/terms-of-service/page.tsx'])assert.ok(fs.readFileSync(file,'utf8').includes(monitored),'Missing monitored destination: '+file);
console.log('PASS app-tree inbound support contacts use monitored admin mailbox; outbound sender identities preserved');
