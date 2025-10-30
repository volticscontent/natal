'use client';

import { useEffect } from 'react';
import { useUtmTracking } from '@/hooks/useUtmTracking';

// Tipos para GA4 Custom Dimensions e Metrics
type CustomDimensionValue = string | number | boolean | undefined;
type CustomMetricValue = number | undefined;
type GA4EventParameters = Record<string, CustomDimensionValue | CustomMetricValue>;

// Mapeamento de Custom Dimensions (configure no GA4 Admin)
const CUSTOM_DIMENSIONS = {
  session_id: 'custom_parameter_1',
  utm_source: 'custom_parameter_2', 
  utm_campaign: 'custom_parameter_3',
  utm_medium: 'custom_parameter_4',
  utm_term: 'custom_parameter_5',
  utm_content: 'custom_parameter_6',
  click_id: 'custom_parameter_7',
  gateway: 'custom_parameter_8',
  user_type: 'custom_parameter_9',
  device_type: 'custom_parameter_10'
};

// Mapeamento de Custom Metrics (configure no GA4 Admin)
const CUSTOM_METRICS = {
  session_duration: 'custom_metric_1',
  scroll_depth_max: 'custom_metric_2',
  click_count: 'custom_metric_3',
  page_load_time: 'custom_metric_4'
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    performance?: Performance;
  }
}

interface GA4CustomDimensionsProps {
  userId?: string;
  userType?: 'new' | 'returning' | 'premium';
  locale?: 'pt' | 'en' | 'es';
}

export function GA4CustomDimensions({ userId, userType = 'new', locale = 'pt' }: GA4CustomDimensionsProps) {
  const { sessionId, utmParams } = useUtmTracking(locale);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;

    // Detectar tipo de dispositivo
    const getDeviceType = (): string => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/tablet|ipad|playbook|silk/.test(userAgent)) return 'tablet';
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) return 'mobile';
      return 'desktop';
    };

    // Calcular tempo de carregamento da página
    const getPageLoadTime = (): number => {
      if (!window.performance || !window.performance.timing) return 0;
      const timing = window.performance.timing;
      return timing.loadEventEnd - timing.navigationStart;
    };

    // Configurar Custom Dimensions
    const customDimensions: Record<string, CustomDimensionValue> = {};
    
    // Dimensões básicas
    customDimensions[CUSTOM_DIMENSIONS.session_id] = sessionId;
    customDimensions[CUSTOM_DIMENSIONS.gateway] = 'lastlink';
    customDimensions[CUSTOM_DIMENSIONS.user_type] = userType;
    customDimensions[CUSTOM_DIMENSIONS.device_type] = getDeviceType();

    // UTM Parameters
    if (utmParams.utm_source) {
      customDimensions[CUSTOM_DIMENSIONS.utm_source] = utmParams.utm_source;
    }
    if (utmParams.utm_campaign) {
      customDimensions[CUSTOM_DIMENSIONS.utm_campaign] = utmParams.utm_campaign;
    }
    if (utmParams.utm_medium) {
      customDimensions[CUSTOM_DIMENSIONS.utm_medium] = utmParams.utm_medium;
    }
    if (utmParams.utm_term) {
      customDimensions[CUSTOM_DIMENSIONS.utm_term] = utmParams.utm_term;
    }
    if (utmParams.utm_content) {
      customDimensions[CUSTOM_DIMENSIONS.utm_content] = utmParams.utm_content;
    }
    if (utmParams.fbclid || utmParams.gclid) {
      customDimensions[CUSTOM_DIMENSIONS.click_id] = utmParams.fbclid || utmParams.gclid;
    }

    // Custom Metrics
    const customMetrics: Record<string, CustomMetricValue> = {};
    customMetrics[CUSTOM_METRICS.page_load_time] = getPageLoadTime();

    // Configurar GA4 com dimensões e métricas personalizadas
    window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
      // User ID para correspondência entre sessões
      user_id: userId,
      
      // Custom Dimensions
      ...customDimensions,
      
      // Custom Metrics
      ...customMetrics,
      
      // Configurações adicionais
      send_page_view: true,
      allow_google_signals: true,
      allow_ad_personalization_signals: true,
      
      // Enhanced Measurement
      enhanced_measurement_settings: {
        scrolls: true,
        outbound_clicks: true,
        site_search: true,
        video_engagement: true,
        file_downloads: true
      }
    });

    // Enviar evento personalizado com todas as dimensões
    window.gtag('event', 'session_start', {
      event_category: 'engagement',
      event_label: 'session_initialized',
      ...customDimensions,
      ...customMetrics
    });

    console.log('GA4 Custom Dimensions configuradas:', {
      dimensions: customDimensions,
      metrics: customMetrics
    });

  }, [sessionId, utmParams, userId, userType]);

  // Configurar tracking de tempo na página
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startTime = Date.now();
    let maxScrollDepth = 0;
    let clickCount = 0;

    // Tracking de scroll depth
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
    };

    // Tracking de cliques
    const handleClick = () => {
      clickCount++;
    };

    // Enviar métricas quando o usuário sair da página
    const handleBeforeUnload = () => {
      if (!window.gtag) return;

      const sessionDuration = Math.round((Date.now() - startTime) / 1000);
      
      const finalMetrics: Record<string, CustomMetricValue> = {};
      finalMetrics[CUSTOM_METRICS.session_duration] = sessionDuration;
      finalMetrics[CUSTOM_METRICS.scroll_depth_max] = maxScrollDepth;
      finalMetrics[CUSTOM_METRICS.click_count] = clickCount;

      // Enviar evento final da sessão
      window.gtag('event', 'session_end', {
        event_category: 'engagement',
        event_label: 'session_completed',
        value: sessionDuration,
        ...finalMetrics,
        [CUSTOM_DIMENSIONS.session_id]: sessionId
      });
    };

    // Event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  return null; // Este é um componente de tracking, não renderiza nada
}

// Hook para usar as dimensões personalizadas em outros componentes
export function useGA4CustomDimensions() {
  const { sessionId, utmParams } = useUtmTracking();

  const sendCustomEvent = (eventName: string, parameters: GA4EventParameters = {}) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    const eventData: GA4EventParameters = {
      ...parameters,
      [CUSTOM_DIMENSIONS.session_id]: sessionId
    };

    // Adicionar UTMs se disponíveis
    if (utmParams.utm_source) {
      eventData[CUSTOM_DIMENSIONS.utm_source] = utmParams.utm_source;
    }
    if (utmParams.utm_campaign) {
      eventData[CUSTOM_DIMENSIONS.utm_campaign] = utmParams.utm_campaign;
    }

    window.gtag('event', eventName, eventData);
  };

  return {
    sendCustomEvent,
    customDimensions: CUSTOM_DIMENSIONS,
    customMetrics: CUSTOM_METRICS
  };
}

export default GA4CustomDimensions;