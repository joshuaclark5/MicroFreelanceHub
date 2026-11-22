'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SupportHandoff from './SupportHandoff';
import { answerSupportTopic, type SupportTopic as HandoffTopic } from '../lib/supportHandoff';
import { findSupportAnswers, supportAnswers, supportTopics, type SupportTopic } from '../lib/supportKnowledge';

export default function SupportGuide() {
 const [handoff, setHandoff] = useState<{topic: HandoffTopic} | null>(null);
 const [query, setQuery] = useState('');
 const [topic, setTopic] = useState<SupportTopic>('All topics');
 const [opened, setOpened] = useState<string | null>(null);
 useEffect(() => {
  function followAnswer() {
   const id = window.location.hash.slice(1);
   if (!supportAnswers.some(answer => answer.id === id)) return;
   setQuery(''); setTopic('All topics'); setOpened(id);
   requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({block:'center'}));
  }
  followAnswer(); window.addEventListener('hashchange', followAnswer);
  return () => window.removeEventListener('hashchange', followAnswer);
 }, []);
 const results = findSupportAnswers(query, topic);
 return <>
  <label htmlFor="help-search" className="font-semibold">Find an answer</label>
  <input id="help-search" type="search" value={query} onChange={e => setQuery(e.target.value)} maxLength={200} placeholder="Try booking, invoices or Google" className="my-3 block w-full rounded-xl border border-slate-300 p-4"/>
  <label htmlFor="help-topic" className="font-semibold">Browse by topic</label>
  <select id="help-topic" value={topic} onChange={e => setTopic(e.target.value as SupportTopic)} className="my-3 block w-full rounded-xl border border-slate-300 bg-white p-4">{supportTopics.map(value => <option key={value}>{value}</option>)}</select>
  <p className="mb-6 text-sm text-slate-600">Reviewed product guidance, not an AI chat. Search stays in your browser; this tool cannot access or change your account.</p>
  <div aria-live="polite" className="mb-4 text-sm">{results.length} {results.length === 1 ? 'answer' : 'answers'}</div>
  {(query || topic !== 'All topics') && <button type="button" onClick={() => {setQuery(''); setTopic('All topics');}} className="mb-5 font-semibold text-emerald-800 underline">Clear search and topic</button>}
  <div className="space-y-4">{results.map(answer => <details id={answer.id} key={answer.id} open={opened === answer.id} onToggle={e => {if (e.currentTarget.open) setOpened(answer.id); else setOpened(current => current === answer.id ? null : current);}} className="scroll-mt-24 rounded-xl border border-slate-200 p-5">
   <summary className="cursor-pointer font-semibold">{answer.q}</summary>
   <p className="my-4 leading-7 text-slate-600">{answer.a}</p>
   <div className="flex flex-wrap gap-5"><Link className="font-semibold text-emerald-800 underline" href={answer.href}>{answer.label}</Link><a className="text-slate-600 underline" href={'#' + answer.id} aria-label={'Direct link: ' + answer.q}>Link to this answer</a><button type="button" className="text-emerald-800 underline" onClick={() => setHandoff({topic: answerSupportTopic(answer.id)})}>Get help with this topic</button></div>
  </details>)}</div>
  {!results.length && <div className="rounded-xl bg-slate-50 p-5"><p>No reviewed answer matches. Try a shorter search or prepare a support email draft.</p><button type="button" className="mt-4 min-h-11 font-semibold text-emerald-800 underline" onClick={() => setHandoff({topic: 'Something else'})}>Get help with an unanswered question</button><p className="mt-2 text-sm text-slate-600">Your search is not included. Existing draft details are kept; nothing is sent automatically.</p></div>}
  <SupportHandoff request={handoff}/>
 </>;
}
