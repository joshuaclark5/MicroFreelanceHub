// Library cards must not repeat unreviewed legal or payment-outcome claims.
const riskyClaim = /\b(?:protect\w*|guarantee\w*|legally|legal framework|legal tool|legal record|legal necessity|liabilit\w*|enforceab\w*|lawsuits?|litigation|shield\w*|safeguard\w*)\b|\b(?:ensur\w*|secur\w*|eliminat\w*|prevent\w*|forc\w*)\b[^.!?]*\b(?:pa(?:y|id)\w*|cash flow|revenue|debt\w*|scope creep|disputes?)\b|\bget paid reliably\b/i;

export const TEMPLATE_SUMMARY_FALLBACK = 'Review this template as a starting point for documenting project details, responsibilities, and payment expectations. Adapt it to the work both sides need to discuss.';

export function templateLibrarySummary(summary: string | null | undefined): string {
  if (!summary?.trim()) return 'Open this template, customize the project details, and send one client-ready link.';
  return riskyClaim.test(summary) ? TEMPLATE_SUMMARY_FALLBACK : summary;
}
