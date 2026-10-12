export const LANDING_PAGE_KEY = 'landing_page';
export const MARKETING_SOURCE_KEY = 'marketing_source';

export function initializeTracking() {
  if (typeof window === 'undefined') return;
  try {
  const urlParams = new URLSearchParams(window.location.search);
  const existingLandingPage = localStorage.getItem(LANDING_PAGE_KEY);
  const existingMarketingSource = localStorage.getItem(MARKETING_SOURCE_KEY);

  // Freeze the original pair, including an unknown source. Never attribute an
  // older untagged arrival to a later internal CTA or a later campaign visit.
  if (existingLandingPage) {
    if (!existingMarketingSource) localStorage.setItem(MARKETING_SOURCE_KEY, 'unknown');
    return;
  }
  const path = window.location.pathname;
  if (!/^\/(?:$|(?:templates|profession|articles)(?:\/[a-z0-9-]+)?$|quote-follow-up(?:\/guide)?$|tools\/[a-z0-9-]+$|(?:create|pricing|partners)$)/.test(path)) return;

  let marketingSource = null;
  if (urlParams.has('source')) {
    marketingSource = urlParams.get('source');
  } else if (urlParams.has('ref')) {
    const ref = urlParams.get('ref');
    marketingSource = ref ? `affiliate:${ref}` : null;
  } else if (urlParams.has('partner')) {
    const partner = urlParams.get('partner');
    marketingSource = partner ? `affiliate:${partner}` : null;
  } else if (urlParams.has('utm_source')) {
    marketingSource = urlParams.get('utm_source');
  } else if (urlParams.has('utm_campaign')) {
    marketingSource = urlParams.get('utm_campaign');
  } else if (urlParams.has('utm_medium')) {
    marketingSource = urlParams.get('utm_medium');
  }

  // Only bounded campaign labels are accepted; never retain arbitrary query text.
  if (!marketingSource || !/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(marketingSource)) {
    marketingSource = null;
  }
  if (!marketingSource && document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      const host = referrer.hostname.toLowerCase().replace(/^www\./, '');
      const ownHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
      // Save only the domain, never the path, search terms, tokens or fragments.
      if (/^https?:$/.test(referrer.protocol) && host !== ownHost &&
          host !== 'microfreelancehub.com' && !host.endsWith('.microfreelancehub.com') &&
          host.length <= 90 && /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) {
        marketingSource = `referrer:${host}`;
      }
    } catch { /* Missing or malformed referrers remain unknown. */ }
  }

  if (!existingLandingPage) {
    localStorage.setItem(LANDING_PAGE_KEY, window.location.pathname);
  }

  localStorage.setItem(MARKETING_SOURCE_KEY, marketingSource || 'unknown');
  } catch { /* Storage restrictions must never block the customer's signup. */ }
}

export function getTrackedData() {
  if (typeof window === 'undefined') {
    return { landing_page: null, lead_source: null };
  }

  try {
    return {
      landing_page: localStorage.getItem(LANDING_PAGE_KEY),
      lead_source: localStorage.getItem(MARKETING_SOURCE_KEY),
    };
  } catch {
    return { landing_page: null, lead_source: null };
  }
}

export function getAuthAttribution(landingPage?: string | null, leadSource?: string | null) {
  const stored = getTrackedData();
  return {
    landing_page: landingPage || stored.landing_page,
    lead_source: leadSource || stored.lead_source,
  };
}

export function clearTrackedData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LANDING_PAGE_KEY);
  localStorage.removeItem(MARKETING_SOURCE_KEY);
}
