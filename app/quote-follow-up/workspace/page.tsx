import type { Metadata } from 'next';
import Tool from './tool';
import '../quote.css';
export const metadata: Metadata={title:'Quote Follow-up Tool | MicroFreelanceHub',robots:{index:false,follow:true}};
export default function Page(){return <Tool/>}
