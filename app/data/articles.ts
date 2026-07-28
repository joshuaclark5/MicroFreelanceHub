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
          'Approval checkpoints are what make revision limits enforceable in day-to-day project work. When the client approves a wireframe, rough cut, outline, homepage design, automation map, or draft, the agreement should say that later changes to that approved phase may affect price and timeline.',
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

];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
