import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import SupportGuide from './SupportGuide';
export const metadata: Metadata = { title:'Help & support | MicroFreelanceHub', description:'Find reviewed answers about clients, bookings, agreements, invoices and account access, or contact MicroFreelanceHub support.', alternates:{canonical:'https://www.microfreelancehub.com/support'}};
export default function Support(){return <><Navbar/><main className="mx-auto max-w-3xl px-5 py-14"><h1 className="text-4xl font-semibold">A clear next step.</h1><p className="mb-9 mt-5 text-lg leading-8 text-slate-600">Find your way around the workspace, understand an integration or get help when something goes wrong.</p><SupportGuide/></main></>}
