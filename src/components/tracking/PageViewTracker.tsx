'use client';

import { useEffect } from 'react';
import { useUtmify } from '@/hooks/useUtmify';

export default function PageViewTracker() {
  const { isLoaded, trackEvent } = useUtmify();

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();

    const isHome = /^\/(pt|en|es)\/?$/.test(path);
    const stepMatch = path.match(/\/pers\/(\d+)/);
    const step = stepMatch ? stepMatch[1] : undefined;

    try {
      if (isHome) {
        // UTMify: pageview on home
        if (isLoaded) trackEvent('pageview', { page_type: 'home' });
        // Meta PageView já disparado em PixelScripts
        // TikTok page() já disparado em PixelScripts
      }

      if (step) {
        const stepEvent = `Step${step}PageView`;
        // Meta: custom pageview by step
        window.fbq?.('trackCustom', stepEvent, { page_type: 'personalization', step });
        // TikTok: StepXPageView + ViewContent
        window.ttq?.track(stepEvent, { page_type: 'personalization', step });
        window.ttq?.track('ViewContent', { content_type: 'personalization', content_name: stepEvent });
        // UTMify: custom pageview by step
        if (isLoaded) trackEvent(stepEvent, { page_type: 'personalization', step });
      }
    } catch (err) {
      console.error('PageViewTracker error:', err);
    }
  }, [isLoaded, trackEvent]);

  return null;
}
