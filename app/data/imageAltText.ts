import type { Article } from './articles';

export const imageAltText: Article = {
  slug: 'write-alt-text-client-website-images',
  title: 'How to Write Alt Text for Client Website Images: A Freelancer Workflow',
  description: 'Decide which images need descriptions, write useful alt text, handle linked images and charts, and give your client a reviewable image worksheet.',
  publishedAt: '2026-11-25',
  category: 'Freelance Content',
  keywords: ['alt text for client websites', 'freelance image descriptions', 'image alt text worksheet'],
  aiSummary: 'Review each image in its page context before writing. Describe the information it contributes, name the action for an image-only link, mark purely decorative images for an empty alt attribute, and put complex information in readable page text. Check the implemented page, not just the copy worksheet.',
  ctaHref: '/articles',
  ctaLabel: 'Read more practical freelance guides',
  relatedLinks: [
    { label: 'Source: W3C WAI alt decision tree', href: 'https://www.w3.org/WAI/tutorials/images/decision-tree/' },
    { label: 'Source: W3C WAI complex images tutorial', href: 'https://www.w3.org/WAI/tutorials/images/complex/' },
    { label: 'Prepare a usable client handoff guide', href: '/articles/freelance-client-handoff-guide-template' },
    { label: 'Build an honest portfolio sample', href: '/articles/freelance-portfolio-sample-without-client-work' },
  ],
  sections: [
    {
      heading: 'Start with the image’s job on the page',
      body: [
        'A client sends a folder of photographs and asks you to “add the alt text.” Before describing every file, ask where each image will appear and what the reader needs from it. The same photograph can provide essential information on one page and serve only as decoration on another. A filename alone does not tell you which role applies.',
        'This guide is for freelancers writing or uploading website content. It covers a small image-review workflow, not a complete accessibility audit. The technical distinctions below follow the linked W3C Web Accessibility Initiative tutorials. Use your existing document or spreadsheet; no paid tool is needed for the worksheet.',
        'All project details, image descriptions, messages, and numbers in the examples are hypothetical. The running example is a fictional pottery workshop page with a teaching photograph, a decorative texture, a booking icon, and an attendance chart. These are teaching examples, not client work, testimonials, or measured results.',
      ],
    },
    {
      heading: '1. Make a page-specific image inventory',
      body: [
        'Create one row per image placement, not merely one row per file. Record the page address or draft name, image identifier, nearby heading and text, whether the image is a link or control, and what information would disappear if it were removed. Add columns for proposed treatment, draft text, reviewer, and implementation status.',
        'Hypothetical row: “Workshop page; hands-clay-01.jpg; under What you will practice; not linked; shows the hand position used to shape the rim; informative; draft description awaiting instructor review.” That row explains the decision rather than presenting a sentence with no context.',
        'Ask for the actual image and surrounding draft. If you only have a stock-library preview, a filename, or an old screenshot, mark the row as waiting for the current asset. Do not guess what the selected crop shows. Check repeated placements separately when their purposes differ.',
      ],
    },
    {
      heading: '2. Choose a treatment before drafting a sentence',
      body: [
        'The W3C WAI alt decision tree distinguishes meaningful images, purely decorative images, functional images, and complex information. For a simple informative photograph, it recommends a brief description that conveys the image’s meaning in context. For a purely decorative image, it recommends an empty alt attribute.',
        'Hypothetical informative example: beside a lesson about shaping a rim, the proposed text is “Two fingers support the inside of the clay rim while a thumb shapes the outside.” This describes the relevant technique, rather than listing the table, apron, wall color, and every object in the frame. Have the instructor confirm the technique and the actual image before using that wording.',
        'Hypothetical decorative example: a clay-colored texture separates two sections but adds no information. Record “Decorative — implement an empty alt attribute” in the worksheet. Do not use the word “decorative” as the published description, and do not treat an unanswered worksheet cell as an intentional decision.',
        'For an ordinary HTML image element, an explicitly empty attribute is written alt="". That is different from forgetting to supply the attribute. Website editors handle decorative-image settings differently, so ask the implementer to confirm the rendered result rather than assuming a blank text field produces the intended markup.',
      ],
    },
    {
      heading: '3. Describe actions for image-only links',
      body: [
        'When an image is the only understandable label for a link or button, the W3C decision tree says to communicate the destination or action. A description of the picture alone may leave the reader unsure what activating the control will do.',
        'Hypothetical example: a calendar icon is the only content of a link to the workshop booking page. “Calendar icon” names its appearance. “Book a pottery workshop” communicates the destination. Verify that the destination really is booking, not a general timetable or an unrelated contact form.',
        'If the same link already contains visible text such as “Book a pottery workshop,” the icon may be redundant and need an empty alternative instead. Inspect the entire control with the implementer. Do not add a second competing label simply because an image exists inside it.',
        'Keep this decision tied to the placement. A logo used as the only home-page link has a navigation role; the same logo in an explanatory article may have a different purpose. Reusing one asset does not automatically mean reusing one description everywhere.',
      ],
    },
    {
      heading: '4. Keep important words and complex information available',
      body: [
        'If an image contains meaningful words that are not provided elsewhere, the W3C decision tree says to include those words in its alternative. First check whether the information can be presented as ordinary page text. A promotional graphic should not be the only place a reader can find a date, location, or registration instruction.',
        'Hypothetical example: a workshop poster includes “Saturday, 10 a.m.; beginners welcome; materials provided.” Confirm those details with the client and place them in the page copy. Then reconsider what additional information, if any, the poster contributes. Do not copy a long poster into an alt field without examining the surrounding page.',
        'For charts, maps, and other complex images, the W3C complex-images tutorial describes a two-part alternative: a short identification and a longer text representation of the essential information. A concise alt sentence cannot substitute for values, relationships, or instructions the reader needs.',
        'Hypothetical chart: a fictional attendance graphic compares three sessions. Short alternative: “Attendance by workshop session; values and summary below.” Nearby text: “Hypothetical attendance: morning, 8 people; afternoon, 12; evening, 10. Afternoon has the highest attendance; the three sessions total 30.” Include labels and units in a readable table or text, and verify the arithmetic. If the graphic contains additional essential information, include that too.',
        'Only say “below” if the description really is below the image in the final page. If it is elsewhere, provide a clearly named link or accurate location. Keep longer descriptions available to everyone rather than hiding the useful explanation in a private production note.',
      ],
    },
    {
      heading: '5. Review accuracy without inventing details',
      body: [
        'Read each proposed description alongside the selected image and page copy. Remove filler that does not help the reader understand the image’s purpose. Do not add search keywords unrelated to the image, promotional claims, or inferred identities, emotions, qualifications, or results.',
        'Hypothetical revision: replace “Expert teacher delivers an amazing, confidence-building pottery experience” with a description of the visible action relevant to the lesson. The first sentence makes claims the image cannot establish. If the page needs a teacher’s name or role, ask the client to verify those facts rather than guessing from appearance.',
        'Ask a precise review question: “Does this description accurately explain the hand position shown in the selected crop?” That is easier to answer than “Is the alt text okay?” Record unresolved facts and who will confirm them. Keep “drafted,” “client-reviewed,” and “implemented” as separate statuses.',
        'If an automated tool suggests a description, treat it as a draft requiring the same checks. Do not upload confidential client assets to an unapproved service just to generate wording. You can complete this workflow manually with the material already authorized for the project.',
      ],
    },
    {
      heading: '6. Check the implemented page and hand over the worksheet',
      body: [
        'After upload, compare the final page with the worksheet. Confirm that each description belongs to the correct image placement, decorative choices were implemented intentionally, image-only controls communicate their action, and long descriptions or data tables are actually present. Recheck after an image replacement or crop change.',
        'Have the implementer inspect the rendered alternative and the accessible name of linked images or buttons. A saved CMS field is not proof that the public page exposes the same text. If screen-reader testing is part of the agreed work, record the browser, assistive technology, task, and actual result; do not claim testing you did not perform.',
        'Hypothetical handoff message: “The worksheet records the proposed treatment for each workshop-page image. The instructor still needs to confirm the hand-position description. The chart summary uses fictional sample data and must be replaced before a real event page is published. Implementation checks remain open until the final page is reviewed.”',
        'Reusable worksheet fields: page and placement; asset identifier; nearby text; image purpose; linked destination or action; treatment; proposed alternative; longer-description location; facts awaiting confirmation; reviewer; implementation owner; check performed; and status.',
        'The finish line is not a full column of sentences. It is a set of documented decisions that match the actual page, with unresolved items visible. This focused review can improve image content, but it does not establish that an entire website meets an accessibility standard.',
      ],
    },
  ],
};
