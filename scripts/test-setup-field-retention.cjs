const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/workspace/setup/page.tsx','utf8');
const match=source.match(/value=\{details.businessType\} disabled=\{busy\} onChange=\{(e=>.*?)\}><option/s);
assert(match,'Business type change handler exists');
const original={businessType:'Other',businessTypeOther:'Custom trade',country:'CA',currency:'CAD',addressLine1:'1 Test St',addressLine2:'Suite 2',addressCity:'Ottawa',addressRegion:'ON',addressPostalCode:'K1A 0B1',addressCountry:'CA',website:'https://example.test'};
let queued,state={...original};const handler=vm.runInNewContext('('+match[1]+')',{setDetails:fn=>{queued=fn}});
for(const next of ['Other','Cleaning','Prefer not to say','']){
 const event={target:{value:next}};handler(event);event.target.value='later DOM value';state=queued(state);
 assert.equal(state.businessType,next);for(const key of Object.keys(original).filter(k=>!k.startsWith('businessType')))assert.equal(state[key],original[key],key+' retained');
 assert.equal(state.businessTypeOther,next==='Other'?'Custom trade':'');
}
console.log('PASS actual setup handler: changing business type retains country, currency, full address and website; queued updates capture selected value; Other description clears only when appropriate.');
