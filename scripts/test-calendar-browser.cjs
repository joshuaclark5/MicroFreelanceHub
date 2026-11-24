// Isolated real-component test. Fictional bookings; no network, account changes or sends.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),ts=require('typescript');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/calendar');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'app/components/SchedulingCalendar.tsx'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const css=fs.readFileSync(path.join(root,'app/components/scheduling-calendar.css'),'utf8');
const bookings=[{id:'one',attendee:'Fictional Acorn Studio',starts_at:'2026-11-24T00:30:00Z',ends_at:'2026-11-24T01:00:00Z',timezone:'America/New_York',status:'confirmed'},{id:'two',attendee:'Fictional Canceled',starts_at:'2026-11-23T15:00:00Z',ends_at:'2026-11-23T15:30:00Z',timezone:'America/New_York',status:'canceled'}];
let browser;const checks=[];
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/New_York'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
  await page.setContent('<!doctype html><html lang="en"><head><title>Calendar fixture</title><style>body{margin:12px;font-family:Arial}*{box-sizing:border-box}button,input,select{font:inherit}a{color:inherit}'+css+'</style></head><body><main id="root"></main></body></html>');
  for(const file of ['react/umd/react.production.min.js','react-dom/umd/react-dom.production.min.js'])await page.addScriptTag({path:path.join(root,'node_modules',file)});
  await page.addScriptTag({content:'window.Calendar=(()=>{const exports={};const require=n=>n==="react"?React:n==="react/jsx-runtime"?{Fragment:React.Fragment,jsx:(t,p,k)=>React.createElement(t,{...p,key:k}),jsxs:(t,p,k)=>React.createElement(t,{...p,key:k})}:{};'+compiled+';return exports.default})();ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Calendar,{bookings:'+JSON.stringify(bookings)+'}));'});
  await page.locator('.calendar-toolbar').waitFor({timeout:5000}).catch(async e=>{console.log(errors,await page.locator('body').innerText());throw e;});await page.getByRole('button',{name:'Monday, November 23, 2026, 1 appointments',exact:true}).click();
  const agenda=page.getByRole('complementary',{name:'Selected day agenda'});await agenda.getByRole('heading',{name:'Fictional Acorn Studio'}).waitFor();
  assert.equal(await agenda.getByRole('link',{name:'View booking details'}).getAttribute('href'),'#booking-one');
  await page.getByLabel('Display timezone').selectOption('UTC');await agenda.getByText('No appointments on this day.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Tuesday, November 24, 2026, 1 appointments',exact:true}).click();await agenda.getByRole('heading',{name:'Fictional Acorn Studio'}).waitFor();
  await page.getByLabel('Find an attendee').fill('missing');await agenda.getByText('No matching appointments on this day.').waitFor();await page.getByLabel('Find an attendee').fill('');
  await page.getByLabel('Display timezone').selectOption('America/New_York');await page.getByRole('button',{name:'Today',exact:true}).click();await page.getByLabel('Include canceled').check();await agenda.getByRole('heading',{name:'Fictional Canceled'}).waitFor();
  await page.getByRole('button',{name:'Next month'}).click();await page.getByRole('heading',{name:'December 2026',exact:true}).waitFor();await page.getByRole('button',{name:'Previous month'}).click();await page.getByRole('button',{name:'Today',exact:true}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(out,'calendar-'+width+'.png'),fullPage:true});
  await page.addScriptTag({path:'C:/Users/joshu/microfreelancehub/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);
  checks.push({width,passed:true,timezoneBoundary:true,search:true,canceledFilter:true,monthNavigation:true,violations});await context.close();
 }
 console.log('PASS calendar component: four widths, date/timezone boundaries, search, filters, navigation, axe.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({scope:'Isolated real React component with fictional data, not production integration',checks},null,2));await browser?.close();});
