'use client';

type AgreementEvent = 'agreement_started' | 'agreement_scope_completed' | 'agreement_editor_opened' | 'agreement_save_requested' | 'agreement_saved';

// Fixed event names only: never forward agreement text, client data or prices.
export function trackAgreementEvent(name: AgreementEvent) {
  if (typeof window === 'undefined' || navigator.doNotTrack === '1' ||
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const analytics = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof analytics === 'function') analytics('event', name, { event_category: 'agreement_workflow' });
}
