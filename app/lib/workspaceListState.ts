// URL state contains controls only, never records, drafts, or account identity.
export function listQueryUrl(href:string, updates:Record<string,string|null>):string {
 const url=new URL(href);
 for(const [key,value] of Object.entries(updates)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
 return url.pathname+url.search+url.hash;
}
export function crmListState(params:URLSearchParams, stages:readonly string[]){
 const stage=params.get('stage')||'';
 return {search:(params.get('q')||'').slice(0,100),stage:stages.includes(stage)?stage:'',after:(params.get('after')||'').slice(0,2048)};
}
export function timeListState(params:URLSearchParams, fallbackDate:string){
 const date=params.get('from')||'';let validDate=false;
 if(/^\d{4}-\d{2}-\d{2}$/.test(date)){const parsed=new Date(date+'T00:00:00Z');validDate=Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;}
 const project=params.get('projectId')||'',billable=params.get('billable')||'';
 return {from:validDate?date:fallbackDate,days:params.get('days')==='1'?'1':'7',project:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project)?project:'',billable:billable==='true'||billable==='false'?billable:''};
}
