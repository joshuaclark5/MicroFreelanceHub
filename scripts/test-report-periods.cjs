const assert=require('node:assert/strict');
const {lib}=require('./test-workspace-reports-api.cjs');
const checks=[
 ['month','2026-11-22T07:58:00Z','2026-11-01','2026-11-22'],
 ['previous-month','2026-01-01T00:00:00Z','2025-12-01','2025-12-31'],
 ['previous-month','2024-03-15T12:00:00Z','2024-02-01','2024-02-29'],
 ['previous-month','2025-03-15T12:00:00Z','2025-02-01','2025-02-28'],
 ['30-days','2024-03-01T00:00:00Z','2024-02-01','2024-03-01'],
 ['30-days','2026-01-01T00:00:00Z','2025-12-03','2026-01-01'],
 ['month','2026-11-01T00:30:00+14:00','2026-10-01','2026-10-31'],
 ['month','2026-10-31T23:30:00-04:00','2026-11-01','2026-11-01'],
 ['30-days','2026-11-22T01:00:00-05:00','2026-10-24','2026-11-22'],
];
for(const [period,instant,from,to] of checks){const now=new Date(instant),before=now.getTime(),r=lib.reportPeriod(period,now);assert.equal(r.from,from);assert.equal(r.to,to);assert.equal(now.getTime(),before);const p=lib.reportInput(new URLSearchParams(r));assert.equal(p.end,new Date(Date.parse(to)+86400000).toISOString());if(period==='30-days')assert.equal((Date.parse(to)-Date.parse(from))/86400000+1,30);}
assert.throws(()=>lib.reportPeriod('unknown',new Date()));assert.throws(()=>lib.reportPeriod('month',new Date(NaN)));assert.throws(()=>lib.reportPeriod('previous-month',new Date('2000-01-01T00:00:00Z')));
console.log('PASS report date ranges: leap/year/UTC boundaries, inclusive 30 days, input parity and invalid dates');
