import Link from 'next/link';
import { CheckCircle2, ArrowRight, FileText } from 'lucide-react';

type Props = {
  searchParams: {
    tier?: string;
    template?: string;
    landing_page?: string;
    lead_source?: string;
  };
};

function prettyTemplate(slug?: string) {
  if (!slug) return null;
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function SignupSuccessPage({ searchParams }: Props) {
  const templateName = prettyTemplate(searchParams.template);
  const continueHref = searchParams.template ? `/templates/${searchParams.template}` : '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-700">Free account created</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
          Your MicroFreelanceHub account is ready.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          You can now create contracts, save templates, collect signatures, and prepare client-ready deposit links.
        </p>

        {templateName && (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left">
            <div className="flex gap-3">
              <FileText className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-extrabold text-blue-950">Continue with your selected template</p>
                <p className="mt-1 text-sm text-blue-900">{templateName}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={continueHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">
            See paid plans
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-5 text-left text-xs text-slate-400">
          <p>Analytics route: free-tier signup</p>
          {searchParams.landing_page && <p>Landing page: {searchParams.landing_page}</p>}
          {searchParams.lead_source && <p>Lead source: {searchParams.lead_source}</p>}
        </div>
      </div>
    </div>
  );
}
