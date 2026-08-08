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
  ctaHref: string;
  ctaLabel: string;
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
    ctaHref: '/create?template=freelance-video-editor-deposit-agreement-template',
    ctaLabel: 'Customize this deposit agreement',
    relatedLinks: [
      {
        label: 'Create a contract and collect a deposit',
        href: '/create?template=freelance-video-editor-deposit-agreement-template',
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
    ctaHref: '/create?template=webflow-developer-milestone-payment-agreement',
    ctaLabel: 'Customize this milestone agreement',
    relatedLinks: [
      {
        label: 'Create a milestone agreement and payment link',
        href: '/create?template=webflow-developer-milestone-payment-agreement',
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
    ctaHref: '/create?template=mobile-app-designer-milestone-approval-template',
    ctaLabel: 'Customize this change request agreement',
    relatedLinks: [
      {
        label: 'Create a contract with change request terms',
        href: '/create?template=mobile-app-designer-milestone-approval-template',
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
  {
    slug: 'freelance-cancellation-clause-deposit-before-work-starts',
    title: 'Freelance Cancellation Clauses: How to Protect Deposits Before Work Starts',
    description:
      'A practical guide to writing cancellation terms that explain deposits, client delays, refund rules, and payment timing before a freelance project begins.',
    publishedAt: '2026-07-23',
    category: 'Cancellation Terms',
    keywords: [
      'freelance cancellation clause',
      'freelance deposit terms',
      'client cancellation policy',
      'upfront payment contract',
      'paid project kickoff',
      'cancellation fee for freelancers',
    ],
    aiSummary:
      'A freelance cancellation clause should explain what the deposit reserves, when payments are refundable or nonrefundable, how client delays affect the schedule, and what must be paid before work restarts or final files are released.',
    ctaHref: '/create?template=event-videographer-deposit-and-cancellation-contract',
    ctaLabel: 'Customize this cancellation agreement',
    relatedLinks: [
      {
        label: 'Create cancellation terms and collect a deposit',
        href: '/create?template=event-videographer-deposit-and-cancellation-contract',
      },
      {
        label: 'Event Videographer Deposit and Cancellation Contract',
        href: '/templates/event-videographer-deposit-and-cancellation-contract',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'How to Handle Scope Creep With Change Requests and Payment Links',
        href: '/articles/freelance-scope-creep-change-request-payment-link',
      },
      {
        label: 'Freelance Video Editor Deposit Agreement',
        href: '/templates/freelance-video-editor-deposit-agreement-template',
      },
    ],
    sections: [
      {
        heading: 'Explain what the deposit reserves',
        body: [
          'A cancellation clause works best when the deposit has a clear purpose. Instead of only saying that a deposit is due, explain that it reserves the project window, covers kickoff administration, and allows the freelancer to decline or delay other work.',
          'That framing helps clients understand why the payment is collected before work starts. It also makes the cancellation conversation less personal because the agreement already explains what the upfront payment is for.',
        ],
      },
      {
        heading: 'Define refund rules before the client pays',
        body: [
          'Refund language should be plain and visible before the payment link is sent. If a deposit becomes nonrefundable after booking, after kickoff, or after a certain date, say that directly. If part of the deposit may be credited to a future project, explain the time limit and conditions.',
          'Avoid vague phrases like "subject to approval" unless you are prepared to explain the approval standard. A clearer clause might say that work already performed, reserved production time, third-party costs, and completed milestones are not refundable.',
        ],
      },
      {
        heading: 'Separate cancellation from client delays',
        body: [
          'Many freelance projects do not formally cancel. They stall because a client misses feedback, sends assets late, or pauses internal approval. Your agreement should explain how long you will hold the schedule open and what happens when the client is silent.',
          'For example, you can state that missed feedback may move the delivery date, that a paused project can be rescheduled based on availability, and that restarting after a long delay may require a new milestone payment or updated scope.',
        ],
      },
      {
        heading: 'Tie final delivery to cleared payment',
        body: [
          'Cancellation terms should connect to your delivery terms. If the client cancels after partial work is complete, your contract should say which drafts, source files, exports, licenses, or access credentials are delivered only after the approved balance is paid.',
          'This is especially important for creative, development, and event work where the freelancer may have real costs before the final handoff. The goal is not to surprise the client. The goal is to make payment and delivery expectations obvious from the start.',
        ],
      },
      {
        heading: 'Send the clause with the payment link',
        body: [
          'The safest time to communicate cancellation terms is before the client signs and pays. Put the cancellation rule, deposit amount, payment due date, scope, revision limits, and milestone schedule in the same client-ready agreement.',
          'MicroFreelanceHub helps freelancers package those terms with a secure client payment link. It is software for clearer payment workflows, not a law firm, so freelancers with unusual risk or local compliance questions should ask a qualified professional.',
        ],
      },
    ],
  },
  {
    slug: 'freelance-final-payment-before-delivery',
    title: 'How to Collect Final Payment Before Sending Freelance Deliverables',
    description:
      'A practical guide to setting final payment terms, client approval checkpoints, and delivery rules so freelancers get paid before releasing final files or access.',
    publishedAt: '2026-07-24',
    category: 'Final Delivery Payments',
    keywords: [
      'freelance final payment before delivery',
      'get paid before sending final files',
      'freelance delivery payment terms',
      'client approval before final payment',
      'secure client payment link',
      'freelance source file payment',
    ],
    aiSummary:
      'Freelancers should define final payment terms before work starts, use a client approval checkpoint, and release final files, source assets, launch access, or credentials only after the approved balance is paid.',
    ctaHref: '/create?template=webflow-developer-milestone-payment-agreement',
    ctaLabel: 'Customize a final payment agreement',
    relatedLinks: [
      {
        label: 'Create final payment and delivery terms',
        href: '/create?template=webflow-developer-milestone-payment-agreement',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'How to Handle Scope Creep With Change Requests and Payment Links',
        href: '/articles/freelance-scope-creep-change-request-payment-link',
      },
      {
        label: 'Freelance Cancellation Clauses: How to Protect Deposits Before Work Starts',
        href: '/articles/freelance-cancellation-clause-deposit-before-work-starts',
      },
      {
        label: 'Webflow Developer Milestone Payment Agreement',
        href: '/templates/webflow-developer-milestone-payment-agreement',
      },
      {
        label: 'Freelance Video Editor Deposit Agreement',
        href: '/templates/freelance-video-editor-deposit-agreement-template',
      },
    ],
    sections: [
      {
        heading: 'Make final payment a delivery rule, not a surprise',
        body: [
          'The best time to protect final payment is before the project starts. Your agreement should say when the final balance is due, what counts as client approval, and which deliverables are released only after payment clears.',
          'This matters for designers, developers, editors, writers, consultants, and any freelancer who hands over usable assets at the end. If the client learns about the payment rule only after the work is finished, the conversation can feel tense even when the rule is reasonable.',
        ],
      },
      {
        heading: 'Define what the client can review before paying',
        body: [
          'Clients need enough visibility to approve the work without receiving everything that lets them use, publish, or transfer the final product. That might mean a watermarked preview, staging link, screen recording, read-only document, low-resolution export, or guided review call.',
          'The agreement should explain the review format and the response window. For example, the client may have five business days to approve the final draft or request included revisions. After approval, the final payment is due before clean exports, source files, production access, or launch support are released.',
        ],
      },
      {
        heading: 'Be specific about final deliverables',
        body: [
          'Final delivery terms should name the assets instead of relying on a vague phrase like "all files." List the actual handoff items: source files, edited exports, design files, website credentials, published pages, ad account access, documentation, licenses, or archive files.',
          'Specific deliverables prevent arguments about whether something was included. They also help the client understand what the final payment unlocks and why the balance is tied to delivery.',
        ],
      },
      {
        heading: 'Connect late payment to the project timeline',
        body: [
          'Your contract should explain what happens if the final payment is late. A simple version can say that delivery, launch, source file release, or post-launch support is paused until the approved balance is paid.',
          'Keep the tone operational. You are following the workflow both sides agreed to. If the project has a launch date, event date, ad campaign, or publishing deadline, make it clear that payment delays may move the delivery schedule.',
        ],
      },
      {
        heading: 'Use a single approval and payment link',
        body: [
          'Final payment gets messy when approval notes, invoice links, and delivery promises are scattered across separate messages. A cleaner process is one agreement that shows the scope, included revisions, approval checkpoint, final balance, and secure payment link.',
          'MicroFreelanceHub helps freelancers package that workflow into a client-ready link. It is software for clearer payment and delivery expectations, not a law firm, so freelancers with unusual risk or local compliance questions should get qualified advice.',
        ],
      },
    ],
  },
  {
    slug: 'freelance-monthly-retainer-payment-upfront',
    title: 'How to Structure a Freelance Monthly Retainer So You Get Paid Upfront',
    description:
      'A practical guide to monthly freelance retainers, advance billing, unused time rules, scope boundaries, and secure payment links before recurring work begins.',
    publishedAt: '2026-07-25',
    category: 'Retainer Payments',
    keywords: [
      'freelance monthly retainer payment upfront',
      'retainer agreement for freelancers',
      'advance billing freelance retainer',
      'monthly retainer payment terms',
      'secure client payment link',
      'freelance recurring payment agreement',
    ],
    aiSummary:
      'Freelancers should structure monthly retainers around advance payment, clear included services, usage limits, renewal dates, pause or cancellation rules, and a single agreement link the client can sign and pay before recurring work starts.',
    ctaHref: '/create?template=social-media-manager-monthly-retainer-payment-agreement',
    ctaLabel: 'Customize a monthly retainer agreement',
    relatedLinks: [
      {
        label: 'Create a retainer agreement and payment link',
        href: '/create?template=social-media-manager-monthly-retainer-payment-agreement',
      },
      {
        label: 'Social Media Manager Monthly Retainer Payment Agreement',
        href: '/templates/social-media-manager-monthly-retainer-payment-agreement',
      },
      {
        label: 'Google Ads Specialist Retainer Payment Agreement',
        href: '/templates/google-ads-specialist-retainer-payment-agreement',
      },
      {
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'Freelance Cancellation Clauses: How to Protect Deposits Before Work Starts',
        href: '/articles/freelance-cancellation-clause-deposit-before-work-starts',
      },
    ],
    sections: [
      {
        heading: 'Bill the retainer before the service month starts',
        body: [
          'A monthly retainer is easier to manage when payment happens before the work period begins. Instead of doing recurring work all month and hoping the invoice is paid later, the client pays to reserve your availability for the upcoming service window.',
          'Put the billing rule directly in the agreement: the monthly retainer is due before the first day of each service month, work begins after payment clears, and late payment may pause scheduled work until the account is current. That keeps the workflow operational instead of awkward.',
        ],
      },
      {
        heading: 'Define what the monthly fee includes',
        body: [
          'Retainers get messy when the client thinks the fee means unlimited access. Your agreement should list the included services, expected response times, review calls, reports, edits, campaigns, consulting hours, or production tasks covered by the monthly payment.',
          'Be specific enough that both sides can tell whether a request fits the retainer. For example, a social media retainer might include a fixed number of posts, one monthly planning call, one reporting dashboard update, and two rounds of caption revisions.',
        ],
      },
      {
        heading: 'Set boundaries for unused time and extra requests',
        body: [
          'Clients often ask whether unused time rolls over. Decide that before the agreement is sent. Some freelancers allow limited rollover for one month, while others state that unused time expires because the retainer reserves availability whether or not the client uses every slot.',
          'Extra requests should have their own payment rule. If the client needs rush work, additional deliverables, weekend support, a new channel, or strategy outside the included scope, send a written change request and collect payment before the added work begins.',
        ],
      },
      {
        heading: 'Use renewal and cancellation terms that protect the schedule',
        body: [
          'A retainer agreement should explain when the retainer renews, how much notice either side needs to pause or end the arrangement, and what happens to work already scheduled for the current paid period. Plain cancellation terms reduce last-minute confusion.',
          'For many freelancers, a simple structure works well: the client pays monthly in advance, either side can cancel before the next renewal date with written notice, and cancellation does not refund work already performed, reserved service time, or approved third-party costs.',
        ],
      },
      {
        heading: 'Send one link for agreement, signature, and payment',
        body: [
          'Recurring work should not start from a loose email thread. Send the client one link that contains the retainer scope, monthly fee, renewal date, unused time rule, cancellation terms, signature step, and secure payment link.',
          'MicroFreelanceHub helps freelancers package that retainer workflow without presenting itself as legal advice. The goal is to make payment timing and service boundaries clear before the client starts relying on your monthly availability.',
        ],
      },
    ],
  },
  {
    slug: 'freelance-client-approval-before-payment-link',
    title: 'Client Approval Before Payment Links: A Freelancer Workflow That Gets You Paid',
    description:
      'A practical freelancer workflow for turning client approval into a signed agreement, clear payment terms, and a secure payment link before work continues or final delivery happens.',
    publishedAt: '2026-07-26',
    category: 'Client Approvals',
    keywords: [
      'client approval before payment link',
      'freelance client approval workflow',
      'freelance payment link after approval',
      'get paid before continuing work',
      'freelance approval and payment terms',
      'secure client payment link',
    ],
    aiSummary:
      'Freelancers should turn client approval into a documented payment checkpoint: confirm what the client approved, state what happens next, send one agreement and secure payment link, and continue work or release final deliverables only after the required payment clears.',
    ctaHref: '/create?template=mobile-app-designer-milestone-approval-template',
    ctaLabel: 'Customize an approval and payment agreement',
    relatedLinks: [
      {
        label: 'Create an approval and payment link',
        href: '/create?template=mobile-app-designer-milestone-approval-template',
      },
      {
        label: 'Mobile App Designer Milestone Approval Template',
        href: '/templates/mobile-app-designer-milestone-approval-template',
      },
      {
        label: 'Webflow Developer Milestone Payment Agreement',
        href: '/templates/webflow-developer-milestone-payment-agreement',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
      {
        label: 'How to Handle Scope Creep With Change Requests and Payment Links',
        href: '/articles/freelance-scope-creep-change-request-payment-link',
      },
    ],
    sections: [
      {
        heading: 'Treat approval as a payment checkpoint',
        body: [
          'Client approval should do more than move a project forward emotionally. It should mark a clear business checkpoint: the client has reviewed a defined deliverable, accepted the current phase, and knows what payment is due before the next step happens.',
          'This is useful in the middle of a project and at final delivery. A freelancer can say, "Once you approve this milestone, I will send the payment link for the next phase. Work resumes after payment clears." That keeps the payment request tied to a specific approval instead of a vague invoice.',
        ],
      },
      {
        heading: 'Write down exactly what was approved',
        body: [
          'Approval language should name the asset, version, date, and decision. For example: "Client approves the homepage wireframe dated July 26, including the navigation structure, hero section, and lead form placement." That is much stronger than relying on a short chat message that says "looks good."',
          'The record does not need to be complicated. It can live inside the agreement, a milestone note, or a client approval field. The goal is to make it obvious which work is approved, which revisions are still included, and which new requests would need a paid change request.',
        ],
      },
      {
        heading: 'Connect the approval to the next payment',
        body: [
          'A good approval workflow tells the client what happens next. After approval, payment might be due before design begins, before development starts, before final files are exported, or before production access is handed over.',
          'Use plain terms: "Payment 2 is due after prototype approval and before build work begins." Or: "Final payment is due after final preview approval and before clean exports, source files, or launch access are released." Specific timing prevents the payment link from feeling random.',
        ],
      },
      {
        heading: 'Keep approvals, scope, and payment in one link',
        body: [
          'The workflow gets messy when approval sits in email, scope sits in a proposal, and the payment link sits in a separate invoice. Clients miss steps, freelancers lose context, and nobody is sure which version was approved.',
          'A cleaner process is one client-ready link that includes the scope, milestone, approval wording, revision limit, amount due, and secure payment link. The client can review the exact terms and take the next step without searching through old messages.',
        ],
      },
      {
        heading: 'Use calm language when payment is required',
        body: [
          'You do not need to make the payment checkpoint sound confrontational. Try: "Thanks for approving the prototype. The next project step is the build phase, and the milestone payment is due before that work begins. Here is the agreement and payment link for approval."',
          'That wording is direct, professional, and easy for a client to act on. MicroFreelanceHub helps freelancers package approval steps and payment terms into one workflow, but it is software for clearer payment operations, not legal advice.',
        ],
      },
    ],
  },
  {
    slug: 'freelance-payment-schedule-upfront-milestones-final',
    title: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
    description:
      'A practical guide to freelance payment schedules that combine an upfront payment, milestone checkpoints, client approvals, and final payment before delivery.',
    publishedAt: '2026-07-27',
    category: 'Payment Schedules',
    keywords: [
      'freelance payment schedule',
      'upfront milestone final payment',
      'freelance payment terms template',
      'client approval payment schedule',
      'payment schedule agreement for freelancers',
      'get paid before delivery',
    ],
    aiSummary:
      'A strong freelance payment schedule explains what is due upfront, which milestone payments are tied to client approvals, when final payment is required, and what pauses if payment is late.',
    ctaHref: '/create?template=landing-page-designer-payment-schedule-agreement',
    ctaLabel: 'Customize a payment schedule agreement',
    relatedLinks: [
      {
        label: 'Create a payment schedule and client payment link',
        href: '/create?template=landing-page-designer-payment-schedule-agreement',
      },
      {
        label: 'Landing Page Designer Payment Schedule Agreement',
        href: '/templates/landing-page-designer-payment-schedule-agreement',
      },
      {
        label: 'Website Speed Optimization Consultant Payment Schedule Agreement',
        href: '/templates/website-speed-optimization-consultant-payment-schedule-agreement',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
    ],
    sections: [
      {
        heading: 'Start with the project moments that create risk',
        body: [
          'A freelance payment schedule should follow the real shape of the project. Start by naming the moments where you take on cost, reserve time, create a reviewable asset, or hand over something the client can use.',
          'For most projects, that means an upfront payment before work begins, one or more milestone payments after review points, and a final payment before clean files, launch access, source files, or publishing-ready deliverables are released.',
        ],
      },
      {
        heading: 'Use an upfront payment to reserve the project slot',
        body: [
          'The first payment should not be framed as a random invoice. It reserves time on your schedule, confirms that the client accepts the scope, and gives you a clear start signal before you begin unpaid planning or production work.',
          'Plain wording helps: "The upfront payment is due with the signed agreement and must clear before project work begins." You can also explain what the payment covers, whether it applies to the project total, and how cancellation affects work already scheduled or performed.',
        ],
      },
      {
        heading: 'Tie milestone payments to approvals, not vague dates',
        body: [
          'Calendar dates can be useful, but milestone payments are clearer when they are tied to client decisions. Instead of writing "second payment due in two weeks," write "second payment is due after homepage design approval and before development begins."',
          'That structure gives the client a fair review step and gives you a payment checkpoint before the next block of work. It also makes scope creep easier to spot, because approved milestones can be compared against later requests.',
        ],
      },
      {
        heading: 'Say what happens if a payment is late',
        body: [
          'A payment schedule is incomplete if it only lists amounts. It should also explain what pauses when a payment is late: new work, revisions, delivery, launch support, publishing access, or transfer of final files.',
          'Keep the language operational and professional. For example: "If a scheduled payment is late, project work and delivery timelines may pause until the balance is paid." MicroFreelanceHub provides software workflows and templates, not legal advice, so unusual payment risk should be reviewed with a qualified professional.',
        ],
      },
      {
        heading: 'Collect final payment before usable delivery',
        body: [
          'Final payment terms should be specific about what the client can review before paying and what is released afterward. A preview, staging link, watermarked export, or limited review file can support approval without giving away everything before the balance is paid.',
          'Your agreement can say that final payment is due after final preview approval and before clean exports, source files, admin credentials, launch access, or production-ready files are delivered. That removes ambiguity at the most sensitive point in the project.',
        ],
      },
      {
        heading: 'Send one agreement, approval, and payment link',
        body: [
          'Payment schedules break down when the scope is in a proposal, approvals are in chat, and payment links are sent separately. A cleaner workflow is one client-ready link that shows the payment amounts, due triggers, approval checkpoints, pause rules, and secure payment step.',
          'That is the workflow MicroFreelanceHub is built for: turn the payment schedule into an agreement the client can review, sign, and pay from before each risky phase begins.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-revision-limit-payment-terms',
    title: 'How to Set Freelance Revision Limits That Protect Your Payment Terms',
    description:
      'A practical guide to writing revision limits, approval checkpoints, and paid change request terms so freelancers avoid unpaid edits and get paid before extra work begins.',
    publishedAt: '2026-07-28',
    category: 'Revision Limits',
    keywords: [
      'freelance revision limits',
      'paid revisions for freelancers',
      'freelance revision clause',
      'client approval payment terms',
      'change request payment link',
      'get paid for extra edits',
    ],
    aiSummary:
      'Freelancers should set revision limits by defining what counts as a revision, tying each review round to a client approval checkpoint, and requiring written approval plus payment before extra edits or new scope begin.',
    ctaHref: '/create?template=mobile-app-designer-milestone-approval-template',
    ctaLabel: 'Customize a revision and approval agreement',
    relatedLinks: [
      {
        label: 'Create revision limits and payment terms',
        href: '/create?template=mobile-app-designer-milestone-approval-template',
      },
      {
        label: 'Mobile App Designer Milestone Approval Template',
        href: '/templates/mobile-app-designer-milestone-approval-template',
      },
      {
        label: 'How to Handle Scope Creep With Change Requests and Payment Links',
        href: '/articles/freelance-scope-creep-change-request-payment-link',
      },
      {
        label: 'Client Approval Before Payment Links: A Freelancer Workflow That Gets You Paid',
        href: '/articles/freelance-client-approval-before-payment-link',
      },
      {
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
      {
        label: 'Webflow Developer Milestone Payment Agreement',
        href: '/templates/webflow-developer-milestone-payment-agreement',
      },
    ],
    sections: [
      {
        heading: 'Define revisions before the client sees the first draft',
        body: [
          'Revision problems usually start because nobody defines the word revision. One client may think a revision is a typo fix, while another thinks it includes a new layout, a new audience, a different format, or a full creative direction change.',
          'Your agreement should explain what is included before the first draft is delivered. A simple version might say that a revision means reasonable edits to the approved direction, while new concepts, new pages, new deliverables, new integrations, or changes after approval require a paid change request.',
        ],
      },
      {
        heading: 'Give each review round a clear purpose',
        body: [
          'Revision limits feel fairer when each round has a job. Round one might focus on structure and direction. Round two might handle refinements. Final review might be limited to small corrections before delivery.',
          'That structure helps the client give better feedback and helps the freelancer avoid doing the same work repeatedly. Instead of promising unlimited changes until the client is happy, promise a defined review process with specific included rounds and a payment rule for anything beyond them.',
        ],
      },
      {
        heading: 'Tie revisions to written approval checkpoints',
        body: [
          'Approval checkpoints are what make revision limits easier to manage in day-to-day project work. When the client approves a wireframe, rough cut, outline, homepage design, automation map, or draft, the agreement should say that later changes to that approved phase may affect price and timeline.',
          'Keep the record plain: name the deliverable, version, approval date, included next step, and payment due before work continues. That gives both sides a shared reference if the client later asks to reopen a completed phase.',
        ],
      },
      {
        heading: 'Price extra edits before doing them',
        body: [
          'The safest habit is to pause before completing extra edits. Confirm that the request is outside the included revision rounds, describe the added work, quote the added price, and send a payment link before starting the new round.',
          'For small requests, full upfront payment is usually simplest. For larger changes, use a milestone payment tied to the new review point. Either way, the client should approve the added cost and timing before the freelancer spends more unpaid time.',
        ],
      },
      {
        heading: 'Use client-friendly wording',
        body: [
          'Revision language does not need to sound defensive. Try: "This project includes two revision rounds on the approved direction. Additional edits, new concepts, or changes to approved work can be added through a paid change request before that extra work begins."',
          'That sentence gives the client a clear expectation without making the relationship tense. It also gives the freelancer a professional script when the third or fourth round appears: the work is possible, but it needs approval and payment first.',
        ],
      },
      {
        heading: 'Put scope, approvals, and payment in one link',
        body: [
          'Revision limits are hard to manage when the scope is in a proposal, approvals are in chat, and payment links are sent separately. A cleaner workflow is one client-ready agreement that shows included rounds, approval checkpoints, change request rules, payment timing, and final delivery terms.',
          'MicroFreelanceHub helps freelancers package that workflow into a signed agreement and secure client payment link. It is software for clearer freelance payment operations, not a law firm, so unusual legal or compliance questions should go to a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-stripe-payment-link-contract-terms',
    title: 'What Freelancers Should Put in a Contract Before Sending a Stripe Payment Link',
    description:
      'A practical guide to pairing Stripe payment links with freelance contract terms for deposits, approval checkpoints, payment timing, scope changes, and final delivery.',
    publishedAt: '2026-07-29',
    category: 'Payment Links',
    keywords: [
      'freelance Stripe payment link contract',
      'Stripe payment link for freelancers',
      'freelance payment link terms',
      'deposit payment link before work',
      'client payment approval workflow',
      'get paid before delivery',
    ],
    aiSummary:
      'Before sending a Stripe payment link, freelancers should put the payment amount, due trigger, covered scope, approval checkpoint, change request rule, and delivery condition in a written agreement so the payment is tied to clear client expectations.',
    ctaHref: '/create?template=email-marketing-automation-consultant-upfront-payment-contract',
    ctaLabel: 'Create a contract with a payment link',
    relatedLinks: [
      {
        label: 'Create a contract and client payment link',
        href: '/create?template=email-marketing-automation-consultant-upfront-payment-contract',
      },
      {
        label: 'Email Marketing Automation Consultant Upfront Payment Contract',
        href: '/templates/email-marketing-automation-consultant-upfront-payment-contract',
      },
      {
        label: 'Shopify Store Setup Specialist Deposit and Approval Agreement',
        href: '/templates/shopify-store-setup-specialist-deposit-and-approval-agreement',
      },
      {
        label: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
        href: '/articles/freelance-payment-schedule-upfront-milestones-final',
      },
      {
        label: 'Client Approval Before Payment Links: A Freelancer Workflow That Gets You Paid',
        href: '/articles/freelance-client-approval-before-payment-link',
      },
      {
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
    ],
    sections: [
      {
        heading: 'Do not let the payment link replace the agreement',
        body: [
          'A Stripe payment link is excellent for collecting money quickly, but it is not the full project record by itself. The client still needs to know what they are approving, what the payment covers, when work starts, and what happens if the project changes.',
          'Treat the payment link as one step inside a client-ready agreement. The agreement should explain the scope, deposit or milestone amount, payment timing, revision limits, cancellation terms, and delivery rules before the client pays.',
        ],
      },
      {
        heading: 'Name the payment trigger',
        body: [
          'Every payment link should answer one simple question: why is this payment due now? For an upfront payment, the trigger might be signing the agreement and reserving the project start date. For a milestone payment, it might be approval of a wireframe, automation map, rough cut, or setup checklist.',
          'Plain contract language helps the payment feel normal: "The upfront payment is due with the signed agreement and must clear before kickoff work begins." Or: "The next milestone payment is due after client approval of the setup plan and before implementation begins."',
        ],
      },
      {
        heading: 'State what the payment covers',
        body: [
          'Clients are less likely to dispute a payment when the agreement says exactly what is included. List the deliverables, included review rounds, timeline assumptions, client responsibilities, and any third-party costs or platform access the freelancer needs before starting.',
          'This matters for payment links because the checkout step is fast. If the agreement is vague, a client can pay quickly and still misunderstand the scope. A clear scope turns the payment into a confirmed project step instead of a loose transaction.',
        ],
      },
      {
        heading: 'Connect approvals to the next payment link',
        body: [
          'For longer projects, do not wait until the end to ask for money. Build approval checkpoints into the agreement, then send the next payment link only after the client approves the current phase and before the next phase begins.',
          'For example, a Shopify setup project might collect a deposit before kickoff, a milestone payment after homepage and product structure approval, and final payment before launch access or handoff documentation is delivered. Each payment is tied to a clear decision point.',
        ],
      },
      {
        heading: 'Add change request and revision rules',
        body: [
          'A payment link cannot protect you from unpaid extra work unless the contract explains what counts as extra. Include a revision limit, a rule for changes after approval, and a requirement that added work must be approved and paid before the freelancer begins it.',
          'Client-friendly wording works well: "Requests outside the approved scope or included revision rounds can be added through a written change request. Additional work begins after the client approves the change and completes the related payment link."',
        ],
      },
      {
        heading: 'Tie final delivery to cleared payment',
        body: [
          'Final payment terms should say what the client can review before paying and what is released after payment clears. A freelancer might provide a preview, staging link, watermarked export, or review file before final payment, then release clean files, source files, production access, or launch support afterward.',
          'MicroFreelanceHub helps freelancers package the contract, signature step, and secure client payment link in one workflow. It is software for clearer freelance payment operations, not legal advice, so unusual compliance or contract questions should go to a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-late-payment-pause-work-contract-clause',
    title: 'How to Pause Freelance Work When a Client Misses a Payment',
    description:
      'A practical freelancer guide to late payment pause clauses, milestone payment timing, client notices, and protecting final delivery without escalating too fast.',
    publishedAt: '2026-07-30',
    category: 'Late Payments',
    keywords: [
      'freelance late payment clause',
      'pause work for late payment',
      'freelance payment schedule',
      'milestone payment before next phase',
      'client payment reminder',
      'get paid before delivery',
    ],
    aiSummary:
      'Freelancers can pause work for a missed payment by putting the pause rule in the contract, tying each payment to a clear milestone or delivery step, giving the client a written notice, and restarting only after payment clears.',
    ctaHref: '/create?template=website-speed-optimization-consultant-payment-schedule-agreement',
    ctaLabel: 'Create a payment schedule agreement',
    relatedLinks: [
      {
        label: 'Create a contract with payment pause terms',
        href: '/create?template=website-speed-optimization-consultant-payment-schedule-agreement',
      },
      {
        label: 'Website Speed Optimization Consultant Payment Schedule Agreement',
        href: '/templates/website-speed-optimization-consultant-payment-schedule-agreement',
      },
      {
        label: 'Webflow Designer Payment Schedule Agreement Template',
        href: '/templates/webflow-designer-payment-schedule-agreement-template',
      },
      {
        label: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
        href: '/articles/freelance-payment-schedule-upfront-milestones-final',
      },
      {
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
      {
        label: 'What Freelancers Should Put in a Contract Before Sending a Stripe Payment Link',
        href: '/articles/freelance-stripe-payment-link-contract-terms',
      },
    ],
    sections: [
      {
        heading: 'Make the pause rule visible before work starts',
        body: [
          'A freelancer should not invent a payment pause policy after an invoice is already late. Put the rule in the agreement before kickoff so the client knows that unpaid balances can pause new work, revisions, delivery, launch support, or file handoff.',
          'The goal is not to threaten the client. The goal is to make payment timing part of the project workflow. When the agreement says what happens next, you can point to the shared process instead of turning a late invoice into a personal argument.',
        ],
      },
      {
        heading: 'Tie payment deadlines to real project gates',
        body: [
          'Late payment language works best when the payment itself is tied to a clear gate. For example, the upfront payment clears before kickoff, the second payment clears after draft approval and before implementation, and the final payment clears before clean files or production access are released.',
          'That structure gives the client context for why the payment matters. It also gives you a clean operational boundary: you are not stopping randomly, you are waiting at the agreed gate before taking on the next block of work or risk.',
        ],
      },
      {
        heading: 'Use calm written notice',
        body: [
          'When a payment is late, send a short written notice that names the invoice or payment link, the amount due, the missed due date, and the project step that is paused. Avoid long explanations or emotional language.',
          'A simple version is: "The milestone payment due after design approval has not cleared yet, so implementation work is paused under the payment schedule in our agreement. Once payment is complete, I will restart the next phase and confirm the updated timeline."',
        ],
      },
      {
        heading: 'Protect timelines without overpromising',
        body: [
          'A late payment usually affects the schedule. Your agreement should say that timelines may shift when work is paused for unpaid balances, late approvals, or delayed client materials. That keeps you from having to absorb the delay with rush work later.',
          'When the client pays, confirm the new start date or delivery estimate in writing. If the delay affects a launch date, booked production slot, subcontractor cost, or third-party deadline, document that impact before restarting.',
        ],
      },
      {
        heading: 'Separate reminders from change requests',
        body: [
          'A missed payment is different from a scope change. Do not bury unpaid balances inside new requests or extra revisions. Clear the scheduled payment first, then price any new work through a separate written change request and payment link.',
          'This keeps the project record clean. The client can see what was already due under the original agreement, what changed later, and what payment is required before the added work begins.',
        ],
      },
      {
        heading: 'Keep final delivery tied to cleared payment',
        body: [
          'The riskiest late payment moment is often the end of the project. Let the client review an appropriate preview, staging link, watermarked export, checklist, or approval file, but state that clean deliverables, source files, launch credentials, or production handoff happen after final payment clears.',
          'MicroFreelanceHub helps freelancers turn that policy into a client-ready contract, approval record, and secure payment link. It is software for freelance payment workflows, not legal advice, so unusual disputes or compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-paid-discovery-first-milestone-payment',
    title: 'How to Use Paid Discovery as the First Freelance Milestone',
    description:
      'A practical guide to charging for freelance discovery, turning strategy work into a paid first milestone, and collecting approval plus payment before implementation begins.',
    publishedAt: '2026-07-31',
    category: 'Paid Discovery',
    keywords: [
      'paid discovery for freelancers',
      'freelance discovery payment',
      'first milestone payment',
      'upfront payment before implementation',
      'freelance project scoping fee',
      'client approval before build phase',
    ],
    aiSummary:
      'Freelancers can make discovery a paid first milestone by defining the discovery deliverable, collecting an upfront payment before strategy work starts, getting client approval on the plan, and requiring the next payment before implementation begins.',
    ctaHref: '/create?template=api-integration-developer-deposit-and-approval-agreement',
    ctaLabel: 'Create a paid discovery agreement',
    relatedLinks: [
      {
        label: 'Create a paid discovery agreement and payment link',
        href: '/create?template=api-integration-developer-deposit-and-approval-agreement',
      },
      {
        label: 'API Integration Developer Deposit and Approval Agreement',
        href: '/templates/api-integration-developer-deposit-and-approval-agreement',
      },
      {
        label: 'AI Agent Builder Milestone Payment Agreement',
        href: '/templates/ai-agent-builder-milestone-payment-agreement',
      },
      {
        label: 'CRM Implementation Consultant Milestone Payment Agreement',
        href: '/templates/crm-implementation-consultant-milestone-payment-agreement',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'How to Handle Scope Creep With Change Requests and Payment Links',
        href: '/articles/freelance-scope-creep-change-request-payment-link',
      },
    ],
    sections: [
      {
        heading: 'Treat discovery as real work',
        body: [
          'Discovery is often where the hardest freelance thinking happens: understanding goals, auditing the current setup, mapping constraints, estimating effort, and turning vague requests into a project plan. If that work is unpaid, the freelancer carries risk before the client has committed to a clear scope.',
          'A paid discovery milestone turns that early strategy into a defined service. The client pays for a useful output, such as an implementation plan, technical audit, automation map, creative brief, content outline, or prioritized scope. The freelancer gets paid before spending hours diagnosing the project.',
        ],
      },
      {
        heading: 'Define the discovery deliverable',
        body: [
          'Paid discovery should not sound like a vague consultation fee. Name the exact output the client receives and the questions it will answer. For an API integration, that might be a systems map, required endpoints, risk notes, and a build estimate. For an AI agent project, it might be a workflow map, data access checklist, and milestone plan.',
          'The agreement should also say what discovery does not include. For example, discovery may include planning and recommendations but not production build work, final designs, launch support, or third-party configuration unless those items are listed separately.',
        ],
      },
      {
        heading: 'Collect the first payment before discovery starts',
        body: [
          'The first milestone payment should be due with the signed agreement and should clear before discovery work begins. That makes the client commitment clear and avoids the common pattern where a freelancer gives away the plan, then watches the client delay or take the plan elsewhere.',
          'Client-friendly wording can be simple: "Discovery begins after the agreement is signed and the discovery payment clears. The discovery deliverable will be used to confirm scope, timeline, and pricing before implementation begins."',
        ],
      },
      {
        heading: 'Use approval to separate planning from implementation',
        body: [
          'The end of discovery should create a clean decision point. The client reviews the discovery deliverable, asks included clarification questions, and approves the implementation plan or decides not to continue. Either way, the discovery work remains paid because it was a separate milestone.',
          'If the client wants to move forward, the next payment should be tied to the next phase. For example, implementation begins after the client approves the discovery plan and completes the kickoff or build-phase payment link.',
        ],
      },
      {
        heading: 'Prevent scope creep before the build phase',
        body: [
          'Paid discovery is especially useful when the original request is broad: "set up our CRM," "build an automation," "fix our funnel," or "connect these tools." The discovery milestone gives both sides a chance to learn what the work really requires before promising a fixed implementation scope.',
          'Your agreement should say that new requirements found during discovery may change price, timeline, or deliverables for later phases. That protects the freelancer from absorbing hidden complexity and gives the client a clearer basis for approving the next step.',
        ],
      },
      {
        heading: 'Send one agreement and payment link',
        body: [
          'A strong paid discovery workflow has one client-ready link: the discovery scope, payment amount, approval process, next-phase terms, and secure client payment step. The client should not have to piece together the commitment from a proposal, chat thread, and separate invoice.',
          'MicroFreelanceHub helps freelancers package paid discovery, milestone approvals, and payment links into a clearer kickoff process. It is software for freelance payment workflows, not legal advice, so unusual contract or compliance questions should go to a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-rush-fee-payment-before-expedited-work',
    title: 'How to Charge a Freelance Rush Fee Before Expedited Work Starts',
    description:
      'A practical guide to pricing rush work, getting client approval, and collecting a rush fee or milestone payment before expedited freelance work begins.',
    publishedAt: '2026-08-01',
    category: 'Rush Fees',
    keywords: [
      'freelance rush fee',
      'rush work payment terms',
      'charge extra for expedited freelance work',
      'client approval for rush fee',
      'payment link before rush work',
      'freelance deadline surcharge',
    ],
    aiSummary:
      'Freelancers should charge a rush fee by confirming the compressed deadline, naming what normal work is being displaced, getting written approval, and collecting the extra payment before expedited work begins.',
    ctaHref: '/create?template=website-speed-optimization-consultant-payment-schedule-agreement',
    ctaLabel: 'Create rush work payment terms',
    relatedLinks: [
      {
        label: 'Create rush work terms and collect payment',
        href: '/create?template=website-speed-optimization-consultant-payment-schedule-agreement',
      },
      {
        label: 'Website Speed Optimization Consultant Payment Schedule Agreement',
        href: '/templates/website-speed-optimization-consultant-payment-schedule-agreement',
      },
      {
        label: 'How to Handle Scope Creep With Change Requests and Payment Links',
        href: '/articles/freelance-scope-creep-change-request-payment-link',
      },
      {
        label: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
        href: '/articles/freelance-payment-schedule-upfront-milestones-final',
      },
      {
        label: 'How to Pause Freelance Work When a Client Misses a Payment',
        href: '/articles/freelance-late-payment-pause-work-contract-clause',
      },
      {
        label: 'What Freelancers Should Put in a Contract Before Sending a Stripe Payment Link',
        href: '/articles/freelance-stripe-payment-link-contract-terms',
      },
    ],
    sections: [
      {
        heading: 'Treat rush work as a scope change',
        body: [
          'A rush fee is not a penalty for being difficult. It is the price of changing the work conditions after the original schedule was set. Expedited work can require evening hours, rescheduled client work, extra testing pressure, faster vendor coordination, or a tighter review window.',
          'That is why rush terms should be written like a change request. Name the original timeline, the requested deadline, the added fee, and what the client must approve before the faster schedule begins.',
        ],
      },
      {
        heading: 'Explain what the rush fee covers',
        body: [
          'Clients are more likely to approve a rush fee when it is attached to a real operational tradeoff. Instead of saying "rush work costs extra," explain what changes: priority scheduling, compressed production time, same-day review, weekend availability, faster QA, or reordering existing milestones.',
          'Keep the language practical. For example: "The requested Friday delivery requires priority scheduling outside the original timeline. The rush fee covers the compressed production window and must be approved and paid before expedited work begins."',
        ],
      },
      {
        heading: 'Collect payment before the expedited window starts',
        body: [
          'The riskiest rush work happens when the freelancer starts immediately and plans to sort out payment later. By the time the deadline passes, the urgency belongs to the client but the payment risk belongs to the freelancer.',
          'A cleaner workflow is written approval plus a payment link before the rush window opens. If the rush fee is separate from the project balance, make that clear. If it moves the next milestone forward, say which amount must clear before work resumes on the accelerated timeline.',
        ],
      },
      {
        heading: 'Protect quality and review limits',
        body: [
          'A shorter deadline should not silently create unlimited revisions or lower acceptance standards. Rush terms should say which deliverables are included, how many review rounds fit inside the expedited schedule, and what happens if the client misses a required approval deadline.',
          'For launch, design, development, automation, and marketing work, it is also worth naming what cannot be compressed. Third-party approvals, ad platform reviews, app store review, domain propagation, client content delivery, or external vendor response times may sit outside the freelancer\'s control.',
        ],
      },
      {
        heading: 'Separate rush fees from late payment problems',
        body: [
          'A client should not be able to create urgency by delaying payment or approvals, then expect the freelancer to absorb the recovery time for free. If a milestone was paused because payment, feedback, or materials were late, the agreement should allow the schedule to shift.',
          'If the client still wants the original launch date after a delay, treat that as a new rush request. Confirm the revised deadline, the fee, and the payment requirement before moving the project back into priority mode.',
        ],
      },
      {
        heading: 'Send one clear rush approval link',
        body: [
          'The best rush workflow gives the client one place to review the revised deadline, added fee, included deliverables, approval timing, and secure payment step. That avoids scattered approvals across chat, invoices, and calendar notes.',
          'MicroFreelanceHub helps freelancers turn rush requests into written payment terms with a client-ready link. It is software for freelance agreements and payment workflows, not a law firm, so unusual legal or compliance questions should be reviewed by a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-client-delay-payment-schedule-pause-resume',
    title: 'How to Handle Client Delays Without Losing Your Freelance Payment Schedule',
    description:
      'A practical guide to writing client delay terms, pausing work when approvals or materials are late, and collecting the next payment before freelance work resumes.',
    publishedAt: '2026-08-02',
    category: 'Client Delays',
    keywords: [
      'freelance client delay clause',
      'client materials late payment schedule',
      'pause freelance work for late approval',
      'freelance project restart fee',
      'payment before work resumes',
      'client approval deadline contract',
    ],
    aiSummary:
      'Freelancers can protect their payment schedule from client delays by setting approval and materials deadlines, allowing the timeline to pause, documenting restart terms, and requiring any overdue or next milestone payment before work resumes.',
    ctaHref: '/create?template=saas-onboarding-consultant-client-approval-agreement',
    ctaLabel: 'Create client delay payment terms',
    relatedLinks: [
      {
        label: 'Create client approval terms and a payment link',
        href: '/create?template=saas-onboarding-consultant-client-approval-agreement',
      },
      {
        label: 'SaaS Onboarding Consultant Client Approval Agreement',
        href: '/templates/saas-onboarding-consultant-client-approval-agreement',
      },
      {
        label: 'GA4 Analytics Consultant Client Approval Agreement',
        href: '/templates/ga4-analytics-consultant-client-approval-agreement',
      },
      {
        label: 'How to Pause Freelance Work When a Client Misses a Payment',
        href: '/articles/freelance-late-payment-pause-work-contract-clause',
      },
      {
        label: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
        href: '/articles/freelance-payment-schedule-upfront-milestones-final',
      },
      {
        label: 'Client Approval Before Payment Links: A Freelancer Workflow That Gets You Paid',
        href: '/articles/freelance-client-approval-before-payment-link',
      },
    ],
    sections: [
      {
        heading: 'Name the client responsibilities',
        body: [
          'Client delays often start before anyone calls them delays. The freelancer is waiting on copy, logins, brand files, approvals, product details, stakeholder feedback, or access to a tool, but the contract only talks about the delivery date.',
          'A better agreement names the client inputs required for each phase. For example, discovery cannot start until access is provided, design cannot start until content is approved, and implementation cannot start until the milestone plan and payment are complete.',
        ],
      },
      {
        heading: 'Tie deadlines to received materials, not hope',
        body: [
          'A delivery promise should depend on the client providing what the freelancer needs on time. If a client sends content five business days late, the freelancer should not automatically lose five business days from the production window.',
          'Use plain timing language: "Project dates depend on timely client materials, feedback, approvals, and payments. If required items are late, the project timeline may shift by the delay period and any reasonable rescheduling time." That gives both sides a practical rule before the calendar gets tense.',
        ],
      },
      {
        heading: 'Pause work when approval or payment is missing',
        body: [
          'Pausing work is different from abandoning the project. It is a written status change that says the freelancer cannot keep spending production time until the client completes the required next step.',
          'The pause notice should say what is missing, what work is paused, what payment or approval is required, and how the schedule may change. Keeping this in writing reduces arguments later because the client can see exactly when the project stopped moving and why.',
        ],
      },
      {
        heading: 'Require payment before work resumes',
        body: [
          'If a milestone payment, retainer payment, or restart payment is due, collect it before reopening the work window. Otherwise the freelancer takes on the cost of catching up while the payment issue remains unresolved.',
          'For a simple delay, the next scheduled payment may be enough. For a long pause that forces re-planning, tool reactivation, team rescheduling, or repeated context review, the agreement can include a restart fee or updated milestone payment before work resumes.',
        ],
      },
      {
        heading: 'Protect final delivery from last-minute delays',
        body: [
          'Client delays near the end of a project can create pressure to hand over final files before payment is settled. The agreement should separate review access from final delivery. A client can review an appropriate preview, staging link, report, or approval file while final exports, credentials, source files, or launch handoff remain tied to cleared payment.',
          'This is especially important when the client delay created the rush. If late feedback creates a compressed launch window, confirm whether the timeline shifts or whether the client is approving rush terms and payment before expedited work starts.',
        ],
      },
      {
        heading: 'Send one pause-and-resume workflow',
        body: [
          'Client delay terms work best when they are not scattered across proposal notes, chat messages, and separate invoices. The client should have one agreement that explains responsibilities, approval deadlines, payment timing, pause rules, and the secure payment link needed to restart work.',
          'MicroFreelanceHub helps freelancers turn those rules into a client-ready agreement and payment workflow. It is software for freelance payment operations, not a law firm, so unusual cancellation, refund, or compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },


  {
    slug: 'freelance-acceptance-criteria-final-payment-before-handoff',
    title: 'How to Use Acceptance Criteria Before Final Freelance Payment',
    description:
      'A practical guide to defining acceptance criteria, getting client approval, and collecting final payment before freelancers hand over final files, credentials, or launch assets.',
    publishedAt: '2026-08-03',
    category: 'Final Delivery Payments',
    keywords: [
      'freelance acceptance criteria',
      'final payment before handoff',
      'client approval before final delivery',
      'freelance deliverable acceptance terms',
      'payment before source files',
      'freelance handoff payment link',
    ],
    aiSummary:
      'Freelancers should define acceptance criteria before work starts, use them during client review, and require written approval plus final payment before releasing final files, credentials, source assets, or launch handoff materials.',
    ctaHref: '/create?template=webflow-developer-milestone-payment-agreement',
    ctaLabel: 'Create final approval payment terms',
    relatedLinks: [
      {
        label: 'Create approval terms and a final payment link',
        href: '/create?template=webflow-developer-milestone-payment-agreement',
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
        label: 'How to Collect Final Payment Before Sending Freelance Deliverables',
        href: '/articles/freelance-final-payment-before-delivery',
      },
      {
        label: 'Client Approval Before Payment Links: A Freelancer Workflow That Gets You Paid',
        href: '/articles/freelance-client-approval-before-payment-link',
      },
      {
        label: 'How to Set Freelance Revision Limits That Protect Your Payment Terms',
        href: '/articles/freelance-revision-limit-payment-terms',
      },
    ],
    sections: [
      {
        heading: 'Define what done means before work starts',
        body: [
          'Final-payment disputes often happen because the freelancer and client are using different definitions of done. The freelancer may have delivered the agreed website, edit, automation, report, or design file, while the client keeps adding preferences that were never part of the original scope.',
          'Acceptance criteria solve that problem by turning done into a checklist. They should describe the deliverable, required formats, included pages or assets, performance targets when relevant, supported platforms, revision rounds, and the review method the client will use before final approval.',
        ],
      },
      {
        heading: 'Keep criteria observable and client-friendly',
        body: [
          'Strong acceptance criteria are specific enough to verify without sounding like dense legal language. For example: "The landing page is accepted when the approved copy and design are implemented, the contact form submits successfully, mobile layout is reviewed, and one included revision round is complete."',
          'Avoid vague promises like "client is fully satisfied" or "project is perfect." Those phrases create unlimited review risk. Use terms the client can inspect: pages, files, integrations, exports, test results, approval dates, and included fixes.',
        ],
      },
      {
        heading: 'Separate previews from final handoff',
        body: [
          'A client needs a fair way to review the work before paying the final balance, but that does not mean the freelancer has to release every final asset first. The agreement can allow previews, staging links, watermarked exports, screenshots, walkthrough videos, reports, or limited review access before final payment.',
          'Final handoff can then be tied to cleared payment. Depending on the project, that might mean source files, editable design files, production credentials, final exports, launch access, transfer documents, or publishing support are released after approval and final payment are complete.',
        ],
      },
      {
        heading: 'Use approval to close included revisions',
        body: [
          'Acceptance criteria should work together with revision limits. If the client has two included revision rounds, the contract should say what counts as a revision, how feedback is submitted, and when later requests become a paid change request instead of part of final approval.',
          'This keeps final review from becoming a new discovery phase. When the work meets the written criteria and included revisions are complete, the client can approve the deliverable and complete the final payment link before handoff.',
        ],
      },
      {
        heading: 'Set a review deadline and response rule',
        body: [
          'Final review also needs timing. Without a response deadline, a project can sit unpaid while the client waits for a stakeholder, changes priorities, or disappears after receiving a preview. A clear agreement says how long the client has to review and what happens if feedback is late.',
          'A practical clause can say that the client has a set number of business days to approve the deliverable or submit consolidated feedback tied to the acceptance criteria. If the client misses the deadline, the schedule may shift, work may pause, and any next payment or restart payment may be required before more work continues.',
        ],
      },
      {
        heading: 'Send one final approval workflow',
        body: [
          'The cleanest final-payment process gives the client one place to see the acceptance criteria, included revisions, preview method, final balance, and secure payment step. That is much easier to enforce than scattered notes across proposals, chats, invoices, and file links.',
          'MicroFreelanceHub helps freelancers package approval terms and payment links into a client-ready workflow. It is software for freelance contracts and payments, not a law firm, so unusual legal, refund, or compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-start-work-after-deposit-clears',
    title: 'When Should Freelancers Start Work After a Client Pays the Deposit?',
    description:
      'A practical guide to setting a clear freelance start date after the contract is signed, the deposit payment clears, and the client provides required kickoff materials.',
    publishedAt: '2026-08-04',
    category: 'Freelance Deposits',
    keywords: [
      'start work after deposit clears',
      'freelance deposit before kickoff',
      'client kickoff payment terms',
      'payment clears before work starts',
      'freelance project start date contract',
      'upfront payment workflow for freelancers',
    ],
    aiSummary:
      'Freelancers should start work only after the agreement is signed, the upfront deposit has cleared, and the client has provided the required kickoff materials, with the project start date tied to those completed steps instead of the first conversation.',
    ctaHref: '/create?template=freelance-video-editor-deposit-agreement-template',
    ctaLabel: 'Create deposit and kickoff terms',
    relatedLinks: [
      {
        label: 'Create a deposit agreement and payment link',
        href: '/create?template=freelance-video-editor-deposit-agreement-template',
      },
      {
        label: 'Freelance Video Editor Deposit Agreement',
        href: '/templates/freelance-video-editor-deposit-agreement-template',
      },
      {
        label: 'What Freelancers Should Put in a Contract Before Sending a Stripe Payment Link',
        href: '/articles/freelance-stripe-payment-link-contract-terms',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
      {
        label: 'How to Handle Client Delays Without Losing Your Freelance Payment Schedule',
        href: '/articles/freelance-client-delay-payment-schedule-pause-resume',
      },
      {
        label: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
        href: '/articles/freelance-payment-schedule-upfront-milestones-final',
      },
    ],
    sections: [
      {
        heading: 'Do not treat the sales call as the start date',
        body: [
          'A client may say yes on a call, but that does not mean the project has actually started. For a freelancer, the operational start should be tied to completed kickoff steps: signed agreement, cleared deposit, and the client materials needed for the first phase.',
          'This matters because early work can look small from the client side. Reading briefs, setting up files, booking production time, testing access, or sketching initial ideas all use real capacity. If those steps happen before payment is complete, the freelancer has already taken on risk.',
        ],
      },
      {
        heading: 'Write the start rule into the agreement',
        body: [
          'The cleanest language is direct: "Work begins after this agreement is signed, the upfront deposit has cleared, and the client has provided the required kickoff materials." That sentence removes the awkward question of whether a casual approval, verbal yes, or partial information starts the clock.',
          'The agreement should also say what counts as kickoff materials. Depending on the project, that might include brand assets, logins, content, stakeholder contacts, product notes, source files, scheduling availability, or approval of the first milestone plan.',
        ],
      },
      {
        heading: 'Let the timeline move when payment or materials are late',
        body: [
          'A delivery date should not stay fixed if the client signs late, pays late, or sends required inputs late. The freelancer should not lose production time because the client took extra days to complete the start requirements.',
          'Use timing that adjusts automatically: the estimated schedule begins when all kickoff requirements are complete, and delays in payment, approvals, access, or materials may shift milestones by the delay period plus reasonable rescheduling time. That keeps the calendar attached to reality.',
        ],
      },
      {
        heading: 'Separate deposit payment from final approval',
        body: [
          'A deposit is not the same as final acceptance. It reserves the freelancer\'s availability and funds the first phase of work. Later approval steps, revisions, milestone payments, and final handoff terms still need their own rules.',
          'That separation helps clients understand the whole payment path. They are not just sending money into a vague project. They are completing the start step, then moving through defined milestones, review windows, and final payment before final delivery.',
        ],
      },
      {
        heading: 'Send one kickoff link instead of separate reminders',
        body: [
          'Kickoff gets messy when the contract is in one email, the payment request is somewhere else, and the materials checklist lives in a chat thread. A better workflow gives the client one place to sign, pay the deposit, and see what must be provided before the start date is confirmed.',
          'MicroFreelanceHub helps freelancers turn that start rule into a client-ready agreement and secure payment link. It is software for freelance contracts and payment workflows, not a law firm, so unusual refund, cancellation, or compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-deposit-vs-full-upfront-payment',
    title: 'Deposit or Full Upfront Payment: Which Should Freelancers Use?',
    description:
      'A practical guide to choosing between a freelance deposit, full upfront payment, or milestone payment schedule before sending a client contract and payment link.',
    publishedAt: '2026-08-05',
    category: 'Upfront Payments',
    keywords: [
      'freelance deposit vs upfront payment',
      'full upfront payment for freelancers',
      'freelance payment link before work',
      'deposit or paid in full contract',
      'productized service upfront payment',
      'get paid before delivery',
    ],
    aiSummary:
      'Freelancers should use full upfront payment for clear, fixed-scope, productized work, deposits for larger custom projects, and milestone payments when the project needs multiple approval checkpoints before final delivery.',
    ctaHref: '/create?template=productized-service-provider-upfront-payment-contract',
    ctaLabel: 'Create upfront payment terms',
    relatedLinks: [
      {
        label: 'Create an upfront payment contract',
        href: '/create?template=productized-service-provider-upfront-payment-contract',
      },
      {
        label: 'Productized Service Provider Upfront Payment Contract',
        href: '/templates/productized-service-provider-upfront-payment-contract',
      },
      {
        label: 'What Freelancers Should Put in a Contract Before Sending a Stripe Payment Link',
        href: '/articles/freelance-stripe-payment-link-contract-terms',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
      {
        label: 'How to Write a Freelance Payment Schedule With Upfront, Milestone, and Final Payments',
        href: '/articles/freelance-payment-schedule-upfront-milestones-final',
      },
      {
        label: 'When Should Freelancers Start Work After a Client Pays the Deposit?',
        href: '/articles/freelance-start-work-after-deposit-clears',
      },
    ],
    sections: [
      {
        heading: 'Match the payment model to the project risk',
        body: [
          'The best freelance payment structure depends on how predictable the work is. Full upfront payment works well when the scope is fixed, the deliverable is standardized, and the client knows exactly what they are buying. A deposit works better when the project is custom, collaborative, or large enough that both sides need staged commitment.',
          'The decision should be made before the contract and payment link go out. If the payment rule changes after the client has seen the scope, the request can feel improvised. If it is built into the agreement from the start, it reads like a normal part of the workflow.',
        ],
      },
      {
        heading: 'Use full upfront payment for productized services',
        body: [
          'Full upfront payment is easiest to justify when the service is packaged: a landing page audit, fixed copy review, template setup, analytics check, profile rewrite, or other clearly bounded offer. The client is not funding an open-ended relationship. They are buying a defined outcome with a defined delivery path.',
          'For these projects, the agreement should state the exact deliverable, included review window, expected turnaround, client inputs required, and when work begins. The payment link should collect the full fee before production starts, because the freelancer is reserving capacity for a specific packaged service.',
        ],
      },
      {
        heading: 'Use a deposit for custom or higher-touch projects',
        body: [
          'A deposit is often better for projects with discovery, creative direction, stakeholder feedback, changing technical requirements, or multiple deliverables. The deposit reserves the project slot and funds the first phase, while later payments are tied to milestones, approvals, or final handoff.',
          'The contract should explain what the deposit covers, whether any portion is refundable, what must happen before work starts, and when the remaining balance is due. That protects the freelancer without asking the client to pay the entire custom project before they have seen any progress.',
        ],
      },
      {
        heading: 'Use milestones when approval drives the work',
        body: [
          'Some projects are too complex for either full upfront payment or a simple deposit-plus-final balance. If each phase depends on client approval, use a milestone schedule. Each milestone should name the deliverable, the approval action, the amount due, and whether payment is required before the next phase starts.',
          'This is especially useful for web builds, automation setups, app prototypes, launch projects, and strategy work that becomes more detailed over time. It gives the client structured checkpoints and keeps the freelancer from carrying the whole project cost until the end.',
        ],
      },
      {
        heading: 'Keep client-facing language simple',
        body: [
          'Avoid framing payment terms as a trust issue. Use operational language instead: "For fixed-scope packages, payment is due upfront before work begins" or "For custom projects, a deposit starts the project and milestone payments are due before each next phase." That tells the client what happens next without sounding defensive.',
          'If the client asks why, connect the payment to capacity, scheduling, and clear delivery rules. The strongest answer is a complete agreement: scope, payment amount, start requirements, revision limits, cancellation terms, and delivery timing in one place.',
        ],
      },
      {
        heading: 'Send one contract and payment link',
        body: [
          'Whether you choose full upfront payment, a deposit, or milestones, the client should not have to assemble the process from scattered messages. Send one client-ready link that shows the agreement, the payment terms, and the action required before work begins.',
          'MicroFreelanceHub helps freelancers package those terms with a secure client payment link. It is software for freelance contracts and payments, not legal advice, so unusual refund, tax, or compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-restart-fee-client-goes-quiet',
    title: 'How to Charge a Restart Fee When a Freelance Client Goes Quiet',
    description:
      'A practical guide to adding pause, restart, and payment terms when a freelance client misses approvals, materials, or milestone payment deadlines.',
    publishedAt: '2026-08-06',
    category: 'Client Delays',
    keywords: [
      'freelance restart fee',
      'client goes quiet freelance contract',
      'pause work clause for freelancers',
      'client delay payment terms',
      'milestone payment before restart',
      'freelance approval deadline',
    ],
    aiSummary:
      'Freelancers can charge a restart fee when a client goes quiet by defining response deadlines, pause triggers, payment requirements, and restart scheduling rules in the contract before work begins.',
    ctaHref: '/create?template=saas-onboarding-consultant-client-approval-agreement',
    ctaLabel: 'Create pause and approval terms',
    relatedLinks: [
      {
        label: 'Create an agreement with approval deadlines',
        href: '/create?template=saas-onboarding-consultant-client-approval-agreement',
      },
      {
        label: 'SaaS Onboarding Consultant Client Approval Agreement',
        href: '/templates/saas-onboarding-consultant-client-approval-agreement',
      },
      {
        label: 'How to Handle Client Delays in a Freelance Payment Schedule',
        href: '/articles/freelance-client-delay-payment-schedule-pause-resume',
      },
      {
        label: 'When Freelancers Can Pause Work for Late Payment',
        href: '/articles/freelance-late-payment-pause-work-contract-clause',
      },
      {
        label: 'How to Use Milestone Payments With Client Approval Steps',
        href: '/articles/freelance-milestone-payment-schedule-client-approval',
      },
      {
        label: 'When Should Freelancers Start Work After a Client Pays the Deposit?',
        href: '/articles/freelance-start-work-after-deposit-clears',
      },
    ],
    sections: [
      {
        heading: 'Define what counts as going quiet',
        body: [
          'A restart fee is easier to explain when the contract defines the problem in operational terms. The client has not simply been slow; they missed a specific approval window, materials deadline, access request, feedback date, or milestone payment deadline that the project depends on.',
          'Use plain timing. For example, the agreement might say that if the client does not provide required feedback, files, access, or payment within seven calendar days after a written request, the project may be paused. That gives both sides a clear checkpoint instead of a vague complaint about responsiveness.',
        ],
      },
      {
        heading: 'Connect the pause to scheduling capacity',
        body: [
          'The most client-friendly reason for a restart fee is scheduling. Freelancers reserve production time around expected approvals and payments. When the client disappears, that reserved time is lost, and restarting later may require new planning, context review, and a new slot on the calendar.',
          'The contract should say that timelines shift when client-side requirements are late. It can also say that paused work restarts only after outstanding items are complete, overdue payments are current, and the freelancer confirms the next available production window.',
        ],
      },
      {
        heading: 'Make the restart fee specific',
        body: [
          'Avoid surprising the client with a fee that was never named. State the restart fee in the agreement as a flat amount, a percentage of the project fee, or an hourly admin rate for re-planning and remobilizing the work. Pick a structure that fits the size of the project and the amount of context that must be rebuilt.',
          'For smaller fixed-scope work, a modest flat restart fee is usually easier to understand. For larger builds, onboarding projects, or consulting engagements, the agreement may use a written estimate for restart work after the pause period has passed.',
        ],
      },
      {
        heading: 'Require payment before work resumes',
        body: [
          'A project should not restart while old payment problems are still open. If the pause was caused by a missed milestone payment, final balance, or required upfront payment, the contract should require the overdue amount to be paid before any new work begins.',
          'If the pause was caused by missing feedback or materials, the restart step can still include payment rules: all current invoices must be paid, the restart fee must be paid if it applies, and any next milestone payment must be completed before the next phase starts.',
        ],
      },
      {
        heading: 'Use reminders before enforcing the clause',
        body: [
          'A good pause clause does not need to feel hostile. Send a written reminder that names the missing item, the date needed, the effect on the timeline, and the date the project will pause if nothing changes. This gives the client a fair chance to fix the delay and gives you a record of the process.',
          'The reminder can be short: "I need the homepage copy and platform access by Friday to keep the current schedule. If those items are not received, the project will pause and restart after the materials are complete, payment is current, and I confirm the next available production slot."',
        ],
      },
      {
        heading: 'Put the rule in the contract and payment workflow',
        body: [
          'Restart terms work best when they are part of the original contract, not a reaction after the client has already disappeared. Include response deadlines, approval rules, pause triggers, restart fees, payment-before-resume language, and revised timeline rules before the client signs.',
          'MicroFreelanceHub helps freelancers turn those terms into a client-ready agreement and secure payment link. It is software for freelance contracts and payment workflows, not legal advice, so unusual cancellation, refund, or compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-cancellation-terms-deposit-agreement',
    title: 'How to Write Cancellation Terms for a Freelance Deposit Agreement',
    description:
      'A practical freelancer guide to deposit cancellation terms, refund rules, booking windows, client notice periods, and payment links before work or event dates are reserved.',
    publishedAt: '2026-08-07',
    category: 'Cancellation Terms',
    keywords: [
      'freelance cancellation terms',
      'deposit cancellation clause for freelancers',
      'client cancellation policy',
      'upfront payment cancellation agreement',
      'freelance booking fee terms',
      'payment link before reserving dates',
    ],
    aiSummary:
      'Freelancers should write cancellation terms that explain what the deposit reserves, how much notice the client must give, when any refund may apply, and what must be paid before work or reserved dates are confirmed.',
    ctaHref: '/create?template=event-videographer-deposit-and-cancellation-contract',
    ctaLabel: 'Create deposit and cancellation terms',
    relatedLinks: [
      {
        label: 'Create a deposit and cancellation agreement',
        href: '/create?template=event-videographer-deposit-and-cancellation-contract',
      },
      {
        label: 'Event Videographer Deposit and Cancellation Contract',
        href: '/templates/event-videographer-deposit-and-cancellation-contract',
      },
      {
        label: 'Product Photographer Deposit and Usage Rights Agreement',
        href: '/templates/product-photographer-deposit-and-usage-rights-agreement',
      },
      {
        label: 'How to Ask for a Freelance Deposit Before Starting Work',
        href: '/articles/how-to-ask-for-a-freelance-deposit-before-starting-work',
      },
      {
        label: 'Deposit or Full Upfront Payment: Which Should Freelancers Use?',
        href: '/articles/freelance-deposit-vs-full-upfront-payment',
      },
      {
        label: 'How to Charge a Restart Fee When a Freelance Client Goes Quiet',
        href: '/articles/freelance-restart-fee-client-goes-quiet',
      },
    ],
    sections: [
      {
        heading: 'Start by saying what the deposit reserves',
        body: [
          'Cancellation terms work best when the client understands what the upfront payment is doing. For many freelancers, the deposit reserves production time, event availability, preparation work, materials, planning, or the first project milestone. Say that directly before the client signs.',
          'If the deposit only sounds like a generic prepayment, a later cancellation can turn into an argument about fairness. If the agreement explains that the deposit holds a calendar slot and funds project preparation, the rule feels connected to real business capacity rather than a penalty.',
        ],
      },
      {
        heading: 'Separate client cancellation from freelancer cancellation',
        body: [
          'A clear agreement should explain what happens if the client cancels, postpones, or materially changes the project. It should also say what happens if the freelancer cannot perform the work and must cancel or reschedule. Those are different situations and should not share vague language.',
          'For client cancellations, name the notice window, the deposit treatment, any work already completed, and any remaining balance that may be due. For freelancer cancellations, explain the refund or replacement process you are comfortable promising, while avoiding guarantees you cannot actually meet.',
        ],
      },
      {
        heading: 'Use notice windows instead of improvised decisions',
        body: [
          'Cancellation terms are easier to enforce when they use dates or notice periods. An event videographer might use one rule for cancellations more than 30 days before the event and another rule for cancellations inside the final week. A designer or consultant might tie cancellation to kickoff, discovery, or milestone approval.',
          'The exact window depends on the service, but the structure should be visible before payment: how to give notice, when notice is effective, what portion of the deposit may be refundable if any, and whether work already performed is billed separately.',
        ],
      },
      {
        heading: 'Explain postponements and rescheduling',
        body: [
          'Many clients do not think of postponement as cancellation, but it can create the same problem for a freelancer. A delayed event, late launch, or paused campaign can block the original calendar slot and require new planning later.',
          'Your agreement can allow one reschedule if the client gives enough notice and you have availability. It can also say that new dates are not confirmed until both sides approve the revised schedule and any required payment, restart fee, or additional deposit is complete.',
        ],
      },
      {
        heading: 'Tie final files and reserved dates to payment status',
        body: [
          'Cancellation language should work with the rest of the payment workflow. If the client owes a milestone payment, cancellation fee, restart fee, or final balance, the agreement should say whether final files, source files, publishing access, or reserved future dates are held until payment is current.',
          'Keep the wording practical. For example: "Reserved dates are confirmed only after the signed agreement and required deposit are complete. If the client cancels or reschedules, any refund or credit is handled under the cancellation schedule in this agreement."',
        ],
      },
      {
        heading: 'Send the cancellation terms with the payment link',
        body: [
          'The best time to explain cancellation terms is before the client pays, not after a problem appears. Put the deposit amount, refund rules, notice windows, rescheduling policy, and payment link in one client-ready agreement so the client can review everything before committing.',
          'MicroFreelanceHub helps freelancers create that workflow with contract terms, signatures, and secure client payment links. It is software for freelance contracts and payments, not a law firm, so unusual refund, consumer protection, tax, or local compliance questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },

  {
    slug: 'freelance-client-assets-access-deposit-before-work-starts',
    title: 'How to Collect Client Assets, Access, and Deposit Before Freelance Work Starts',
    description:
      'A practical freelancer guide to getting client materials, platform access, approvals, and upfront payment completed before production work begins.',
    publishedAt: '2026-08-08',
    category: 'Project Kickoff',
    keywords: [
      'client assets before freelance work starts',
      'freelance deposit before kickoff',
      'client access checklist for freelancers',
      'upfront payment and project materials',
      'freelance kickoff payment link',
      'approval before starting freelance work',
    ],
    aiSummary:
      'Freelancers should collect the signed agreement, upfront payment, required client assets, platform access, and kickoff approvals before production work starts so the project does not begin underfunded or blocked by missing materials.',
    ctaHref: '/create?template=api-integration-developer-deposit-and-approval-agreement',
    ctaLabel: 'Create deposit and access terms',
    relatedLinks: [
      {
        label: 'Create an agreement with deposit and access terms',
        href: '/create?template=api-integration-developer-deposit-and-approval-agreement',
      },
      {
        label: 'API Integration Developer Deposit and Approval Agreement',
        href: '/templates/api-integration-developer-deposit-and-approval-agreement',
      },
      {
        label: 'Zapier Consultant Deposit and Approval Agreement',
        href: '/templates/zapier-consultant-deposit-and-approval-agreement',
      },
      {
        label: 'SaaS Onboarding Consultant Client Approval Agreement',
        href: '/templates/saas-onboarding-consultant-client-approval-agreement',
      },
      {
        label: 'When Should Freelancers Start Work After a Client Pays the Deposit?',
        href: '/articles/freelance-start-work-after-deposit-clears',
      },
      {
        label: 'How to Handle Client Delays Without Losing Your Freelance Payment Schedule',
        href: '/articles/freelance-client-delay-payment-schedule-pause-resume',
      },
    ],
    sections: [
      {
        heading: 'Make kickoff conditional on more than enthusiasm',
        body: [
          'A client can be excited, responsive, and still not ready for production work. Freelancers often start too early because the client said yes, even though the signed agreement, deposit, brand files, platform access, decision maker approval, or source material is still missing.',
          'Treat kickoff as a checklist, not a feeling. The project starts when the required business and operational items are complete. That gives the client a clear path to begin and keeps you from absorbing unpaid setup time while waiting for access or files.',
        ],
      },
      {
        heading: 'List the exact materials the client must provide',
        body: [
          'The contract should name the client-side inputs that matter for the job: login access, API keys, product photos, brand guidelines, copy, ad account access, analytics permissions, stakeholder feedback, sample files, calendar availability, or any other dependency that blocks the work.',
          'Avoid vague phrases like "client will provide materials as needed." Instead, define a kickoff requirements list and say that timelines begin only after those required items are received in usable form. That wording is practical, easy to understand, and easier to apply later.',
        ],
      },
      {
        heading: 'Collect the deposit before opening production time',
        body: [
          'Missing materials are frustrating, but missing payment is worse. If you reserve a production slot before the client pays, you are carrying the scheduling risk while the client still has no financial commitment to the start date.',
          'A stronger workflow is signed agreement first, upfront payment second, then access and materials before the first milestone begins. For small projects, the deposit may reserve the start window. For larger projects, the deposit can fund discovery or setup while later milestones remain tied to approval and payment steps.',
        ],
      },
      {
        heading: 'Explain what happens when access is late or incomplete',
        body: [
          'Client-side delays should have a written operational consequence. The agreement can say that timelines extend when required assets, access, approvals, or payments are late, and that the freelancer is not responsible for delays caused by missing client inputs.',
          'The point is not to punish the client. It is to keep the schedule honest. If a Shopify specialist cannot enter the store, a Zapier consultant cannot access the account, or an API developer does not have credentials, the timeline should move instead of forcing unpaid overtime later.',
        ],
      },
      {
        heading: 'Use approval checkpoints before building on client inputs',
        body: [
          'Some materials need approval before they become the basis for paid work. A freelancer might ask the client to confirm the final copy deck, product list, user permissions, campaign brief, data source, or integration requirements before production begins.',
          'That approval matters because later changes can become new work. If the client approves the kickoff materials and then changes them after work has started, the agreement can route the change through a paid change request or next milestone instead of silently expanding the original scope.',
        ],
      },
      {
        heading: 'Send one client-ready link for signature, payment, and next steps',
        body: [
          'The cleaner the process, the fewer reminders you need. Put the kickoff requirements, deposit amount, payment link, access rules, approval steps, delay terms, and milestone schedule in one agreement so the client sees exactly what must happen before work begins.',
          'MicroFreelanceHub helps freelancers create that kind of contract and secure client payment workflow. It is software for freelance agreements and payment links, not legal advice, so unusual access, compliance, privacy, refund, or platform account questions should be reviewed with a qualified professional.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
