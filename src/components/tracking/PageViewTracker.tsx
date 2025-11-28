'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUtmify } from '@/hooks/useUtmify';

export default function PageViewTracker() {
  const { isLoaded, trackEvent } = useUtmify();
  const pathname = usePathname();
  const didInitial = useRef(false);

  useEffect(() => {
    const path = (typeof window !== 'undefined' ? window.location.pathname : pathname || '').toLowerCase();
    const isPers = path.includes('/pers/');

    const isHome = /^\/(pt|en|es)\/?$/.test(path);
    const stepMatch = path.match(/\/pers\/(\d+)/);
    const step = stepMatch ? stepMatch[1] : undefined;

    try {
      if (isHome) {
        if (isLoaded) trackEvent('pageview', { page_type: 'home' });
      }

      if (step) {
        const stepEvent = `Step${step}PageView`;
        window.fbq?.('trackCustom', stepEvent, { page_type: 'personalization', step });
        window.ttq?.track(stepEvent, { page_type: 'personalization', step });
        window.ttq?.track('ViewContent', { content_type: 'personalization', content_name: stepEvent });
        if (isLoaded) trackEvent(stepEvent, { page_type: 'personalization', step });
      }

      if (!isHome && !step && !isPers) {
        if (!didInitial.current) {
          didInitial.current = true;
        } else {
          window.fbq?.('track', 'PageView');
          window.ttq?.page();
          if (isLoaded) trackEvent('pageview', { page_type: 'generic' });
        }
      }
    } catch (err) {
      console.error('PageViewTracker error:', err);
    }
  }, [isLoaded, trackEvent, pathname]);

  return null;
}
