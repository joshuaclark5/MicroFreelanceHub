// Only established public acquisition routes. Never send IDs, booking tokens,
// agreement links, auth URLs, query strings, fragments or customer text to GA.
export function publicAnalyticsPath(path: string): string | null {
  return /^\/(?:$|(?:templates|profession|articles)(?:\/[a-z0-9-]+)?$|quote-follow-up(?:\/guide)?$|tools\/[a-z0-9-]+$|(?:pricing|features|partners|challenge|create)$)/.test(path) ? path : null;
}
export function analyticsAllowed(nav: {doNotTrack?:string|null;globalPrivacyControl?:boolean}) {
  return nav.doNotTrack !== '1' && nav.globalPrivacyControl !== true;
}
