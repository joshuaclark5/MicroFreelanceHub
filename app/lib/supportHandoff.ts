export const supportTopics = ['Account access', 'Clients and projects', 'Scheduling', 'Invoices and billing', 'Time tracking', 'Integrations', 'Something else'] as const;
export type SupportTopic = typeof supportTopics[number];

// Never collect a current URL: booking, agreement and recovery links can carry
// private identifiers even when their query string has been removed.
export function supportDraft(topic: SupportTopic, details: string) {
  const safeTopic = supportTopics.includes(topic) ? topic : 'Something else';
  const subject = `MicroFreelanceHub help: ${safeTopic}`;
  const body = `Topic: ${safeTopic}\n\n${details.trim().slice(0, 1500)}\n\nPlease review this draft before sending. Remove passwords, verification codes, private links, client information and payment details.`;
  return { subject, body, href: `mailto:support@microfreelancehub.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
