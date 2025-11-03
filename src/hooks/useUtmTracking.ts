'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUtmSessionId, getCurrentUtmParams, clearUtmSession } from '@/lib/utm-session';
import { buildPersonalizationUrl } from '@/lib/url-builder';

import { UtmParams } from '@/lib/url-builder';

export interface UseUtmTrackingReturn {
  sessionId: string | null;
  utmParams: UtmParams;
  isInitialized: boolean;
  buildPersonalizationLink: (step: string) => string;
  clearSession: () => void;
}

export function useUtmTracking(locale?: 'pt' | 'en' | 'es'): UseUtmTrackingReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [utmParams, setUtmParams] = useState<UtmParams>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize UTM tracking on client side
    if (typeof window !== 'undefined') {
      const currentSessionId = getUtmSessionId();
      const currentUtmParams = getCurrentUtmParams();
      
      setSessionId(currentSessionId);
      setUtmParams(currentUtmParams);
      setIsInitialized(true);
    }
  }, []);

  const buildPersonalizationLink = useCallback((step: string) => {
    const targetLocale = locale || 'pt';
    return buildPersonalizationUrl(targetLocale, step, utmParams);
  }, [locale, utmParams]);

  const clearSession = useCallback(() => {
    clearUtmSession();
    setSessionId(null);
    setUtmParams({});
  }, []);

  return {
    sessionId,
    utmParams,
    isInitialized,
    buildPersonalizationLink,
    clearSession
  };
}