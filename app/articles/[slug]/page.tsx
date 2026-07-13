import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { articles, getArticle } from '../../data/articles';

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = getArticle(params.slug);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: `https://www.microfreelancehub.com/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) return notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'MicroFreelanceHub',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MicroFreelanceHub',
    },
    mainEntityOfPage: `https://www.microfreelancehub.com/articles/${article.slug}`,
  };

  return (
    <article className="min-h-screen bg-white text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <header className="border-b border-slate-200 bg-slate-950 px-6 py-16 text-white md:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/articles" className="mb-8 inline-flex items-center text-sm font-bold text-slate-300 hover:text-white">
            Back to articles
          </Link>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-200">
            <span>{article.category}</span>
            <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">{article.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">{article.description}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_320px]">
        <main className="max-w-3xl">
          <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div className="mb-3 flex items-center gap-2 font-extrabold text-blue-900">
              <Sparkles className="h-5 w-5" />
              Quick answer
            </div>
            <p className="leading-relaxed text-blue-950">{article.aiSummary}</p>
          </div>

          <div className="space-y-10">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-extrabold text-slate-900">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-lg leading-relaxed text-slate-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-slate-950 p-6 text-white">
            <h2 className="text-2xl font-extrabold">Ready to turn this into a client-ready workflow?</h2>
            <p className="mt-3 text-slate-300">
              Build the agreement, add your deposit amount, and send one link for signature and payment.
            </p>
            <Link href="/create" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">
              Create a contract
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-500">
              <FileText className="h-4 w-4" />
              Related tools and templates
            </h2>
            <div className="mt-5 space-y-3">
              {article.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="flex gap-3 rounded-xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm hover:text-blue-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
