import { notFound } from 'next/navigation';
import Workspace from '../Workspace';
import { isEntity } from '../../lib/connectedWorkspace';
export const metadata={title:'Connected workspace',robots:{index:false,follow:false}};
export default function Page({params}:{params:{section:string}}){if(!isEntity(params.section))notFound();return <Workspace key={params.section} section={params.section}/>;}
