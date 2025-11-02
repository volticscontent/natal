'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useGTM } from './GTMManager';

interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  gclid?: string; // Google Ads Click ID
  fbclid?: string; // Facebook Click ID
  ttclid?: string; // TikTok Click ID
  msclkid?: string; // Microsoft Ads Click ID
}

interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  landing_page: string;
  session_id: string;
  timestamp: string;
}

export default function UTMTracker() {
  const { pushEvent } = useGTM();
  const hasTrackedSession = useRef<boolean>(false);
  const sessionId = useRef<string>('');

  // Gerar ID único para a sessão
  const generateSessionId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Função para extrair todos os parâmetros UTM e de tracking
  const extractTrackingParams = useCallback((): UTMData => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingParams: UTMData = {};

    // Parâmetros UTM padrão
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
    utmParams.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        trackingParams[param as keyof UTMData] = value;
      }
    });

    // Click IDs de diferentes plataformas
    const clickIds = ['gclid', 'fbclid', 'ttclid', 'msclkid'];
    clickIds.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        trackingParams[param as keyof UTMData] = value;
      }
    });

    return trackingParams;
  }, []);

  // Função para determinar a fonte de tráfego
  const determineTrafficSource = useCallback((utmData: UTMData): TrafficSource => {
    const referrer = document.referrer;
    const hostname = referrer ? new URL(referrer).hostname : '';
    
    let source = utmData.utm_source || 'direct';
    let medium = utmData.utm_medium || 'none';
    let campaign = utmData.utm_campaign || '(not set)';

    // Se não há UTMs, tentar determinar pela referência
    if (!utmData.utm_source && referrer) {
      if (hostname.includes('google')) {
        source = 'google';
        medium = utmData.gclid ? 'cpc' : 'organic';
      } else if (hostname.includes('facebook') || hostname.includes('fb.')) {
        source = 'facebook';
        medium = utmData.fbclid ? 'cpc' : 'social';
      } else if (hostname.includes('instagram')) {
        source = 'instagram';
        medium = 'social';
      } else if (hostname.includes('tiktok')) {
        source = 'tiktok';
        medium = utmData.ttclid ? 'cpc' : 'social';
      } else if (hostname.includes('youtube')) {
        source = 'youtube';
        medium = 'social';
      } else if (hostname.includes('whatsapp')) {
        source = 'whatsapp';
        medium = 'social';
      } else if (hostname.includes('t.co') || hostname.includes('twitter')) {
        source = 'twitter';
        medium = 'social';
      } else if (hostname.includes('linkedin')) {
        source = 'linkedin';
        medium = 'social';
      } else {
        source = hostname;
        medium = 'referral';
      }
    }

    return {
      source,
      medium,
      campaign,
      referrer,
      landing_page: window.location.href,
      session_id: sessionId.current,
      timestamp: new Date().toISOString()
    };
  }, []);

  // Função para salvar UTMs no localStorage
  const saveUTMsToStorage = useCallback((utmData: UTMData, trafficSource: TrafficSource) => {
    try {
      // Salvar UTMs individuais
      Object.entries(utmData).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
          localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
        }
      });

      // Salvar fonte de tráfego completa
      localStorage.setItem('traffic_source', JSON.stringify(trafficSource));
      localStorage.setItem('session_id', sessionId.current);
      localStorage.setItem('first_visit_timestamp', new Date().toISOString());

      // Salvar histórico de sessões
      const sessionHistory = JSON.parse(localStorage.getItem('session_history') || '[]');
      sessionHistory.push({
        ...trafficSource,
        utm_data: utmData
      });
      
      // Manter apenas as últimas 10 sessões
      if (sessionHistory.length > 10) {
        sessionHistory.splice(0, sessionHistory.length - 10);
      }
      
      localStorage.setItem('session_history', JSON.stringify(sessionHistory));
    } catch (error) {
      console.warn('Erro ao salvar UTMs no localStorage:', error);
    }
  }, []);

  // Função para recuperar UTMs do localStorage
  const getStoredUTMs = useCallback((): UTMData => {
    try {
      const storedUTMs: UTMData = {};
      const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
      
      utmParams.forEach(param => {
        const value = localStorage.getItem(param);
        if (value) {
          storedUTMs[param as keyof UTMData] = value;
        }
      });

      return storedUTMs;
    } catch (error) {
      console.warn('Erro ao recuperar UTMs do localStorage:', error);
      return {};
    }
  }, []);

  // Função para trackear atribuição de conversão
  const trackConversionAttribution = useCallback((conversionType: string, conversionValue?: number) => {
    const currentUTMs = extractTrackingParams();
    const storedUTMs = getStoredUTMs();
    const finalUTMs = { ...storedUTMs, ...currentUTMs };
    
    const trafficSource = determineTrafficSource(finalUTMs);

    pushEvent('conversion_attribution', {
      conversion_type: conversionType,
      conversion_value: conversionValue || 0,
      attribution_source: trafficSource.source,
      attribution_medium: trafficSource.medium,
      attribution_campaign: trafficSource.campaign,
      first_click_utm: storedUTMs,
      last_click_utm: currentUTMs,
      session_id: sessionId.current,
      days_since_first_visit: getDaysSinceFirstVisit()
    });
  }, [extractTrackingParams, getStoredUTMs, determineTrafficSource, pushEvent]);

  // Função para calcular dias desde a primeira visita
  const getDaysSinceFirstVisit = useCallback((): number => {
    try {
      const firstVisit = localStorage.getItem('first_visit_timestamp');
      if (firstVisit) {
        const daysDiff = Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff;
      }
    } catch (error) {
      console.warn('Erro ao calcular dias desde primeira visita:', error);
    }
    return 0;
  }, []);

  // Função para trackear jornada do usuário
  const trackUserJourney = useCallback(() => {
    try {
      const sessionHistory = JSON.parse(localStorage.getItem('session_history') || '[]');
      const currentSession = sessionHistory[sessionHistory.length - 1];
      
      if (currentSession) {
        pushEvent('user_journey_tracking', {
          total_sessions: sessionHistory.length,
          current_session: currentSession,
          journey_touchpoints: sessionHistory.map((session: any) => ({
            source: session.source,
            medium: session.medium,
            campaign: session.campaign,
            timestamp: session.timestamp
          })),
          customer_lifetime_days: getDaysSinceFirstVisit()
        });
      }
    } catch (error) {
      console.warn('Erro ao trackear jornada do usuário:', error);
    }
  }, [pushEvent, getDaysSinceFirstVisit]);

  // Inicialização do tracking
  useEffect(() => {
    if (hasTrackedSession.current) return;

    hasTrackedSession.current = true;
    sessionId.current = generateSessionId();

    // Extrair parâmetros de tracking da URL atual
    const utmData = extractTrackingParams();
    const trafficSource = determineTrafficSource(utmData);

    // Salvar no localStorage
    saveUTMsToStorage(utmData, trafficSource);

    // Enviar evento principal de tracking
    pushEvent('utm_session_start', {
      ...utmData,
      traffic_source: trafficSource,
      page_location: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    });

    // Trackear jornada do usuário
    trackUserJourney();

    // Configurar Enhanced Conversions se houver dados do usuário
    const userData = getStoredUserData();
    if (userData && Object.keys(userData).length > 0) {
      pushEvent('enhanced_conversions_data', {
        user_data: userData,
        attribution_data: trafficSource
      });
    }

  }, [extractTrackingParams, determineTrafficSource, saveUTMsToStorage, pushEvent, trackUserJourney, generateSessionId]);

  // Função para obter dados do usuário armazenados
  const getStoredUserData = useCallback(() => {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : {};
    } catch (error) {
      return {};
    }
  }, []);

  // Função pública para trackear conversões
  const trackConversion = useCallback((type: string, value?: number, additionalData?: Record<string, any>) => {
    trackConversionAttribution(type, value);
    
    pushEvent('conversion_tracked', {
      conversion_type: type,
      conversion_value: value || 0,
      ...additionalData,
      session_id: sessionId.current,
      timestamp: new Date().toISOString()
    });
  }, [trackConversionAttribution, pushEvent]);

  // Função pública para atualizar dados do usuário
  const updateUserData = useCallback((userData: Record<string, any>) => {
    try {
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      pushEvent('user_data_updated', {
        user_data: userData,
        session_id: sessionId.current
      });
    } catch (error) {
      console.warn('Erro ao atualizar dados do usuário:', error);
    }
  }, [pushEvent]);

  return null; // Este componente não renderiza nada
}

// Hook para usar o UTM Tracker
export function useUTMTracking() {
  const { pushEvent } = useGTM();

  const trackConversion = useCallback((type: string, value?: number, additionalData?: Record<string, any>) => {
    // Implementação será adicionada pelo componente UTMTracker
    pushEvent('conversion_manual', {
      conversion_type: type,
      conversion_value: value || 0,
      ...additionalData
    });
  }, [pushEvent]);

  const getUTMData = useCallback((): UTMData => {
    try {
      const utmData: UTMData = {};
      const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
      
      utmParams.forEach(param => {
        const value = localStorage.getItem(param);
        if (value) {
          utmData[param as keyof UTMData] = value;
        }
      });

      return utmData;
    } catch (error) {
      return {};
    }
  }, []);

  const getTrafficSource = useCallback(() => {
    try {
      const trafficSource = localStorage.getItem('traffic_source');
      return trafficSource ? JSON.parse(trafficSource) : null;
    } catch (error) {
      return null;
    }
  }, []);

  return {
    trackConversion,
    getUTMData,
    getTrafficSource
  };
}