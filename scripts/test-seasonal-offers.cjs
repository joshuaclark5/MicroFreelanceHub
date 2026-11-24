const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>{throw Error(n);}});return exports;}
const {activeSeasonalOffer,SEASONAL_OFFERS,offerFirstPayment}=load('app/lib/seasonalOffers.ts');
const {seasonalCoupon}=load('app/lib/server/seasonalCoupon.ts');
(async()=>{
for(const offer of SEASONAL_OFFERS){assert.equal(activeSeasonalOffer(Date.parse(offer.startsAt)-1),null);assert.equal(activeSeasonalOffer(Date.parse(offer.startsAt)).id,offer.id);assert.equal(activeSeasonalOffer(Date.parse(offer.endsAt)-1).id,offer.id);assert.equal(activeSeasonalOffer(Date.parse(offer.endsAt)),null);for(const [amount,expected]of [[28800,14400],[52800,26400],[124800,62400]])assert.equal(offerFirstPayment(amount,offer),expected);
 let calls=0,created;const stripe={coupons:{retrieve:async()=>{throw {code:'resource_missing'};},create:async(value,options)=>{calls++;created=value;assert.equal(options.idempotencyKey,offer.id+'-annual-once');return {...value,valid:true};}}};assert.equal(await seasonalCoupon(stripe,offer),offer.id+'-annual-once');assert.equal(calls,1);assert.equal(created.duration,'once');assert.equal(created.percent_off,50);assert.equal(created.redeem_by,Date.parse(offer.endsAt)/1000+3600);
 stripe.coupons.retrieve=async()=>({...created,valid:true});await seasonalCoupon(stripe,offer);assert.equal(calls,1);
 for(const changes of [{duration:'forever'},{valid:false},{percent_off:30},{metadata:{campaign:'wrong'}},{redeem_by:1}]){stripe.coupons.retrieve=async()=>({...created,valid:true,...changes});await assert.rejects(()=>seasonalCoupon(stripe,offer));}
 stripe.coupons.retrieve=async()=>{throw {code:'api_connection_error'};};await assert.rejects(()=>seasonalCoupon(stripe,offer));assert.equal(calls,1);
}assert.equal(activeSeasonalOffer(Date.parse('2027-11-26T12:00:00Z')),null);console.log('PASS offer windows, gap, no annual auto-repeat, six discounted amounts, once-only coupon configuration, idempotent reuse and mismatch/provider failure rejection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
