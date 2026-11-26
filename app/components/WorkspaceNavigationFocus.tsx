'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Root-layout lifetime: route-local WorkspaceNav instances unmount on navigation.
export default function WorkspaceNavigationFocus() {
  const pathname = usePathname();
  const pending = useRef<string | null>(null);
  const cleanup = useRef<() => void>(() => {});
  const routeReady = useRef<() => void>(() => {});

  useEffect(() => {
    const cancel = () => {
      pending.current = null;
      cleanup.current();
    };
    const focusHeading = () => {
      cleanup.current();
      let frame = 0;
      const observer = new MutationObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(attempt);
      });
      const timer = window.setTimeout(cancel, 10000);
      function attempt() {
        if (pending.current !== window.location.pathname) return;
        // Onboarding (and other modal UI) owns focus, including when it opens
        // while destination data is loading. Discard, rather than defer, this handoff.
        const modal = Array.from(document.querySelectorAll<HTMLElement>('dialog[open], [aria-modal="true"]'))
          .find(element => element.getClientRects().length > 0);
        if (modal) { cancel(); return; }
        // The dashboard's first h1 is its brand, not its destination title.
        const selector = pending.current === '/dashboard' ? 'main [data-workspace-heading]' : 'main h1';
        const heading = Array.from(document.querySelectorAll<HTMLElement>(selector))
          .find(element => element.getClientRects().length > 0 && !element.closest('[inert], [hidden]'));
        if (!heading) return;
        // Do not add the heading to the normal Tab order or override its tab index.
        const temporaryTabIndex = !heading.hasAttribute('tabindex');
        if (temporaryTabIndex) heading.setAttribute('tabindex', '-1');
        heading.focus();
        if (document.activeElement !== heading) {
          if (temporaryTabIndex) heading.removeAttribute('tabindex');
          return; // A rejected focus call is not a successful handoff.
        }
        if (temporaryTabIndex) {
          heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
        }
        cancel();
      }
      cleanup.current = () => {
        observer.disconnect();
        clearTimeout(timer);
        cancelAnimationFrame(frame);
      };
      observer.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['hidden', 'style', 'class', 'open', 'aria-modal', 'inert'],
      });
      frame = requestAnimationFrame(attempt);
    };
    const closeMenu = (details: HTMLDetailsElement) => {
      details.open = false;
      details.querySelector<HTMLElement>('summary')?.focus();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const details = target?.closest<HTMLDetailsElement>('.suite-mobile-header details');
      if (!details || !details.open) return;
      if (target?.closest('[data-workspace-menu-close]')) {
        cancel();
        closeMenu(details);
        return;
      }
      const link = target?.closest<HTMLAnchorElement>('nav a[href]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey ||
          event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const destination = new URL(link.href);
      if (destination.origin !== window.location.origin) return;
      cancel();
      details.open = false;
      pending.current = destination.pathname;
      // Wait for the route commit below; same-route links have no pathname change.
      if (destination.pathname === window.location.pathname) focusHeading();
      else {
        const expiry = window.setTimeout(cancel, 10000);
        cleanup.current = () => clearTimeout(expiry);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const details = document.querySelector<HTMLDetailsElement>('.suite-mobile-header details[open]');
      if (details) {
        cancel();
        closeMenu(details);
        event.preventDefault();
      }
    };
    routeReady.current = () => {
      if (pending.current === window.location.pathname) focusHeading();
      else if (pending.current) cancel();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', cancel);
    return () => {
      cancel();
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', cancel);
      routeReady.current = () => {};
    };
  }, []);

  useEffect(() => {
    routeReady.current();
  }, [pathname]);

  return null;
}
