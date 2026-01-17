import Link from 'next/link';
import { createClient } from '../supabaseServer';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = createClient();

  // 1. Check Login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch Data
  const { data: sows } = await supabase
    .from('sow_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Calculate "Real" Stats (FIXED: Added Number() to force math mode)
  const projects = sows || [];
  const totalRevenue = projects.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const activeProjects = projects.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, here is what’s happening today.</p>
            </div>
            <Link 
              href="/create" 
              className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
            >
              + Create New SOW
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Total Revenue (FIXED formatting) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Pipeline Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${totalRevenue.toLocaleString()}
            </p>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <span className="bg-green-100 px-2 py-0.5 rounded-full font-medium">
                +100%
              </span>
              <span className="ml-2 text-gray-400">from last month</span>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activeProjects}</p>
            <p className="text-sm text-gray-400 mt-2">Currently in progress</p>
          </div>

          {/* Card 3: Action Items */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            <p className="text-sm text-gray-400 mt-2">All payments up to date</p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Projects</h3>
            <span className="text-xs text-gray-500 bg-white border px-2 py-1 rounded">Sorted by Date</span>
          </div>

          {projects.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((sow: any) => (
                  <tr key={sow.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{sow.client_name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{sow.project_scope}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">
                      ${Number(sow.total_amount).toLocaleString()} {sow.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sow.status === 'Signed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sow.status || 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sow.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/sow/${sow.slug}`} 
                        className="text-gray-400 hover:text-black font-medium text-sm transition-colors"
                      >
                        View Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No projects found.</p>
              <Link href="/create" className="text-blue-600 font-medium hover:underline">
                Create your first SOW
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}