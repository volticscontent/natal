'use client';

import { useEffect, useCallback } from 'react';
import { OPTIMIZED_GTM_CONFIG } from '@/lib/tracking-optimization';

// Tipos para eventos GTM
interface GTMEvent {
  event: string;
  [key: string]: any;
}

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface UserData {
  user_id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

interface EcommerceItem {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  variant?: string;
}

interface EcommerceData {
  transaction_id?: string;
  value: number;
  currency: string;
  items: EcommerceItem[];
  coupon?: string;
  shipping?: number;
  tax?: number;
}

// Declarações globais estão centralizadas em src/types/global.d.ts

export default function GTMManager() {
  // Inicializar GTM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inicializar dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Função gtag
    window.gtag = function() {
      window.dataLayer.push(Array.from(arguments));
    };

    // Configurar GA4 diretamente (para evitar erros de rede em desenvolvimento)
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
    if (ga4Id) {
      // Carregar script do GA4 com otimizações
      const ga4Script = document.createElement('script');
      ga4Script.async = true;
      ga4Script.defer = OPTIMIZED_GTM_CONFIG.DEFER_NON_CRITICAL_TAGS;
      ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
      document.head.appendChild(ga4Script);

      // Configurar GA4
      window.gtag('js', new Date());
      window.gtag('config', ga4Id, {
        debug_mode: process.env.NEXT_PUBLIC_TRACKING_DEBUG === 'true',
        send_page_view: true,
        allow_google_signals: true,
        allow_ad_personalization_signals: true,
        cookie_domain: 'auto',
        cookie_expires: 63072000, // 2 anos
        custom_map: {
          'custom_dimension_1': 'user_type',
          'custom_dimension_2': 'traffic_source',
          'custom_dimension_3': 'utm_campaign'
        }
      });
    }

    // Configurar GTM
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
    if (gtmId) {
      // Carregar script do GTM com otimizações
      const script = document.createElement('script');
      script.async = true;
      script.defer = OPTIMIZED_GTM_CONFIG.DEFER_NON_CRITICAL_TAGS;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(script);

      // Inicializar GTM
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });

      // Configurações iniciais
      window.dataLayer.push({
        event: 'gtm_config',
        gtm_id: gtmId,
        facebook_pixel_id: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
        tiktok_pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
        ga4_id: ga4Id,
        debug_mode: process.env.NEXT_PUBLIC_TRACKING_DEBUG === 'true',
        environment: process.env.NODE_ENV
      });
    }

    // Capturar UTMs da URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: UTMParams = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utmParams[param as keyof UTMParams] = value;
        // Salvar no localStorage para persistir na sessão
        localStorage.setItem(param, value);
      } else {
        // Recuperar do localStorage se não estiver na URL
        const stored = localStorage.getItem(param);
        if (stored) {
          utmParams[param as keyof UTMParams] = stored;
        }
      }
    });

    // Enviar UTMs para GTM
    if (Object.keys(utmParams).length > 0) {
      window.dataLayer.push({
        event: 'utm_captured',
        ...utmParams,
        page_location: window.location.href,
        page_title: document.title
      });
    }

    // Configurar Enhanced Ecommerce
    window.dataLayer.push({
      event: 'enhanced_ecommerce_config',
      ecommerce: {
        currency: 'BRL',
        country: 'BR'
      }
    });

  }, []);

  return null; // Este componente não renderiza nada
}

