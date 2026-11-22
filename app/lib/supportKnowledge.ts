export const supportAnswers = [
 {id:'features', topic:'Getting started', q:'Where are the new features?', a:'Sign in, then open a workspace tool below. Your agreements remain in the dashboard; the wider workspace includes CRM, scheduling, invoices, time, reports, resources and team access.', href:'/features', label:'Explore the workspace'},
 {id:'clients', topic:'Getting started', q:'How do I start with a client?', a:'Open CRM to record client details and notes. Add only information you need for your work. A client record does not send an invitation or charge anyone.', href:'/workspace/crm', label:'Open CRM'},
 {id:'booking', topic:'Scheduling', q:'Can clients book appointments?', a:'Public booking is opt-in. Configure scheduling and enable your booking link before sharing it. Existing accounts are not automatically opted in.', href:'/workspace/scheduling', label:'Open scheduling'},
 {id:'recurring-invoices', topic:'Billing', q:'Will recurring invoices automatically charge clients?', a:'No. Recurring drafts require manual review. Live automatic recurring charges are not enabled; Stripe subscription lifecycle checks have been test-mode only.', href:'/workspace/invoices', label:'Review invoices'},
 {id:'account-access', topic:'Account access', q:'How do I recover my password or log in with Google?', a:'Use the live sign-in page and its recovery options. Google-only accounts should use Continue with Google. Never send a password, recovery link or verification code to support.', href:'/login?mode=signin', label:'Go to sign in'},
 {id:'integrations', topic:'Scheduling', q:'Does Google Calendar, Outlook or QuickBooks sync?', a:'Google Calendar supports manual availability sync after connection. Background sync and calendar event creation are not verified live. Outlook and QuickBooks are still in development.', href:'/workspace/connections', label:'Review connections'},
 {id:'professional-advice', topic:'Getting started', q:'Can I get legal, tax or payment advice?', a:'We provide business workflow tools, not legal or tax advice. Review documents and payment arrangements with qualified professionals when appropriate. No template or disclaimer guarantees an outcome.', href:'/disclaimer', label:'Read the disclaimer'},
 {id:'contact-support', topic:'Troubleshooting', q:'How do I report a bug or billing problem?', a:'Email support with the page, approximate time, what you expected and what happened. Redact client information. Do not include passwords, card details or secret keys. We do not promise a response time that has not been established.', href:'mailto:support@microfreelancehub.com', label:'Contact support'},
 {id:'uncertain-time-save', topic:'Troubleshooting', q:'What if a time save fails or the result is uncertain?', a:'Check your time entries before creating another entry. A connection error does not always mean nothing was saved. If a retry is offered for the original entry, use that rather than creating a second one. Contact support if the result remains unclear; include the approximate time and steps, not client details.', href:'/workspace/time', label:'Check time entries'},
];

export const supportTopics = ['All topics', 'Getting started', 'Account access', 'Scheduling', 'Billing', 'Troubleshooting'] as const;
export type SupportTopic = typeof supportTopics[number];
const aliases: Record<string, string> = { reset:'recovery', recover:'recovery', login:'account', signin:'account', password:'password', appointments:'booking', appointment:'booking', invoice:'invoices', payments:'payment', retry:'save', failed:'save', failure:'save' };
function tokens(value: string): string[] {
 return value.toLowerCase().normalize('NFKC').replace(/sign[ -]in/g, 'signin').match(/[\p{L}\p{N}]+/gu) || [];
}
// Ignore question scaffolding, never substantive unknown terms or negation.
const questionWords = new Set(['how', 'do', 'does', 'i', 'my', 'the', 'a', 'an', 'can', 'where', 'is', 'are', 'what', 'to', 'please']);
function canonical(token: string) { return aliases[token] || token; }
export function findSupportAnswers(query: string, topic: SupportTopic = 'All topics') {
 const rawTerms = tokens(query.slice(0, 200));
 const terms = rawTerms.filter(term => !questionWords.has(term)).map(canonical);
 // A nonempty question without a subject is not a match for every answer.
 if (query.trim() && terms.length === 0) return [];
 return supportAnswers.filter(answer => {
  if (topic !== 'All topics' && answer.topic !== topic) return false;
  const haystack = tokens(answer.q + ' ' + answer.a).map(canonical);
  return terms.every(term => haystack.some(word => word === term));
 });
}
