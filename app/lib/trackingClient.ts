export const LANDING_PAGE_KEY = 'landing_page';
export const MARKETING_SOURCE_KEY = 'marketing_source';

export function initializeTracking() {
  if (typeof window === 'undefined') return;

  // Check if tracking is already initialized
  if (localStorage.getItem(LANDING_PAGE_KEY)) {
    return;
  }

  // Capture landing page (pathname)
  const landingPage = window.location.pathname;

  // Extract marketing source from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  let marketingSource = null;

  // Check for ?source= parameter
  if (urlParams.has('source')) {
    marketingSource = urlParams.get('source');
  }
  // Check for ?utm_source= parameter
  else if (urlParams.has('utm_source')) {
    marketingSource = urlParams.get('utm_source');
  }
  // Check for ?utm_medium= parameter as fallback
  else if (urlParams.has('utm_medium')) {
    marketingSource = urlParams.get('utm_medium');
  }

  // Store in localStorage
  localStorage.setItem(LANDING_PAGE_KEY, landingPage);
  if (marketingSource) {
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
