export const LANDING_PAGE_KEY = 'landing_page';
export const MARKETING_SOURCE_KEY = 'marketing_source';

export function initializeTracking() {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const existingLandingPage = localStorage.getItem(LANDING_PAGE_KEY);
  const existingMarketingSource = localStorage.getItem(MARKETING_SOURCE_KEY);

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

  if (!existingLandingPage) {
    localStorage.setItem(LANDING_PAGE_KEY, window.location.pathname);
  }

  if (marketingSource && !existingMarketingSource) {
    localStorage.setItem(MARKETING_SOURCE_KEY, marketingSource);
  }
}

export function getTrackedData() {
  if (typeof window === 'undefined') {
    return { landing_page: null, lead_source: null };
  }

  return {
    landing_page: localStorage.getItem(LANDING_PAGE_KEY),
    lead_source: localStorage.getItem(MARKETING_SOURCE_KEY),
  };
}

export function clearTrackedData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LANDING_PAGE_KEY);
  localStorage.removeItem(MARKETING_SOURCE_KEY);
}
