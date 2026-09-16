export function formatArticleDate(value: string, month: 'short' | 'long' = 'long') {
  return new Intl.DateTimeFormat('en-US', { month, day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}
