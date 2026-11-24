import { templateSearchState } from '../lib/templateSearchState';
import { searchTemplates } from '../lib/templateLibrary';
import { Metadata } from 'next';
import TemplatesLibraryClient, { TemplateLibraryItem } from './TemplatesLibraryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Freelance Contract Template Library',
  description: 'Search MicroFreelanceHub contract, invoice, scope of work, estimate, and payment templates for freelancers and contractors.',
  alternates: {
    canonical: 'https://www.microfreelancehub.com/templates',
  },
};

export default async function TemplatesLibraryPage({ searchParams = {} }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const state = templateSearchState({get: name => typeof searchParams[name] === 'string' ? searchParams[name] as string : null});
  const { templates, total } = await searchTemplates(state.query, state.filter, state.page);
  return <TemplatesLibraryClient templates={templates as TemplateLibraryItem[]} total={total} />;
}
