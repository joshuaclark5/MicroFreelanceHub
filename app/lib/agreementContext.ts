import { validId } from './connectedWorkspace';
// Both lookups are scoped to the authenticated owner, never a query-string identity.
export async function agreementContext(db: any, ownerId: string, projectId: string) {
 if (!validId(projectId) || !validId(ownerId)) throw Error('Project unavailable.');
 const {data: project,error} = await db.from('workspace_projects').select('id,name,client_id').eq('owner_id',ownerId).eq('id',projectId).maybeSingle();
 if(error || !project) throw Error('Project unavailable.');
 const {data: client,error: clientError} = await db.from('workspace_clients').select('id,name,email').eq('owner_id',ownerId).eq('id',project.client_id).maybeSingle();
 if(clientError || !client) throw Error('Project unavailable.');
 return {projectId:project.id, clientId:client.id, title:project.name, client:client.name, email:client.email || ''};
}
