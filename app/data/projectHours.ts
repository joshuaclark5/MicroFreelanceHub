import type { Article } from './articles';

export const projectHours: Article = {
  slug: 'estimate-freelance-project-hours',
  title: 'How to Estimate Freelance Project Hours Without Guessing a Delivery Date',
  description: 'Build a task-based freelance effort estimate, show uncertainty, and turn working hours into a realistic delivery window with a hypothetical worked example.',
  publishedAt: '2026-11-24',
  category: 'Freelance Planning',
  keywords: ['estimate freelance project hours', 'freelance effort estimate', 'project hours versus delivery date'],
  aiSummary: 'Break one deliverable into tasks, estimate a low and high effort for each, document the assumptions, and place that work into your actual calendar. Keep client review time separate from working hours and revise the estimate when its inputs change.',
  ctaHref: '/articles',
  ctaLabel: 'Read more practical freelance guides',
  relatedLinks: [
    { label: 'Source: Microsoft Excel NETWORKDAYS documentation', href: 'https://support.microsoft.com/en-us/excel/functions/networkdays-function' },
    { label: 'Review capacity across your active projects', href: '/articles/weekly-freelance-project-review-checklist' },
    { label: 'Discuss a brief that changes after work starts', href: '/articles/client-changes-brief-after-work-starts-reply-template' },
  ],
  sections: [
    {
      heading: 'Estimate the work before promising the date',
      body: [
        '“This should take two days” can mean two days of focused work, two calendar days, or two open slots somewhere next week. Those are different commitments. An effort estimate describes the time you expect to spend doing the work. A delivery window also depends on your availability, the sequence of tasks, and decisions you do not control.',
        'Build the estimate in a document or spreadsheet you already use. The goal is a short explanation you can update, not a precise-looking number unsupported by the brief. This guide covers planning effort, not setting a fee or changing an existing client commitment.',
        'All numbers, roles, schedules, and messages in the worked example are hypothetical teaching examples, not industry benchmarks or records of client results. The example is a freelance writer producing one service page from client-supplied source material, with one consolidated review round. Substitute your own work history and project constraints.',
      ],
    },
    {
      heading: '1. Define the smallest complete deliverable',
      body: [
        'Write down what the estimate includes before adding hours. Identify the output, its approximate size, the inputs you expect to receive, the review process, and the checks needed to call it finished. Make exclusions visible. Otherwise two people may agree on “one page” while imagining very different work.',
        'Hypothetical scope: “One service-page draft of up to 800 words, supplied as an editable document. Inputs: approved service details, audience notes, and two existing reference pages. Included: brief clarification, outline, drafting, self-edit, one consolidated feedback round, and final document checks. Excluded: interviews, original research, design, website entry, and additional page variants.”',
        'Treat an unconfirmed input as an assumption, not as a completed task. If the service details have not been approved, write that beside the estimate. If the reader needs interviews or original research, add those tasks explicitly rather than hiding them inside a generous writing allowance.',
      ],
    },
    {
      heading: '2. Break the work into checkable tasks',
      body: [
        'Use tasks small enough that you can describe their finish. “Write page” is too broad to reveal where the work sits. “Review the supplied material and list unresolved questions” has an observable output. Include coordination and quality checks as well as production; they still occupy your working time.',
        'For each task, record a low and high effort in hours, the basis for the range, and any prerequisite. Use recent comparable work where you have it. If you have no comparable record, label the number as an initial judgment and identify the part you need to investigate.',
        'Hypothetical breakdown: review inputs and clarify the brief, 1–2 hours; outline the page, 1–1.5 hours; write the first draft, 3–5 hours; self-edit and check supplied facts, 1–2 hours; process one consolidated review round, 1.5–3 hours; prepare the final document and check it, 0.5–1 hour.',
        'The hypothetical low total is 1 + 1 + 3 + 1 + 1.5 + 0.5 = 8 hours. The high total is 2 + 1.5 + 5 + 2 + 3 + 1 = 14.5 hours. These are planning scenarios, not a statistical confidence interval. The upper number is not a ceiling if the assumed scope or inputs change.',
      ],
    },
    {
      heading: '3. Explain uncertainty instead of adding a mysterious buffer',
      body: [
        'A useful range has reasons behind it. Note which tasks are familiar, which depend on material you have not inspected, and which may require a decision. Do not add the same uncertainty twice: if the higher drafting estimate already includes reorganizing weak source material, explain that before adding a separate allowance for the same problem.',
        'Hypothetical uncertainty note: “The drafting range depends on whether the supplied service descriptions agree with each other. The review range assumes one person sends consolidated comments. Separate, conflicting stakeholder responses are not modeled in this estimate.”',
        'For an unknown large enough to dominate the estimate, choose a small investigation with a defined stopping point. Hypothetical check: inspect the two reference pages and list contradictions before confirming the drafting range. If that inspection is additional work, agree how it fits the project before doing it; do not quietly expand the engagement.',
        'You can also reserve unallocated calendar time for interruptions. Label it as schedule capacity you are holding, not as work already performed or automatically billable time. Avoid borrowing a universal buffer percentage when you cannot explain what it covers.',
      ],
    },
    {
      heading: '4. Put working hours into an actual calendar',
      body: [
        'List the blocks you can really use after existing commitments, meetings, administration, and time away. Do not divide by an ideal eight-hour day unless eight hours are actually available for this project. Keep waiting time separate: a client reviewing a draft for two working days does not mean you spent sixteen hours producing it.',
        'Hypothetical calendar: three focused hours are available each working day, with no holidays or other interruptions during the example. At the high end, pre-review work takes 2 + 1.5 + 5 + 2 = 10.5 hours, spread across four working days. If work starts Monday and the draft is sent Thursday afternoon, a two-full-working-day client review window occupies Friday and the following Monday.',
        'In this hypothetical sequence, consolidated feedback arrives at the end of Monday. The remaining high-end revision and final checks total four hours, so they fit into Tuesday and Wednesday at the same three-hour daily capacity. The proposed delivery window therefore reaches the second Wednesday, even though total freelancer effort is 14.5 hours. This assumes feedback arrives on time and no new work is added.',
        'If you already use Excel, Microsoft documents that NETWORKDAYS counts whole working days between dates, excluding weekends and dates supplied in its holidays argument. NETWORKDAYS.INTL supports specifying different weekend days. These functions can help check a calendar, but they do not know your daily capacity, other projects, or client-review dependencies. The official documentation is linked with this guide; a manually checked calendar works too.',
      ],
    },
    {
      heading: '5. Share the estimate with its conditions attached',
      body: [
        'A client-facing estimate should answer four questions: what is included, how much effort is expected, what delivery window is proposed, and what must be true for that window to hold. Keep the detailed worksheet available, but lead with the decision the client needs to make.',
        'Hypothetical message: “For the service page described above, I estimate 8–14.5 working hours including one consolidated review round. With three project hours available per working day, the higher-effort plan runs from the first Monday through the second Wednesday. That assumes approved inputs before Monday and consolidated feedback by the end of the following Monday. Please confirm the scope and reviewer before we agree the schedule.”',
        'Do not present an effort range as a price if you have not agreed a pricing method. Likewise, do not imply that a planning estimate replaces an existing deadline or scope. If the new analysis conflicts with a commitment already made, raise that conflict directly and discuss the options.',
      ],
    },
    {
      heading: '6. Re-estimate when a named assumption changes',
      body: [
        'Keep the original estimate and record changes beside it. Useful triggers include a new deliverable, missing inputs, a different reviewer, an unfamiliar technical requirement, or feedback arriving after the planned work slot. Identify the affected tasks rather than multiplying the whole project by a vague difficulty factor.',
        'Hypothetical change: the client requests two interviews in addition to supplied-source writing. Keep the original service-page estimate intact. Add interview preparation, scheduling, interview time, note review, and any resulting rewrite as separate proposed tasks. Estimate those after clarifying the interview length and purpose; do not invent a standard surcharge.',
        'If feedback arrives late but requires the same work, the effort range might stay the same while the delivery date moves because your next available block has changed. If feedback introduces a second page, both effort and schedule need review. Say which changed and why rather than treating every delay as more billable work.',
        'After completion, compare actual time with the task estimates and write a brief reason for material differences. Separate scope additions, waiting, and your own estimating errors. Use that record to improve the next estimate without turning one project into a universal promise.',
      ],
    },
    {
      heading: 'A reusable project-hours worksheet',
      body: [
        'Copy these fields: deliverable and finish checks; included tasks; exclusions; required inputs and their status; task name; prerequisite; low hours; high hours; basis for the range; available calendar blocks; review owner and window; proposed delivery window; assumptions; and triggers for revision.',
        'Before sharing, check the arithmetic, look for omitted admin and review work, and trace the task sequence through the calendar. Ask whether the same uncertainty has been counted twice and whether an unconfirmed client action has been treated as a certainty.',
        'Keep the worksheet useful rather than elaborate. A credible estimate lets another person see how you reached the number, which assumptions could change it, and what decision comes next. That is more actionable than a confident date with no explanation behind it.',
      ],
    },
  ],
};
