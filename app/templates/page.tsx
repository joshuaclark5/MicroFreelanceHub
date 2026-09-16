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

export default async function TemplatesLibraryPage() {
  const { templates, total } = await searchTemplates();
  return <TemplatesLibraryClient templates={templates as TemplateLibraryItem[]} total={total} />;
}