// Hook para usar GTM
export function useGTM() {
  // Função para enviar eventos personalizados
  const pushEvent = useCallback((eventName: string, eventData: Record<string, any> = {}) => {
    if (typeof window === 'undefined' || !window.dataLayer) return;

    const event: GTMEvent = {
      event: eventName,
      timestamp: new Date().toISOString(),
      page_location: window.location.href,
      page_title: document.title,
      ...eventData
    };

    window.dataLayer.push(event);
    
    // Log para debug
    if (process.env.NEXT_PUBLIC_TRACKING_DEBUG === 'true') {
      console.log('GTM Event:', event);
    }
  }, []);

  // Tracking de página
  const trackPageView = useCallback((pagePath?: string, pageTitle?: string) => {
    pushEvent('page_view', {
      page_path: pagePath || window.location.pathname,
      page_title: pageTitle || document.title,
      page_location: window.location.href
    });
  }, [pushEvent]);

  // Tracking de CTA
  const trackCTA = useCallback((ctaName: string, ctaLocation: string, ctaType: string = 'button') => {
    pushEvent('cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
      cta_type: ctaType,
      click_text: ctaName,
      click_url: window.location.href
    });
  }, [pushEvent]);

  // Tracking de steps de personalização
  const trackPersonalizationStep = useCallback((stepName: string, stepNumber: number, stepData: Record<string, any> = {}) => {
    pushEvent('personalization_step', {
      step_name: stepName,
      step_number: stepNumber,
      step_category: 'personalization',
      ...stepData
    });
  }, [pushEvent]);

  // Tracking de formulários
  const trackFormInteraction = useCallback((formName: string, action: 'start' | 'submit' | 'error', fieldName?: string) => {
    pushEvent('form_interaction', {
      form_name: formName,
      form_action: action,
      field_name: fieldName
    });
  }, [pushEvent]);

  // Tracking de scroll
  const trackScroll = useCallback((scrollDepth: number) => {
    pushEvent('scroll', {
      scroll_depth: scrollDepth,
      engagement_type: 'scroll'
    });
  }, [pushEvent]);

  // Tracking de tempo na página
  const trackTimeOnPage = useCallback((timeInSeconds: number) => {
    pushEvent('time_on_page', {
      time_seconds: timeInSeconds,
      engagement_type: 'time',
      time_category: timeInSeconds > 300 ? 'high_engagement' : timeInSeconds > 60 ? 'medium_engagement' : 'low_engagement'
    });
  }, [pushEvent]);

  // Tracking de ecommerce - Visualização de produto
  const trackViewItem = useCallback((item: EcommerceItem) => {
    pushEvent('view_item', {
      currency: 'BRL',
      value: item.price,
      ecommerce: {
        items: [item]
      }
    });
  }, [pushEvent]);

  // Tracking de ecommerce - Adicionar ao carrinho
  const trackAddToCart = useCallback((item: EcommerceItem) => {
    pushEvent('add_to_cart', {
      currency: 'BRL',
      value: item.price * item.quantity,
      ecommerce: {
        items: [item]
      }
    });
  }, [pushEvent]);

  // Tracking de ecommerce - Iniciar checkout
  const trackBeginCheckout = useCallback((ecommerceData: EcommerceData) => {
    pushEvent('begin_checkout', {
      currency: ecommerceData.currency,
      value: ecommerceData.value,
      ecommerce: {
        items: ecommerceData.items
      }
    });
  }, [pushEvent]);

  // Tracking de ecommerce - Compra
  const trackPurchase = useCallback((ecommerceData: EcommerceData, userData?: UserData) => {
    const eventData: any = {
      currency: ecommerceData.currency,
      value: ecommerceData.value,
      transaction_id: ecommerceData.transaction_id,
      ecommerce: {
        transaction_id: ecommerceData.transaction_id,
        value: ecommerceData.value,
        currency: ecommerceData.currency,
        items: ecommerceData.items
      }
    };

    // Adicionar dados do usuário se disponíveis (para Enhanced Conversions)
    if (userData) {
      eventData.user_data = userData;
    }

    pushEvent('purchase', eventData);
  }, [pushEvent]);

  // Tracking de leads
  const trackLead = useCallback((leadData: UserData & { lead_source?: string; lead_value?: number }) => {
    pushEvent('generate_lead', {
      currency: 'BRL',
      value: leadData.lead_value || 0,
      lead_source: leadData.lead_source || 'website',
      user_data: {
        email: leadData.email,
        phone: leadData.phone,
        first_name: leadData.first_name,
        last_name: leadData.last_name
      }
    });
  }, [pushEvent]);

  // Tracking de erros
  const trackError = useCallback((errorType: string, errorMessage: string, errorLocation?: string) => {
    pushEvent('exception', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation || window.location.pathname,
      fatal: false
    });
  }, [pushEvent]);

  // Tracking de busca
  const trackSearch = useCallback((searchTerm: string, searchResults?: number) => {
    pushEvent('search', {
      search_term: searchTerm,
      search_results: searchResults
    });
  }, [pushEvent]);

  // Tracking de compartilhamento
  const trackShare = useCallback((contentType: string, contentId: string, method: string) => {
    pushEvent('share', {
      content_type: contentType,
      content_id: contentId,
      method: method
    });
  }, [pushEvent]);

  // Tracking de engajamento com vídeo
  const trackVideoEngagement = useCallback((videoTitle: string, action: 'play' | 'pause' | 'complete' | 'progress', progress?: number) => {
    pushEvent('video_engagement', {
      video_title: videoTitle,
      video_action: action,
      video_progress: progress,
      engagement_type: 'video'
    });
  }, [pushEvent]);

  // Função para configurar Enhanced Conversions
  const configureEnhancedConversions = useCallback((userData: UserData) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
      user_data: {
        email_address: userData.email,
        phone_number: userData.phone,
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });
  }, []);

  return {
    pushEvent,
    trackPageView,
    trackCTA,
    trackPersonalizationStep,
    trackFormInteraction,
    trackScroll,
    trackTimeOnPage,
    trackViewItem,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackLead,
    trackError,
    trackSearch,
    trackShare,
    trackVideoEngagement,
    configureEnhancedConversions
  };
}