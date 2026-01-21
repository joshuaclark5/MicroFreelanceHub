import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic'; // Ensures we always get fresh DB data

// 1. Generate SEO Metadata dynamically
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('seo_pages') // 👈 Notice: Reading from the NEW table
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!data) return { title: 'Role Not Found' };
  
  return {
    title: `Hire ${data.job_title}: Contract Template & Scope of Work`,
    description: `Download a professional contract for ${data.keyword}. Protect against scope creep. Includes ${data.deliverables[0]} and more.`,
  };
}

// 2. The Page Component
export default async function HirePage({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('seo_pages') // 👈 Reading from NEW table
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* 🟢 HERO SECTION */}
      <div className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-indigo-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            {data.intent_tier} Intent
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Professional <span className="text-indigo-400">{data.job_title}</span> Contract
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Stop generic agreements. Get a contract designed specifically for <strong>{data.keyword}</strong>.
          </p>
          
          <div className="flex gap-4 justify-center">
            {/* CTA: Sends them to login with the specific template slug */}
            <Link href={`/login?template=${data.slug}`}>
              <button className="bg-white text-slate-900 px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-gray-100 transition-all">
                Get This Template Now ⚡
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 📄 CONTENT BODY */}
      <div className="max-w-5xl mx-auto -mt-10 px-4 pb-20">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          
          {/* Mock Browser Header */}
          <div className="bg-gray-100 border-b border-gray-200 p-3 flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-4 text-xs text-gray-400 font-mono">TEMPLATE PREVIEW</span>
          </div>

          <div className="p-8 md:p-12">
            
            {/* PAIN POINTS SECTION */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why generic contracts fail for {data.job_title}s</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {data.pain_points?.map((point: string, i: number) => (
                  <div key={i} className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-full text-red-500 shadow-sm flex-shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-1">The Risk</h3>
                      <p className="text-gray-700 font-medium">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DELIVERABLES SECTION */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What this template includes</h2>
              <ul className="space-y-4">
                {data.deliverables?.map((item: string, i: number) => (
                  <li key={i} className="flex items-center text-lg text-gray-700 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-green-500 mr-4 text-xl">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* BOTTOM CTA */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to start?</h3>
              <Link href={`/login?template=${data.slug}`}>
                <button className="bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl">
                  Customize for {data.job_title} &rarr;
                </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}