import { templateLibrarySummary } from './templateLibrarySummary';

export const PUBLIC_TEMPLATE_FALLBACK = 'Outline the scope, deliverables, exclusions, approvals, timing and payment details. Review and adapt these terms with the other party before work begins.';

// Public presentation only. Never write this transformation back to an agreement.
// Render the result as React text, not HTML; database markup is not trusted copy.
export function templatePublicCopy(value: unknown, fallback = PUBLIC_TEMPLATE_FALLBACK): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  let text = value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:p|div|br|li|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  text = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return entities[entity.toLowerCase()] ?? match;
  }).replace(/[\u200b-\u200f\ufeff]/g, '').trim();
  // Unknown/nested entity encodings are not approved marketing text.
  if (/&(?:#|[a-z]+;)/i.test(text)) return fallback;
  if (!text || templateLibrarySummary(text) !== text ||
      /\b(?:liable|liability|compliant|compliance|legally|binding|legal contract|contractually obligated|no warranty)\b|\b(?:ensur\w*|prevent\w*)\b[^.!?]*\b(?:loss|financial|responsib\w*)\b/i.test(text)) return fallback;
  return text;
}
