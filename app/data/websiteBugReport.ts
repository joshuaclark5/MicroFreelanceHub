import type { Article } from './articles';

export const websiteBugReport: Article = {
  slug: 'write-reproducible-client-website-bug-report',
  title: 'How to Write a Website Bug Report a Developer Can Reproduce',
  description: 'Turn a vague client website problem into a reproducible bug report with clear steps, expected and actual results, useful evidence, and a focused retest.',
  publishedAt: '2026-11-27',
  category: 'Freelance Quality',
  keywords: ['website bug report template', 'freelance website testing', 'reproducible bug report'],
  aiSummary: 'Report one observable problem at a time. Identify the page and tested environment, write repeatable steps, separate expected behavior from observations, share minimal safe evidence, and retest the same path after a fix.',
  ctaHref: '/articles',
  ctaLabel: 'Read more practical freelance guides',
  relatedLinks: [
    { label: 'Source: Mozilla bug writing guidelines', href: 'https://bugzilla.mozilla.org/page.cgi?id=bug-writing.html' },
    { label: 'Source: MDN on HTTP 404', href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404' },
    { label: 'Prepare a usable client handoff guide', href: '/articles/freelance-client-handoff-guide-template' },
    { label: 'Clarify vague revision feedback', href: '/articles/what-to-say-client-gives-vague-revision-feedback' }
  ],
  sections: [
    {
      heading: 'Replace “the website is broken” with something testable',
      body: [
        'A client sends a screenshot and says the menu does not work. A designer sees a layout problem; a developer wonders which browser was used; the project manager needs to know whether visitors can still reach the page. A useful bug report gives those people the same observable starting point without pretending to diagnose the code.',
        'This workflow is for freelancers reviewing a client website within an agreed testing scope. It uses an ordinary document or existing issue tracker. It is not a full accessibility, security, or performance audit, and it does not require a new paid testing service.',
        'All websites, paths, versions, observations, counts, and messages in the examples below are hypothetical teaching examples, not actual customer incidents or measured results. The running example is a fictional workshop website whose mobile navigation sends visitors to an unavailable timetable page. The reporting principles draw on Mozilla’s bug writing guidelines; the HTTP distinction comes from MDN.'
      ]
    },
    {
      heading: '1. Name one symptom and the task it interrupts',
      body: [
        'Start with a short title naming the location, action, and result. “Mobile menu Timetable link opens Page not found” is more useful than “Navigation issue” or “Please rebuild the menu.” It describes the symptom without prescribing a fix you have not investigated.',
        'Keep unrelated problems in separate reports. A broken destination and a misspelled heading may appear on the same screen but need different checks and decisions. Search the existing project issue list before opening another report; if the same symptom is already recorded, add your environment and evidence there instead.',
        'Record the visitor task and observed impact. Hypothetical impact note: “A visitor using the mobile menu cannot reach the timetable by that link. Opening /timetable directly works in this test.” That is narrower and more useful than “Nobody can book.” Do not infer lost sales, affected user counts, or failure on every device from one walkthrough.',
        'Separate an observed defect from a preference. “The link opens the wrong page” is testable against the agreed destination. “The menu should feel more modern” needs a design discussion. If intended behavior was never specified, record a question for the client instead of declaring your preferred behavior a confirmed bug.'
      ]
    },
    {
      heading: '2. Record the environment without sharing access secrets',
      body: [
        'Identify the tested page, whether it is a preview or the public website, and the version or deployment label if one is available. Add the observation time with its timezone, browser name and exact version, operating system, device, and whether you were signed in. If a detail is unknown, say so rather than guessing.',
        'For layout problems, include the browser viewport size and zoom level if you can obtain them. Distinguish a physical phone from a desktop browser’s responsive preview. A narrow desktop window is useful evidence, but it is not proof that the same behavior occurs on a particular phone.',
        'Hypothetical environment note: “Client-approved preview, build review-07; desktop browser responsive preview at 390 × 844 CSS pixels; zoom 100%; signed out. Browser and operating-system versions copied into the private report. Physical-phone check: not performed.” In an actual report, include those real version values rather than copying this placeholder.',
        'Use the approved private project channel for nonpublic preview addresses. Do not paste passwords, session cookies, recovery codes, or signed access links into a public issue. If reproducing requires access, ask the responsible owner to arrange appropriate reviewer access separately.'
      ]
    },
    {
      heading: '3. Write steps that begin before the failure',
      body: [
        'Mozilla’s guidance emphasizes precise reproduction steps and separate expected and actual results. Write what you did, not just what you hoped to do. Include the starting page and any relevant state, such as a closed menu or a selected filter, so the recipient does not have to reconstruct it from a screenshot.',
        'Hypothetical steps: “1. Open the preview homepage while signed out. 2. Set the responsive viewport to 390 × 844 CSS pixels. 3. Activate the Menu button once. 4. Select Timetable in the expanded navigation.” Keep the sequence in order and use the labels visible in that version.',
        'Hypothetical expected result: “The current timetable page opens, as specified in the approved navigation map.” Hypothetical actual result: “The address changes to /classes-old and a page headed Page not found appears.” Add the source of the expectation, such as the navigation map or agreed brief, so the implementer can confirm it.',
        'Try the sequence again only when doing so is safe and within scope. Hypothetical frequency note: “Observed on three of three fresh homepage visits in this environment.” That count describes these attempts, not a universal failure rate. For an intermittent issue, record what happened in each attempt and what changed; do not rewrite uncertainty as “always.”',
        'Do not repeatedly submit live forms, trigger emails, place orders, or modify client records to improve a report. Use an approved test environment and test data for actions with side effects. If those are unavailable, stop before the consequential action and document the limit of the observation.'
      ]
    },
    {
      heading: '4. Attach evidence that answers a specific question',
      body: [
        'A screenshot should show the relevant control or result with enough surrounding context to locate it. Give it a useful filename and explain which step it documents. A short recording can help when the problem depends on a sequence, but the written steps should remain usable without watching it.',
        'Hypothetical attachment note: “menu-timetable-result-review-07.png shows the Page not found heading after step 4. The private report records the source page and destination path.” Crop unrelated tabs and personal details from the shared copy. Review the exported image or video itself before sending it.',
        'Keep observations separate from explanations. “The menu link points to /classes-old” is an observation if you inspected that link. “The database deleted the timetable” is an unverified theory unless you have evidence. Put theories in a clearly labeled note, or omit them when they would distract from a reproducible symptom.',
        'MDN explains that an HTTP 404 response means the server cannot find the requested resource, and that the status alone does not say whether the absence is temporary or permanent. A visible Page not found message is not by itself proof of an HTTP 404 status. If you have not inspected the response, report the displayed message and leave the status unconfirmed.',
        'If a developer needs console output or a network trace, agree on the specific evidence and sharing location first. Do not attach an entire browser session or raw request headers by default. Such material may include private account details or access tokens; share only the relevant reviewed extract through the approved channel.'
      ]
    },
    {
      heading: '5. Describe impact and let the owner prioritize the repair',
      body: [
        'State which task is blocked, what you actually tested, and whether you found a workaround. The client or technical owner can then decide urgency alongside other work. Avoid labeling every cosmetic difference critical or promising a repair date on someone else’s behalf.',
        'Hypothetical triage note: “The mobile navigation path to the timetable fails in review-07. The direct /timetable path works in the same test. Desktop navigation and physical phones have not been checked. Please confirm the intended destination and assign a repair owner before the preview review closes.”',
        'Use your project’s existing severity labels if they are defined. Otherwise plain language is enough: blocked task, affected tested environment, workaround, and untested areas. Link related reports rather than combining several symptoms into one ticket that cannot be closed clearly.',
        'If the symptom appears to expose private information, stop collecting more examples and notify the responsible owner through the agreed private route. A normal content-review report is not permission to probe other accounts or explore how far an access problem extends.'
      ]
    },
    {
      heading: '6. Retest the original path, not just the proposed fix',
      body: [
        'When a repair is ready, identify the version you are checking and repeat the original steps in the original environment. Verify the actual destination and useful page content. A changed link in a code review or a developer saying “fixed” is not the same as observing the corrected behavior.',
        'Hypothetical retest note: “On preview build review-08, repeated steps 1–4 at 390 × 844 CSS pixels. Timetable now opens /timetable and the current session list is visible. Repeated the navigation from the homepage three times with the same result. Physical-phone behavior remains untested.” This records a bounded check rather than claiming the entire site works.',
        'Check a small adjacent behavior when it is relevant: does the menu still open and close, and does the same destination work from another agreed navigation location? Keep that check proportionate to the repair. Do not expand a simple link retest into unauthorized account or transaction testing.',
        'If the symptom remains, keep the original report and add the tested version, new result, and evidence. If you cannot access the repaired version, mark the report awaiting retest. Close it only according to the project’s agreed review process; a completed fix on a preview does not establish that production has been updated.'
      ]
    },
    {
      heading: 'Copy this compact report template',
      body: [
        'Title: [location + action + observed result]. Visitor task: [what the person was trying to do]. Environment: [page, preview or public, version, time and timezone, browser, OS, device or simulation, viewport, sign-in state]. Preconditions: [the starting state]. Steps: [numbered actions].',
        'Expected result: [behavior and its agreed reference]. Actual result: [what appeared or happened]. Frequency: [attempts and conditions]. Evidence: [reviewed attachment and the step it illustrates]. Impact and workaround: [observed limits, not assumed losses]. Unknowns: [what was not tested]. Next owner or decision: [confirmed owner, or awaiting assignment].',
        'Retest: [version, repeated steps, actual result, adjacent check, remaining limits]. Keep the initial observation and the retest together so another person can see what changed. A good report is not the longest one; it gives the next person enough information to repeat the problem and recognize a successful correction.'
      ]
    }
  ]
};
