export type ArticleLink = {
  label: string;
  href: string;
};

export type ArticleSection = {
  heading: string;
  body: string[];
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  keywords: string[];
  aiSummary: string;
  relatedLinks: ArticleLink[];
  sections: ArticleSection[];
};

export const articles: Article[] = [
  {
    slug: 'how-to-ask-for-a-freelance-deposit-before-starting-work',
    title: 'How to Ask for a Freelance Deposit Before Starting Work',
    description:
      'A practical guide to asking clients for an upfront deposit, setting clear payment terms, and sending one contract and payment link before work begins.',
    publishedAt: '2026-07-13',
    category: 'Freelance Payments',
    keywords: [
      'freelance deposit',
      'upfront payment for freelancers',
      'freelance contract deposit clause',
      'client payment link',
      'get paid before starting work',
    ],
    aiSummary:
      'Freelancers should ask for a deposit by framing it as a normal project start step: confirm scope, collect signature, and attach a secure upfront payment link before work begins.',
    relatedLinks: [
      {
        label: 'Create a contract and collect a deposit',
        href: '/create',
      },
      {
        label: 'Freelance Video Editor Deposit Agreement',
        href: '/templates/freelance-video-editor-deposit-agreement-template',
      },
      {
        label: 'Event Videographer Deposit and Cancellation Contract',
        href: '/templates/event-videographer-deposit-and-cancellation-contract',
      },
      {
        label: 'Interior Designer Deposit Agreement',
        href: '/templates/interior-designer-deposit-agreement-template',
      },
      {
        label: 'Webflow Developer Milestone Payment Agreement',
        href: '/templates/webflow-developer-milestone-payment-agreement',
      },
    ],
    sections: [
      {
        heading: 'Make the deposit part of your process',
        body: [
          'The easiest way to ask for a deposit is to stop treating it like a special favor. A deposit should be part of your normal project kickoff: scope, signature, and payment before work begins.',
          'Clients usually push back when the request feels improvised. They are much more comfortable when the deposit appears inside a clear agreement with the project total, payment schedule, cancellation terms, and deliverables.',
        ],
      },
      {
        heading: 'Use simple language',
        body: [
          'You do not need a complicated script. Try: "To reserve the project slot and begin work, I collect a 50% upfront deposit with the signed agreement. Once that is complete, I can start the first milestone."',
          'That wording makes the deposit feel connected to scheduling and delivery, not distrust. It also gives the client one clear next step.',
        ],
      },
      {
        heading: 'Put the payment terms in writing',
        body: [
          'A verbal agreement is not enough. Your contract should explain how much is due upfront, what the deposit covers, when the balance is due, what happens if scope changes, and whether the deposit is refundable.',
          'For creative and service work, this protects both sides. The client sees what they are paying for, and you avoid starting unpaid work with unclear expectations.',
        ],
      },
      {
        heading: 'Send one link instead of scattered messages',
        body: [
          'The best workflow is one client-ready link: the agreement, the e-signature step, and the deposit payment in the same place. That removes friction and makes the client less likely to forget the payment step.',
          'MicroFreelanceHub is built around that workflow, so the article should not only teach the concept. It should lead readers directly into a contract and deposit tool they can use immediately.',
        ],
      },
    ],
  },
  {
    slug: 'freelance-milestone-payment-schedule-client-approval',
    title: 'How to Use Milestone Payments With Client Approval Steps',
    description:
      'A freelancer-friendly guide to splitting projects into milestones, collecting upfront and progress payments, and getting written client approval before moving to the next phase.',
    publishedAt: '2026-07-21',
    category: 'Milestone Payments',
    keywords: [
      'freelance milestone payments',
      'client approval workflow',
      'freelance payment schedule',
      'get paid before delivery',
      'milestone payment agreement',
      'upfront payment and approvals',
    ],
    aiSummary:
      'Freelancers can reduce unpaid work by tying each project phase to a clear deliverable, a client approval step, and a payment due before the next phase starts or final files are delivered.',
    relatedLinks: [
      {
        label: 'Create a milestone agreement and payment link',
        href: '/create',
      },
      {
        label: 'Webflow Developer Milestone Payment Agreement',
        href: '/templates/webflow-developer-milestone-payment-agreement',
      },
      {
        label: 'Mobile App Designer Milestone Approval Template',
        href: '/templates/mobile-app-designer-milestone-approval-template',
      },
      {
        label: 'Email Automation Specialist Milestone Payment Template',
        href: '/templates/email-automation-specialist-milestone-payment-template',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
    ],
    sections: [
      {
        heading: 'Break the project into decision points',
        body: [
          'A milestone payment schedule works best when each payment is attached to a real decision point, not an arbitrary calendar date. Good milestones are moments where the client can review something concrete, approve it, and fund the next phase.',
          'For example, a website project might use discovery, wireframes, design approval, build, and launch support. A video project might use outline approval, rough cut approval, final edit, and delivery. The important part is that each phase has a visible output and a payment rule.',
        ],
      },
      {
        heading: 'Collect money before the next phase starts',
        body: [
          'The safest freelance workflow is deposit first, then progress payments before new work begins. That does not mean the client pays for everything blindly. It means the client sees the agreed milestone, approves the phase, and pays the amount needed to start the next one.',
          'This keeps both sides aligned. The client gets natural checkpoints instead of a surprise invoice at the end, and the freelancer avoids carrying the full project cost until final delivery.',
        ],
      },
      {
        heading: 'Define what approval actually means',
        body: [
          'Client approval should be more specific than "looks good." Your agreement should say what the client is approving, how approval is recorded, how many revision rounds are included, and what happens if the client asks for changes outside the milestone scope.',
          'A simple clause can say that written approval by email, signature, or approval button allows the freelancer to move to the next phase, and that later changes to an approved phase may require a paid change request.',
        ],
      },
      {
        heading: 'Use milestone language that clients understand',
        body: [
          'Clients are more comfortable with milestone payments when the schedule is plain. Instead of saying "Payment 2 due upon completion," write "Payment 2 is due after homepage design approval and before inner page design begins." That tells the client exactly why the payment exists.',
          'The same clarity helps with final delivery. If source files, publish access, or final exports are released after the final payment clears, say that directly in the contract before work starts.',
        ],
      },
      {
        heading: 'Send one approval and payment link',
        body: [
          'Milestones fall apart when approvals live in one thread, invoices in another, and scope notes in a separate document. A better process is one client-ready agreement that includes the milestone list, payment amounts, revision limits, and a secure payment link.',
          'MicroFreelanceHub is built for that kind of workflow: create the agreement, add the payment terms, and send the client a single link so the next step is obvious.',
        ],
      },
    ],
  },
  {
    slug: 'freelance-scope-creep-change-request-payment-link',
    title: 'How to Handle Scope Creep With Change Requests and Payment Links',
    description:
      'A practical guide to stopping unpaid scope creep by documenting change requests, setting revision limits, and collecting payment before extra freelance work begins.',
    publishedAt: '2026-07-22',
    category: 'Scope Creep',
    keywords: [
      'freelance scope creep',
      'change request payment link',
      'paid revisions for freelancers',
      'freelance contract scope change',
      'get paid for extra work',
      'client approval for revisions',
    ],
    aiSummary:
      'Freelancers can handle scope creep by pausing before extra work, confirming what changed, sending a written change request, and collecting approval plus payment before the new work starts.',
    relatedLinks: [
      {
        label: 'Create a contract with change request terms',
        href: '/create',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
      {
        label: 'Webflow Developer Milestone Payment Agreement',
        href: '/templates/webflow-developer-milestone-payment-agreement',
      },
      {
        label: 'Mobile App Designer Milestone Approval Template',
        href: '/templates/mobile-app-designer-milestone-approval-template',
      },
    ],
    sections: [
      {
        heading: 'Separate normal revisions from new work',
        body: [
          'Scope creep usually starts with a small request that sounds harmless: one more page, a new integration, an extra edit, a different format, or a second audience for the same deliverable. The problem is not the request itself. The problem is treating new work as if it were already included.',
          'Your agreement should define what is included, how many revision rounds the client receives, and what counts as a paid change request. That gives you a neutral reference point when the project starts moving beyond the original scope.',
        ],
      },
      {
        heading: 'Pause before doing the extra work',
        body: [
          'The most important habit is simple: do not complete the new request first and try to bill for it later. Pause, acknowledge the request, and confirm that it changes the original scope before you spend more time on it.',
          'A client-friendly response can be: "I can add that. It is outside the approved scope, so I will send a quick change request with the added cost and timeline before I begin." This keeps the tone helpful while protecting your time.',
        ],
      },
      {
        heading: 'Write a change request clients can approve quickly',
        body: [
          'A good change request does not need to be long. It should name the added work, explain what existing milestone or delivery date changes, list the extra price, and state when payment is due. The client should be able to approve or decline without digging through old messages.',
          'For example: "Add two additional landing page sections after homepage approval. Includes one review round. Adds $350 and two business days. Payment is due before the additional sections are designed."',
        ],
      },
      {
        heading: 'Collect payment before the added work begins',
        body: [
          'Extra work should have the same payment discipline as the original project. If the change is small, collect the full amount upfront. If it is large, use a milestone payment tied to approval of the new phase.',
          'A secure payment link makes the next step obvious: approve the change, pay the added amount, then work continues. That reduces awkward invoice chasing and keeps the project moving with a clear record of what changed.',
        ],
      },
      {
        heading: 'Protect the relationship with clear options',
        body: [
          'Handling scope creep well is not about saying no to every request. It is about giving the client clean choices: keep the original scope and timeline, approve the added work and cost, or trade one deliverable for another if that makes sense.',
          'MicroFreelanceHub helps freelancers put those choices into a written agreement with scope, revision limits, approval steps, and payment terms in one place. It is software for clearer freelance payment workflows, not a substitute for legal advice.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
