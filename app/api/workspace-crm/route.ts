import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {crmInput,crmStages,exportCrm,previewCrmCsv} from '../../lib/workspaceCrm';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const validId=(v:string)=>/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export async function GET(request:Request){try{
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required. Your draft is preserved.'},401);
 const p=new URL(request.url).searchParams,mode=p.get('mode')||'list';
 if([...p.keys()].some(k=>!['mode','after','stage','q','id','expectedActorId'].includes(k)||p.getAll(k).length!==1)||!['list','export','activity'].includes(mode))return reply({error:'Unsupported filter.'},400);
 const expectedActor=p.get('expectedActorId');if(expectedActor&&expectedActor!==user.id)return reply({error:'Account changed. Return to the original account.'},409);if(mode==='export'&&!expectedActor)return reply({error:'Reload the original account before exporting.'},409);
 const after=p.get('after'),stage=p.get('stage'),search=p.get('q')||'',id=p.get('id');
 if(after&&!validId(after)||stage&&!crmStages.includes(stage as typeof crmStages[number])||search.length>100||/[%,_\\]/.test(search)||id&&!validId(id))return reply({error:'Invalid filter.'},400);
 if(mode==='activity'){
 if(!id||after||stage||search)return reply({error:'Choose one opportunity.'},400);
 const r=await db.from('workspace_crm_activity').select('id,opportunity_id,kind,body,created_at,before_record,after_record',{count:'exact'}).eq('owner_id',user.id).eq('opportunity_id',id).order('created_at',{ascending:false}).order('id').limit(201);
 // This CRM is owner-only: label the authenticated owner, never a caller-supplied author.
 const name=user.user_metadata?.full_name||user.user_metadata?.name;
 const authorName=typeof name==='string'&&name.trim()?name.trim().slice(0,160):'Account owner';
 if(r.error)throw r.error;return reply({actorId:user.id,authorName,records:(r.data||[]).slice(0,200),truncated:r.count==null||r.count>200||r.count>(r.data||[]).length});
 }
 if(id||mode==='export'&&after)return reply({error:'Unsupported filter combination.'},400);
 let query=db.from('workspace_crm_opportunities').select('id,client_id,title,stage,amount_minor,currency,expected_close,follow_up,reason,version,updated_at',{count:'exact'}).eq('owner_id',user.id).order('id').limit(mode==='export'?10001:101);
 if(after)query=query.gt('id',after);if(stage)query=query.eq('stage',stage);if(search)query=query.ilike('title','%'+search+'%');
 const r=await query;if(r.error)throw r.error;const rows=r.data||[];const complete=Number.isSafeInteger(r.count)&&r.count===rows.length;
 if(mode==='export'){
 if(!complete||rows.length>10000)return reply({error:'Export exceeds the complete 10,000-row limit or completeness could not be verified. Narrow the stage/title filter; no partial file was generated.'},409);
 const current=await db.auth.getUser();if(current.error||current.data.user?.id!==user.id)return reply({error:'Account changed. No file was created.'},409);
 return new Response(exportCrm(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="opportunities.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 // Do not silently end pagination if a backend row cap is lower than the requested page.
 if(!complete&&rows.length<101)return reply({error:'The database returned an incomplete page. No complete list is claimed.'},503);
 const c=await db.from('workspace_clients').select('id,name',{count:'exact'}).eq('owner_id',user.id).order('name').order('id').limit(1001);if(c.error)throw c.error;
 return reply({actorId:user.id,records:rows.slice(0,100),next:rows.length>100?rows[99].id:null,clients:(c.data||[]).slice(0,1000),clientsTruncated:c.count==null||c.count>1000||c.count>(c.data||[]).length});
 }catch{return reply({error:'CRM unavailable. Your draft is preserved; reload to check your session.'},503);}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 if(new URL(request.url).search)return reply({error:'Mutation filters are not supported.'},400);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required. Your draft is preserved.'},401);
 let payload;try{const raw=await request.text();if(raw.length>500000)return reply({error:'Import is too large.'},413);const b=JSON.parse(raw);
 if(b?.action==='preview'){
 if(Object.keys(b).sort().join(',')!=='action,csv,expectedActorId'||typeof b.csv!=='string')return reply({error:'Invalid preview fields.'},400);
 if(b.expectedActorId!==user.id)return reply({error:'Account changed. Return to the original account.'},409);
 const preview=previewCrmCsv(b.csv);const ids=[...new Set(preview.records.map(r=>String(r.clientId)))];
 if(ids.length){const clients=await db.from('workspace_clients').select('id').eq('owner_id',user.id).in('id',ids);if(clients.error)throw Error('Client validation unavailable.');const own=new Set((clients.data||[]).map(r=>r.id));preview.records.forEach((r,i)=>{if(!own.has(r.clientId))preview.errors.push({row:i+2,message:'Choose an accessible saved client ID.'});});}
 return reply({actorId:user.id,preview});
 }
 payload=crmInput(b);
 }catch(e){return reply({error:e instanceof SyntaxError?'Invalid JSON.':(e as Error).message},400);}
 if(payload.expectedActorId!==user.id)return reply({error:'Account changed. Return to the original account to save.'},409);
 const {data,error:failure}=await db.rpc('workspace_crm_mutate',{payload});if(failure){if(failure.code==='P0002')return reply({error:'Opportunity not found.'},404);if(['40001','23503','23505'].includes(failure.code))return reply({error:'Conflict: record, client or operation changed. Reload and review saved details.'},409);if(['22023','22007','22008','22P02','23514','22003'].includes(failure.code))return reply({error:'Check the opportunity details and import limits.'},400);throw failure;}
 return reply({actorId:user.id,record:data});
 }catch{return reply({error:'Save outcome is unconfirmed. Retry the same operation to recover safely.'},503);}}
