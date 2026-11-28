export function businessTimezone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 80 || value !== value.trim()
    || !/^(?:UTC|[A-Za-z_+-]+(?:\/[A-Za-z0-9_+.-]+)+)$/.test(value)) return null;
  try { return new Intl.DateTimeFormat('en', {timeZone:value}).resolvedOptions().timeZone; }
  catch { return null; }
}

export function businessCalendarDate(date: Date, timezone: string): string {
  const zone = businessTimezone(timezone);
  if (!zone) throw new Error('Choose a valid business timezone.');
  const parts = new Intl.DateTimeFormat('en', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(kind=>parts.find(part=>part.type===kind)!.value).join('-');
}
