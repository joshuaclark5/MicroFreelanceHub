import {Suspense} from 'react';
import TimeWorkspace from '../../components/workspace-time/TimeWorkspace';
export default function Page(){return <Suspense fallback={<main><h1>Time</h1><p role="status">Loading workspace...</p></main>}><TimeWorkspace/></Suspense>;}
