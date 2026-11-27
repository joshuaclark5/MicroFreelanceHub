export type OverviewDocument = {id:string;title?:string;status?:string;created_at?:string};
export function draftDocuments(records:OverviewDocument[]) {
 return records.filter(row=>row.status?.trim().toLowerCase()==='draft').map(row=>{
  const time=typeof row.created_at==='string'?Date.parse(row.created_at):NaN;
  const created=Number.isFinite(time)?new Date(time).toISOString():null;
  const unsafe=/legal protection|guaranteed? payment|force payment|limit liability|prevent lawsuits|legally binding|enforceable contract|protect yourself legally/i;
  const title=typeof row.title==='string'&&row.title.trim()&&!unsafe.test(row.title)?row.title.trim():'Draft agreement';
  return {...row,title,created};
 }).sort((a,b)=>(a.created||'9999').localeCompare(b.created||'9999')||a.id.localeCompare(b.id));
}
