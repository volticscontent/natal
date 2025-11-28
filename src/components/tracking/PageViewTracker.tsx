'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUtmify } from '@/hooks/useUtmify';
import { useSmartTracking } from '@/hooks/useSmartTracking';
import type { FunnelEvent } from '@/hooks/useSmartTracking';
import { saveUTMParameters } from '@/components/main/pers/utils/sessionManager';

export default function PageViewTracker() {
  const { isLoaded, trackEvent } = useUtmify();
  const pathname = usePathname();
  const didInitial = useRef(false);
  const { trackEvent: trackSmartEvent, trackMainFunnelProgress } = useSmartTracking();
  const isLoadedRef = useRef(isLoaded);
  const trackEventRef = useRef(trackEvent);
  const trackSmartEventRef = useRef(trackSmartEvent);
  const trackMainFunnelProgressRef = useRef(trackMainFunnelProgress);

  useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);
  useEffect(() => { trackEventRef.current = trackEvent; }, [trackEvent]);
  useEffect(() => { trackSmartEventRef.current = trackSmartEvent; }, [trackSmartEvent]);
  useEffect(() => { trackMainFunnelProgressRef.current = trackMainFunnelProgress; }, [trackMainFunnelProgress]);

  useEffect(() => {
    const path = (typeof window !== 'undefined' ? window.location.pathname : pathname || '').toLowerCase();
    const isPers = path.includes('/pers/');

    const isHome = /^\/(pt|en|es)\/?$/.test(path);
    const stepMatch = path.match(/\/pers\/(\d+)/);
    const step = stepMatch ? stepMatch[1] : undefined;

    try {
      if (typeof window !== 'undefined') {
        saveUTMParameters();
      }
      if (isHome) {
        if (isLoadedRef.current) trackEventRef.current('pageview', { page_type: 'home' });
        trackSmartEventRef.current('page_view', 'medium', { page_type: 'home' });
        trackMainFunnelProgressRef.current('start');
      }

      if (step) {
        const stepEvent = `Step${step}PageView`;
        window.fbq?.('trackCustom', stepEvent, { page_type: 'personalization', step });
        window.ttq?.track(stepEvent, { page_type: 'personalization', step });
        window.ttq?.track('ViewContent', { content_type: 'personalization', content_name: stepEvent });
        if (isLoadedRef.current) trackEventRef.current(stepEvent, { page_type: 'personalization', step });
        const persEvent = (step === '1' ? 'perspgview1' : step === '2' ? 'perspgview2' : 'perspgview3') as FunnelEvent;
        trackSmartEventRef.current(persEvent, 'medium', { step });
      }

      if (!isHome && !step && !isPers) {
        if (!didInitial.current) {
          didInitial.current = true;
        } else {
          window.fbq?.('track', 'PageView');
          window.ttq?.page();
          if (isLoadedRef.current) trackEventRef.current('pageview', { page_type: 'generic' });
          trackSmartEventRef.current('page_view', 'medium', { page_type: 'generic' });
        }
      }
    } catch (err) {
      console.error('PageViewTracker error:', err);
    }
  }, [pathname]);

  return null;
}
