export function isEmailTemplate(documentType: string | null | undefined, slug: string) {
  return /\b(email|reply)\b/i.test(documentType || '') || /(^|-)email(-|$)/i.test(slug);
}

export function templateBadge(documentType: string) {
  return /\btemplates?$/i.test(documentType.trim()) ? documentType.trim() : `${documentType} Template`;
}

export function isChecklistTemplate(documentType: string | null | undefined, slug: string) {
  return /\bchecklist\b/i.test(documentType || '') || /(^|-)checklist(-|$)/i.test(slug);
}
