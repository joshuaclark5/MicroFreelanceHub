import {Entity,fields} from './connectedWorkspace';
import {csvCell} from './workspaceReports';
type RecordRow={id:string;[key:string]:unknown};
type Records=Record<string,RecordRow[]>;
/** Export only reviewed saved fields; never owner identifiers, credentials or arbitrary payload keys. */
export function workspaceCsv(entity:Entity,rows:RecordRow[],data:Records){
 const relations:Record<string,string>={client_id:'clients',stage_id:'stages',project_id:'projects',agreement_id:'available-agreements'};
 const columns=['id',...fields[entity].flatMap(key=>relations[key]?[key,key.replace('_id','_name')]:[key])];
 const values=rows.map(row=>columns.map(key=>{
  if(key.endsWith('_name')){const idKey=key.replace('_name','_id'),related=data[relations[idKey]]?.find(item=>item.id===row[idKey]);return related?.name||related?.title||'Record unavailable';}
  const value=row[key];return typeof value==='string'||typeof value==='number'?value:'';
 }));
 return '\uFEFF'+[columns,...values].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
