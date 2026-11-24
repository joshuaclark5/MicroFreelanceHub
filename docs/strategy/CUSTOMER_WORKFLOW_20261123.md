# Customer-centered workflow increment

## Requested outcome
Move toward a lightweight, account-centered business workspace, not a replica of NetSuite. Preserve the MicroFreelanceHub brand and existing pricing boundaries.

## Implemented candidate
- Customer name, email and phone visible above linked projects and communication history.
- Separate note cards; six or more entries supported. Editing appends a revision, preserving the original timestamp, author and text. Previous versions are visible.
- Version checks reject stale edits. Operation IDs make identical retries safe. Identity is captured by the server; opportunity audit entries remain read-only.
- Workspace Home provides customer-first entry, daily workflow links and all tool links; it does not invent totals or overdue counts.
- Marketing homepage primary action enters the workspace through sign-in; agreement drafting remains available. The explicit workspace login destination is allowlisted, with existing plan/template flows retaining priority.
- Existing profession hubs gain links to the broader workflow without removing template content, changing canonical URLs or generating duplicate profession URLs.
- A substantive public guide covers different designer, consultant and contractor workflows, with examples and limitations. Added to the sitemap.

## SEO publishing policy / next work
Do not manufacture one near-identical page per tool × profession every day. Use a daily editorial review queue: select a distinct customer problem, verify the feature actually works, write profession-specific examples and screenshots using fictional data, review claims and internal links, then publish only a useful finished page. Measure Search Console indexing, queries, qualified signups and tool adoption; publication count is not a success metric.

Next distinct topics: designer feedback and scope decisions; consultant discovery-to-project handoff; contractor site-visit notes and invoice preparation. Split them into dedicated pages when each has enough original detail to stand independently, not merely a changed profession noun. No daily publishing automation was enabled by this increment.

## Release order and acceptance
1. Fresh backup/restore proof and staging rehearsal for BOTH timeline migrations.
2. Apply additive timeline then note-edit/phone migrations before deploying the UI (the clients API now selects phone).
3. Build and TypeScript, handler tests, persisted database/RLS tests, browser fixture tests at 320/390/768/1440px.
4. Review screenshots: customer header, six cards, edit/history, refresh/retry/account-change states, workspace Home, homepage and guide. Fixtures are not live customer acceptance.
5. Publish through the bound managed checkout; verify exact-commit production deployment and live customer journey. Do not award matrix points for local tests alone.

Application rollback keeps additive schema and history; do not drop populated tables. The transactionally rolled-back destructive rehearsal script is for an isolated test database only.

## Scope limits
This is not a claim that every tool is now robust. Billing lifecycle, real email replies, end-to-end approval/signature/invoice acceptance, Android Home device acceptance and iOS proof remain separate gates. Notes are manually entered, not automatic email/call capture. The timeline displays its latest-200 bound explicitly. Publishing and hosted migration remain outstanding until release prerequisites are verified.
