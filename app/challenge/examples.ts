export const briefFields = [
  ['Project label', 'Name the project and the client or use a fictional label.'],
  ['Deliverables and acceptance criteria', 'What will you deliver? Include quantities, formats and what the reviewer will check.'],
  ['Revision rounds and exclusions', 'How many feedback rounds? What counts as a round? What is outside this scope?'],
  ['Client inputs', 'Who supplies copy, images, access and approvals? By when?'],
  ['Milestones, reviewer and payment timing', 'For each stage: output, reviewer, review window, amount and agreed due event.'],
  ['Change-request reply', 'Acknowledge the request. Explain the difference. Offer an estimate or the original scope.'],
] as const;
export const examples: Record<string,{label:string;values:string[]}> = {
 website:{label:'Five-page website',values:[
 'Example: Five-page website for Cedar Studio',
 'Home, About, Services, Work and Contact pages. Responsive layouts and one contact form. Review the five named pages on phone and desktop, check navigation, and test delivery of a sample form message.',
 'Two consolidated design revision rounds. One round means one collected feedback list from the named reviewer. Excludes copywriting, an online shop, hosting and ongoing maintenance.',
 'Client supplies approved copy, logo and licensed images before kickoff. Client confirms the domain/hosting contact. Agree on revised dates if inputs arrive later than planned.',
 'Illustrative total: $1,200. $400 to begin after brief approval; $400 after design approval; $400 at the agreed handover stage. Client owner is the reviewer and sends one feedback list within three business days. Confirm actual dates together before starting.',
 'Happy to look at adding a shop. That is outside the five-page scope. I can prepare a separate estimate with the extra cost and timing, or keep this release focused on the original pages. Which option would you like to review?'
 ]},
 social:{label:'Social content package',values:[
 'Example: Twelve social posts for Northside Cafe',
 'Twelve static square post graphics and twelve captions for one channel. Deliver PNG files and an editable caption document. Reviewer checks wording, dates, image usage and dimensions before scheduling.',
 'One consolidated revision round on the complete draft set. Excludes video, community management, paid advertising and daily posting. No promise of views or sales.',
 'Client supplies brand assets, approved offers, dates and licensed photos before drafting. One marketing contact consolidates feedback.',
 'Illustrative total: $600. $300 after brief approval before drafting; $300 at the agreed final-delivery stage. Reviewer responds within two business days. Confirm calendar dates and approval of any claims before publishing.',
 'Happy to estimate six additional posts. Our current scope is twelve. I can quote the extra six with a revised delivery date, or we can keep the original package. Which would you prefer?'
 ]},
 copy:{label:'Landing-page copy',values:[
 'Example: Landing-page copy for a local service',
 'One landing page, up to 800 words, with headline, service explanation, three benefit sections, FAQ and call to action. Deliver an editable document. Reviewer checks factual claims, scope and word count.',
 'Two consolidated copy revision rounds. Excludes page design, coding, interviews, SEO audits and traffic or conversion guarantees.',
 'Client provides the service details, target audience, approved proof and brand guidance before drafting. Client verifies factual claims and permissions for quoted material.',
 'Illustrative total: $800. $400 after brief approval before drafting; $400 at the agreed final-copy stage. Business owner reviews within three business days. Agree on target dates after receiving inputs.',
 'A separate email sequence would add deliverables beyond this landing page. I can estimate its cost and timing separately, or keep this project to the page copy. Which direction should I prepare for review?'
 ]},
};
