'use client';

import { useEffect, useRef } from 'react';
import { useUtmify } from './useUtmify';

export function usePixelTracking() {
  const isInitialized = useRef(false);
  const { trackEvent: trackUtmifyEvent, isLoaded: utmifyLoaded } = useUtmify();

  useEffect(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      isInitialized.current = true;
    }
  }, []);

  const sendToMeta = (eventName: string, params?: Record<string, unknown>) => {
    if (!window.fbq) return;
    const standard = ['PageView', 'ViewContent', 'Lead', 'InitiateCheckout', 'Purchase'];
    if (standard.includes(eventName)) {
      window.fbq('track', eventName, params || {});
    } else {
      window.fbq('trackCustom', eventName, params || {});
    }
  };

  const sendToTikTok = (eventName: string, params?: Record<string, unknown>) => {
    if (!window.ttq) return;
    if (eventName === 'PageView') {
      window.ttq.page();
      return;
    }
    window.ttq.track(eventName, params || {});
  };

  return {
    trackEvent: (eventName: string, parameters?: Record<string, unknown>) => {
      sendToMeta(eventName, parameters);
      sendToTikTok(eventName, parameters);
      if (utmifyLoaded && trackUtmifyEvent) {
        trackUtmifyEvent(eventName, parameters);
      }
    },
    trackConversion: (parameters?: Record<string, unknown>) => {
      sendToMeta('Purchase', parameters);
      sendToTikTok('CompletePayment', parameters);
      if (utmifyLoaded && trackUtmifyEvent) {
        trackUtmifyEvent('purchase', parameters);
      }
    },
  };
}
