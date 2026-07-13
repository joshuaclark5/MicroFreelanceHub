import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { articles } from '../data/articles';

export const metadata: Metadata = {
  title: 'Freelance Business Articles',
  description:
    'Guides for freelance contracts, deposits, client approvals, scope creep, payment terms, and getting paid before work starts.',
  alternates: {
    canonical: 'https://www.microfreelancehub.com/articles',
  },
};

export default function ArticlesPage() {
  const sortedArticles = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="mb-8 inline-flex items-center text-sm font-bold text-slate-300 hover:text-white">
            Back to MicroFreelanceHub
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-200">
            <BookOpen className="h-4 w-4" />
            Freelance business library
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Articles for freelancers who want clean contracts and faster payments.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Practical guides on deposits, scope, signatures, client approvals, and payment workflows. Every article links back to tools and templates you can use immediately.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
          {['Daily practical guides', 'Internal links to tools', 'Built for search and AI answers'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>

        <div className="grid gap-6">
          {sortedArticles.map((article) => (
            <article key={article.slug} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>{article.category}</span>
                <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">{article.title}</h2>
              <p className="mt-3 max-w-3xl text-slate-600">{article.description}</p>
              <Link href={`/articles/${article.slug}`} className="mt-5 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
                Read article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
