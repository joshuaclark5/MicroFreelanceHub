import {validId} from './connectedWorkspace';
export const sampleClient={name:'Sample Client',email:'sample@example.test',project:'Website redesign',scope:'Five website pages, mobile layouts and two rounds of revisions.'} as const;
export function sampleClientKey(actorId:string){if(!validId(actorId))throw Error('Sign in to use a sample client.');return 'mfh:sample-client:v1:'+actorId;}
export function readSampleClient(storage:Pick<Storage,'getItem'>,actorId:string){return storage.getItem(sampleClientKey(actorId))==='1';}
export function saveSampleClient(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,actorId:string,selected:boolean){
 const key=sampleClientKey(actorId);
 if(selected)storage.setItem(key,'1');else storage.removeItem(key);
 if(storage.getItem(key)!==(selected?'1':null))throw Error('Sample choice could not be confirmed. Please retry.');
 return selected;
}
