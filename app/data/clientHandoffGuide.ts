import type { Article } from './articles';

export const clientHandoffGuide: Article = {
  slug: 'freelance-client-handoff-guide-template',
  title: 'How to Write a Freelance Handoff Guide a Client Can Actually Use',
  description: 'Turn finished freelance work into a usable handoff: list the right files, explain everyday tasks, record known limits, and test the instructions with a hypothetical example.',
  publishedAt: '2026-11-23',
  category: 'Freelance Workflow',
  keywords: ['freelance handoff guide', 'client handoff documentation', 'project handoff template'],
  aiSummary: 'Write a short start-here document that identifies the delivered version, maps files to their purpose, explains one common task, and records unresolved items and support boundaries. Test the instructions from the recipient’s position before sending the package.',
  ctaHref: '/articles',
  ctaLabel: 'Read more practical freelance guides',
  relatedLinks: [
    { label: 'Source: GitHub writing and formatting documentation', href: 'https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax' },
    { label: 'Review your active freelance projects', href: '/articles/weekly-freelance-project-review-checklist' },
    { label: 'Discuss support requested after handoff', href: '/articles/client-asks-for-free-support-after-handoff-reply-template' },
  ],
  sections: [
    {
      heading: 'Document the next task, not your entire working process',
      body: [
        'A folder of finished files does not explain which file to open, what can be changed, or what to do when something looks wrong. A useful handoff guide answers those questions for the person who will use the work after you leave. It is a small operating document, not a portfolio case study or a transcript of every project conversation.',
        'Start with the recipient and their next likely task. A marketing coordinator may need to update a workshop date. An editor may need to locate the approved manuscript. A developer may need to run a project locally. Choose instructions for that person rather than assuming they know your software, folder conventions, or shorthand.',
        'The running example is hypothetical: a freelance designer delivering an editable workshop flyer and a PDF export to a fictional community organizer. All filenames, roles, and project details below are invented teaching examples, not client work or testimonials. This guide covers documentation, not when payment, ownership transfer, or release of files should occur; follow the arrangements already agreed for those matters.',
      ],
    },
    {
      heading: '1. Identify the package and the version it describes',
      body: [
        'Put a start-here file at the top of the delivery folder. Include the project name, delivery date, version, intended recipient, and a sentence stating what the package contains. Keep the guide beside the actual deliverables so a forwarded download still includes the instructions.',
        'Hypothetical header: “Workshop flyer handoff — version 03. Prepared for the event coordinator. Package: one editable presentation file, one review PDF, and this guide. This document describes the version with the approved workshop title and a placeholder date that the coordinator must replace before distribution.”',
        'Avoid calling every export “final.” Use a predictable name such as workshop-flyer-v03-editable.pptx and workshop-flyer-v03-review.pdf. If a correction changes the package, update the guide and version together. Keep prior delivery records separately rather than silently replacing them with a different file using the same name.',
      ],
    },
    {
      heading: '2. Give each file a purpose and a status',
      body: [
        'List what the recipient should open, why it exists, and whether it is intended for editing, review, or use. File extensions alone do not explain those choices. Note required software only after checking what the recipient actually has; do not make a new subscription an unexpected prerequisite.',
        'Hypothetical file map: “START-HERE-v03.txt: instructions and unresolved items. workshop-flyer-v03-editable.pptx: source for changing event details in the presentation software agreed during the project. workshop-flyer-v03-review.pdf: reference export for comparing layout; not ready for distribution until the placeholder date is replaced and the new export is checked.”',
        'Exclude abandoned concepts, private notes, unrelated client files, and scratch exports from the delivery copy. If third-party assets are included, point to the actual asset and terms record instead of claiming that everything in the folder is unrestricted. An inventory describes what was delivered; it does not create permissions that were never established.',
      ],
    },
    {
      heading: '3. Write one complete everyday procedure',
      body: [
        'Pick a common task and describe its starting point, actions, expected result, and checks. Use the names visible in the delivered version. “Update the artwork and export” leaves too much unexplained; “Open the editable file, change only the date text, then create a new PDF and compare it with the reference” gives the recipient a route through the task.',
        'Hypothetical procedure: “Task: replace the workshop date. First, make a working copy of workshop-flyer-v03-editable.pptx. Open that copy in the agreed presentation app. Select the text box labeled DATE TO CONFIRM and replace it with the approved date. Leave the venue and registration address unchanged unless the organizer supplies replacements. Export a new PDF using the export settings recorded in the project notes.”',
        'Hypothetical completion check: “Open the new PDF separately. Confirm that the date is correct, the text fits inside its box, and the title, venue, and registration address still match the approved details. Compare the layout with workshop-flyer-v03-review.pdf. Do not distribute the old reference PDF or an export that still contains DATE TO CONFIRM.”',
        'Use a screenshot only where it resolves a specific ambiguity, such as identifying the editable date box. Put the instruction in text too. If you have not verified a software menu label or export option in the agreed version, mark that step for confirmation rather than inventing a precise click path.',
      ],
    },
    {
      heading: '4. Separate known limits from unfinished decisions',
      body: [
        'A known limit explains how the delivered work is intended to be used. An open item names something that still needs a decision or action. Keep them separate so the recipient can tell whether the package is ready for their intended purpose.',
        'Hypothetical known limit: “This layout was prepared for the agreed digital flyer format. A different size or printing workflow has not been checked.” Hypothetical open item: “Event coordinator to confirm the date before distribution; current file contains a visible placeholder.” Neither statement implies that the freelancer tested a print run or approved facts supplied by somebody else.',
        'For each open item, name an owner, the next action, and what it blocks. If an owner or date has not been agreed, write “not yet confirmed” rather than assigning responsibility by assertion. Keep factual unknowns visible; a polished PDF should not hide an unresolved venue, missing asset, or untested export.',
      ],
    },
    {
      heading: '5. Make access and support instructions specific',
      body: [
        'If the package is shared online, check that the intended recipient can reach it with the access level agreed for the project. A link working while you are signed in as its owner is not a recipient-access test. Do not make a private folder public just to avoid a permission error, and do not place passwords or recovery codes in the handoff guide.',
        'Describe the support arrangement that actually exists. Name the contact channel, any agreed support period, what it covers, and how to request work outside it. If no arrangement exists, say that new requests need separate discussion; do not invent free ongoing support or a response-time commitment.',
        'Hypothetical wording: “Send questions about opening these delivered files through the existing project thread. Changes to the flyer’s size, layout, or content are separate requests to review before work starts. This guide does not add a maintenance service.” Adapt that wording to the agreement rather than using it to change existing obligations.',
      ],
    },
    {
      heading: '6. Test the guide from the recipient’s position',
      body: [
        'Open a fresh copy of the delivery package, not your working folder full of helpful context. Follow the documented task in order. Check every named file and link, and confirm that the expected result can be compared with something visible. Record the app or environment you actually tested and any access checks you could not perform.',
        'If the recipient is available, ask them to locate the editable file and explain their first step. Watch for an instruction that needs your verbal translation. Revise that instruction instead of treating confusion as a training failure. If no recipient test took place, label the review as your own walkthrough.',
        'Hypothetical test record: “Self-check only: opened the delivered editable copy, changed the placeholder date, exported a new PDF, and checked the date box and venue text. Recipient access and printing were not tested.” This is an example of the record format, not a claim that a real test occurred.',
        'Use descriptive headings and link labels to make the guide easy to scan. If you choose a GitHub Markdown README, GitHub’s official documentation explains heading syntax and its automatic outline for files with two or more headings. That is a GitHub feature, not a promise about every document viewer. A plain text or existing shared document is also sufficient; no new tool purchase is needed.',
      ],
    },
    {
      heading: 'A reusable start-here template',
      body: [
        'Copy these fields into a document: project and recipient; package version and date; what is included; which file to open first; file purposes and statuses; required software already agreed; one common task with numbered steps; expected result and checks; known limits; open items with owners; access instructions; support arrangement; and tests actually performed.',
        'Hypothetical delivery note: “The workshop-flyer-v03 package is ready for your review. Start with START-HERE-v03.txt, then open the editable file named there. The event date is still a placeholder, so the current PDF is a reference rather than a distribution file. Please confirm you can open the package and identify who will supply the date.”',
        'Do not treat delivery, receipt, and approval as interchangeable. A sent link records what you sent; a reply that the folder opens confirms access; approval depends on the review process agreed for the project. Keep those records alongside the guide so the next person can see what happened without guessing.',
        'The final check is simple: can the recipient find the right version, complete one real task, recognize what remains unresolved, and know where to ask for help? If not, improve the missing instruction before adding more pages.',
      ],
    },
  ],
};
