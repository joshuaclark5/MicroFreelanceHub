export const supportTopics = ['Account access', 'Clients and projects', 'Scheduling', 'Invoices and billing', 'Time tracking', 'Integrations', 'Reports', 'Something else'] as const;
export type SupportTopic = typeof supportTopics[number];

// Never collect a current URL: booking, agreement and recovery links can carry
// private identifiers even when their query string has been removed.
// Bound by Unicode code points so truncation never splits an emoji. Replace
// isolated UTF-16 surrogates before URI encoding (clipboard text can contain them).
function draftDetails(value: string) {
  return Array.from(value.trim()).slice(0, 1500).map(character => {
    const point = character.codePointAt(0)!;
    return point >= 0xD800 && point <= 0xDFFF ? '\uFFFD' : character;
  }).join('');
}
export function supportDraft(topic: SupportTopic, details: string) {
  const safeTopic = supportTopics.includes(topic) ? topic : 'Something else';
  const subject = `MicroFreelanceHub help: ${safeTopic}`;
  const body = `Topic: ${safeTopic}\n\n${draftDetails(details)}\n\nPlease review this draft before sending. Remove passwords, verification codes, private links, client information and payment details.`;
  const href = `mailto:admin@microfreelancehub.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // Conservative interoperability limit, not a guarantee that an email client opens.
  return { subject, body, href, canOpenEmail: href.length <= 2000 };
}

// Only reviewed answer IDs select a fixed topic; never forward search text or URLs.
export function answerSupportTopic(id: string): SupportTopic {
  const topics: Record<string, SupportTopic> = {
    'account-access': 'Account access', clients: 'Clients and projects',
    booking: 'Scheduling', 'recurring-invoices': 'Invoices and billing',
    integrations: 'Integrations', 'uncertain-time-save': 'Time tracking',
    'report-dates': 'Reports', 'report-totals': 'Reports', 'report-export': 'Reports',
  };
  return Object.prototype.hasOwnProperty.call(topics, id) ? topics[id] : 'Something else';
}
