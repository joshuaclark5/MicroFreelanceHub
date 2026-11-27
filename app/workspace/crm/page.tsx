import {Suspense} from 'react';
import CrmWorkspace from '../../components/workspace-crm/CrmWorkspace';
export default function Page(){return <Suspense fallback={<main><h1>Opportunities</h1><p role="status">Loading workspace...</p></main>}><CrmWorkspace/></Suspense>;}
