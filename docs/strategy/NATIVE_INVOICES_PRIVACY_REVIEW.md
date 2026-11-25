# Native invoice privacy review - unreleased source

Date: 2026-11-25. Source: `d9d885494b4c95ab3ea8448d8ac220937286dafb`.

This is a source-backed inventory and release worksheet, not a store submission, dependency-wide audit or native network capture. Android 0.1.9/code10 remains the internal release; native invoices are not in that binary. The iOS JavaScript export is not an IPA or TestFlight release.

## Data actually processed

| Operation | Fields and destination | Lifetime / limitation |
| --- | --- | --- |
| Verify account | Existing Supabase client calls Auth `getUser` before and after invoice requests; owner identity scopes records | Uses the existing encrypted sign-in session; adds no new token store |
| List/detail | Supabase `workspace_invoice_drafts`: invoice/owner/client/project IDs, version, status, number, complete document, total minor units and snapshot | Loaded into component memory; private UI fenced on verified account mismatch; list fetch also receives detail fields |
| Document | Client/project references, seller text, currency, issue/due dates, memo, line descriptions, quantities and integer minor-unit rates | Free text may include customer or seller contact information; amounts concern business invoices, not proof of payment |
| Issued/void snapshot | Saved document fields, client snapshot **name and email**, number, total and issued timestamp | The email is received and validated even though not rendered. Existing issued records can be read; this screen does not issue or void them |
| Client selector | Client ID, owner ID, name | No current email, phone or notes fetched by this selector |
| Project selector | Project ID, owner ID, name, client ID | No project notes fetched by this selector |
| Review | Local validated copy of document and exact total; actor and operation UUID | No write occurs at review. Form, review and uncertain operation are held only in memory |
| Confirm/retry | `workspace_invoice_mutate({p})`: create action, expected actor ID, operation UUID and reviewed document | Server persists the invoice and deduplication result. Retry uses the same identity/payload; closing/signing out loses local retry identity, not saved server records |
| Filter/search | Loaded invoice names, memo and descriptions searched locally | No search query is sent by this component; this is not whole-account search |

The app loads invoice/reference data when the Invoices tab is first visited and retains its component across tab navigation. Draft state participates in sign-out warnings. A failed refresh clears loaded lists and prior detail selection while retaining the draft; a confirmed save receipt can still be displayed. A failed load-more request retains the incomplete loaded list. Verified identity mismatches hide private form/review/retry content until the original account is verified. This is access-state handling, not a claim of secure memory erasure or guaranteed retention/deletion.

## Scope boundaries

- No new native dependency, permission or provider is added by this invoice slice. Supabase remains the account/data service. Actual dependency/provider diagnostics and network behavior require artifact-level review.
- No device contact list, external calendar, location, camera or media collection is added by invoice code.
- No email sending, card/bank entry, payment collection, tax/discount calculation or subscription purchasing is implemented here.
- Saved invoice status is draft/issued/void, not paid/unpaid. No automatic billing or payment status is inferred.
- UI display substitutions for risky claims do not rewrite stored documents. User-entered document text remains server-side after save; display sanitization is not data anonymization.
- The app's existing deletion action opens a support-email draft. It is not automatic deletion or cancellation. Retention and request fulfillment must follow the actual service process; do not invent a retention period or claim completed Apple deletion compliance.

## Proposed public privacy addition - not yet published

Append to the current live companion-app description, preserving existing Work/Day wording and device-access limits. Do not replace it with the stale privacy page in the mobile feature branch.

> Versions that include native Invoices use Supabase to load saved invoice documents and create invoice drafts after review. Invoice information includes seller details, client and optional project references, descriptions, quantities, prices, currency, dates and optional notes. Saved issued documents can also include the client name and email recorded when issued. Unsaved invoice drafts and uncertain-save retry details stay in app memory and can be lost when the app closes or you sign out; records already saved to your account remain on the service. This native workflow does not send invoice emails or collect payments.

This is prospective version-qualified copy, not a claim that Play 0.1.9 already supports invoices or that iOS is available. Before deploying, review against the latest live policy and the exact intended replacement artifact. No website source was edited by this review.

## Store disclosure checklist for the replacement

1. Reconcile account identity, client name/email, seller details and other user-entered content with current Play and Apple definitions. Review invoice amounts/document history under applicable financial-information categories; do not classify solely from the absence of payment-card capture.
2. Determine collection/sharing purposes, account linkage, optionality and provider treatment from actual behavior and terms. No blanket "no collection", "no sharing" or "no tracking" answer follows from this bounded source review.
3. Carry the invoice memory-only draft/retry limitation into truthful tester notes. Do not promise offline recovery after app termination.
4. Verify the exact signed package's permissions, backup/session behavior and network destinations; repeat on actual iOS once an archive exists.
5. Update public privacy wording and any applicable store disclosures before releasing the invoice binary. Preserve an accurate distinction between an internal-test exemption and submission of completed declarations.
6. Keep deletion, login, Apple signing/account and device acceptance gates explicit. An inventory does not satisfy those gates.

## Source evidence

- `mobile/src/invoiceData.ts`: selected columns, reference projections, account checks, validated immutable operation, RPC and receipt validation.
- `mobile/src/NativeInvoices.tsx`: lazy loading, retained draft state, local search, snapshot display, account fence and no-write review.
- `mobile/App.tsx`: invoice component lifetime, actor-key remount, sign-out draft warning and distribution modes.
- `app/lib/workspaceInvoices.ts`: complete document schema, currencies and amount bounds.
- Existing invoice migration: durable mutation receipts and ownership policies; hosted acceptance for the new native surface is tracked separately.

No customer records, public policies, provider configuration or store forms were changed by this review.
