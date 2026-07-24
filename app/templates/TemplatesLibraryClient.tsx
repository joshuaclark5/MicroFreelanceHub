'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Briefcase, FileSignature, Receipt, Search, Wrench } from 'lucide-react';

export interface TemplateLibraryItem {
  slug: string;
  document_type: string | null;
  job_title: string | null;
  ai_summary: string | null;
}

const filters = [
  { label: 'All', value: 'all', icon: Briefcase },
  { label: 'Contracts', value: 'contract', icon: FileSignature },
  { label: 'Invoices', value: 'invoice', icon: Receipt },
  { label: 'Scopes', value: 'scope', icon: Wrench },
];

function toTitleCase(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDisplayTitle(template: TemplateLibraryItem) {
  const role = template.job_title || toTitleCase(template.slug);
  const documentType = template.document_type || 'Template';
  return `${role} ${documentType}`;
}

function matchesFilter(template: TemplateLibraryItem, filter: string) {
  if (filter === 'all') return true;

  const haystack = `${template.document_type || ''} ${template.slug}`.toLowerCase();
  if (filter === 'contract') {
    return haystack.includes('contract') || haystack.includes('agreement');
  }
  if (filter === 'invoice') {
    return haystack.includes('invoice') || haystack.includes('payment');
  }
  if (filter === 'scope') {
    return haystack.includes('scope') || haystack.includes('work-order') || haystack.includes('proposal') || haystack.includes('estimate');
  }

  return true;
}

export default function TemplatesLibraryClient({ templates }: { templates: TemplateLibraryItem[] }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const searchable = `${getDisplayTitle(template)} ${template.slug} ${template.ai_summary || ''}`.toLowerCase();
      return matchesFilter(template, activeFilter) && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeFilter, query, templates]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                MicroFreelanceHub
              </Link>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
                Template Library
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Search the full contract, invoice, scope, and payment template library before opening the editor.
              </p>
            </div>

            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-black"
            >
              Blank editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by trade, service, document type, or keyword"
                className="h-13 w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const selected = activeFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-500">
            {filteredTemplates.length} templates
          </p>
          <Link href="/articles" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            Browse articles
          </Link>
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Link
                key={template.slug}
                href={`/templates/${template.slug}`}
                className="group flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <FileSignature className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    {template.document_type || 'Template'}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold leading-snug text-slate-950 group-hover:text-blue-600">
                  {getDisplayTitle(template)}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {template.ai_summary || 'Open this template, customize the project details, and send one client-ready link.'}
                </p>

                <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-extrabold text-slate-900 group-hover:text-blue-600">
                  View template
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-extrabold text-slate-950">No templates found</h2>
            <p className="mt-2 text-slate-600">Try a broader trade, service, or document type.</p>
          </div>
        )}
      </section>
    </main>
  );
}
