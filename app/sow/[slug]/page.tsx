import { createClient } from '../../supabaseServer'; // Go up 2 levels to find the server file
import { notFound } from 'next/navigation';
import SignButton from '../../components/SignButton';

export default async function SOWPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  // 1. Fetch the SOW by the unique slug in the URL
  const { data: sow } = await supabase
    .from('sow_documents')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!sow) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        
        {/* Header / Brand Section */}
        <div className="bg-slate-900 px-8 py-10 text-white flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scope of Work</h1>
            <p className="text-slate-400 mt-1">Reference: #{sow.slug.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">{sow.client_name}</h2>
            <p className="text-slate-400 text-sm mt-1">Created: {new Date(sow.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Project Summary Stats */}
        <div className="grid grid-cols-3 border-b border-gray-200">
          <div className="p-6 border-r border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Project Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {sow.total_amount.toLocaleString()} <span className="text-sm font-medium text-gray-500">{sow.currency}</span>
            </p>
          </div>
          <div className="p-6 border-r border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Timeline</p>
            <p className="text-lg font-medium text-gray-900 mt-1">{sow.timeline}</p>
          </div>
          
          {/* 👇 THIS IS THE UPDATED SMART SECTION 👇 */}
          <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
            <span className={`inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              sow.status === 'Signed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {sow.status || 'Awaiting Signature'}
            </span>
          </div>
          {/* 👆 END UPDATE 👆 */}
          
        </div>

        {/* The Meat: Scope & Deliverables */}
        <div className="p-8 space-y-8">
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Project Scope</h3>
            <div className="prose text-gray-600 leading-relaxed">
              <p>{sow.project_scope}</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Milestones & Payment Schedule</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sow.milestones?.map((m: any, i: number) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {m.due_date}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${m.amount?.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                        {m.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Signature Block */}
          <section className="pt-10 mt-10 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-20">
              <div>
                <p className="border-b-2 border-gray-300 h-10"></p>
                <p className="mt-2 text-sm font-medium text-gray-900">Client Signature</p>
              </div>
              <div>
                {/* 👇 Pass the status from the DB into the button */}
                <SignButton sowId={sow.id} initialStatus={sow.status} />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}