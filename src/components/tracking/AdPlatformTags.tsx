'use client';

import { useEffect } from 'react';
import { useGTM } from './GTMManager';
import { useLazyScriptLoader } from '@/lib/lazy-script-loader';
import { OPTIMIZED_GTM_CONFIG } from '@/lib/tracking-optimization';

interface AdPlatformTagsProps {
  enableFacebook?: boolean;
  enableTikTok?: boolean;
  enableGoogle?: boolean;
}

export default function AdPlatformTags({
  enableFacebook = OPTIMIZED_GTM_CONFIG.ENABLE_FACEBOOK,
  enableTikTok = OPTIMIZED_GTM_CONFIG.ENABLE_TIKTOK,
  enableGoogle = OPTIMIZED_GTM_CONFIG.ENABLE_GA4
}: AdPlatformTagsProps) {
  const { pushEvent } = useGTM();
  const { loadOnInteraction, loadWithDelay } = useLazyScriptLoader();

  useEffect(() => {
    // Configurar Facebook Pixel via GTM com lazy loading
    if (enableFacebook && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID) {
      // Inicialização direta do Facebook Pixel para Pixel Helper
      if (typeof window !== 'undefined' && !window.fbq) {
        // Criar função fbq se não existir
        window.fbq = function() {
          if (window.fbq.callMethod) {
            window.fbq.callMethod.apply(window.fbq, Array.from(arguments));
          } else {
            if (!window.fbq.queue) {
              window.fbq.queue = [];
            }
            window.fbq.queue.push(Array.from(arguments));
          }
        };
        window.fbq.push = window.fbq;
        window.fbq.loaded = true;
        window.fbq.version = '2.0';
        window.fbq.queue = [];

        // Carregar script do Facebook Pixel
         const script = document.createElement('script');
         script.async = true;
         script.src = 'https://connect.facebook.net/en_US/fbevents.js';
         script.onload = () => {
           // Inicializar pixel após carregamento
           window.fbq('init', process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
           window.fbq('track', 'PageView');
         };
         document.head.appendChild(script);

         // Adicionar noscript tag para o Facebook Pixel
         const noscript = document.createElement('noscript');
         const img = document.createElement('img');
         img.height = 1;
         img.width = 1;
         img.style.display = 'none';
         img.src = `https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`;
         noscript.appendChild(img);
         document.head.appendChild(noscript);
      }

      // Carregar Facebook Pixel via lazy loader também (backup)
      loadWithDelay('facebook-pixel', 100);
      
      // Configurar Facebook Pixel
      pushEvent('gtm_config_facebook', {
        pixel_id: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
        enhanced_conversions: process.env.GOOGLE_ENHANCED_CONVERSIONS_ENABLED === 'true',
        test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE || undefined
      });

      // Configurar eventos padrão do Facebook
      const fbEvents = [
        'PageViewDbug',
        'ViewContentDbug',
        'AddToCartDbug',
        'InitiateCheckoutDbug',
        'PurchaseDbug',
        'LeadDbug',
        'CompleteRegistrationDbug',
        'SearchDbug',
        'AddToWishlistDbug'
      ];

      fbEvents.forEach(eventName => {
        pushEvent('gtm_facebook_event_config', {
          event_name: eventName,
          pixel_id: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
          enhanced_matching: true
        });
      });
    }

    // Configurar TikTok Pixel via GTM com lazy loading
    if (enableTikTok && process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
      // Inicialização direta do TikTok Pixel para TikTok Pixel Helper
      if (typeof window !== 'undefined' && !window.ttq) {
        // Criar função ttq se não existir
        (window as any).ttq = (window as any).ttq || [];
        (window as any).ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        (window as any).ttq.setAndDefer = function(t: any, e: any) {
          t[e] = function() {
            t.push([e].concat(Array.from(arguments)));
          };
        };
        
        for (let i = 0; i < (window as any).ttq.methods.length; i++) {
          (window as any).ttq.setAndDefer((window as any).ttq, (window as any).ttq.methods[i]);
        }
        
        (window as any).ttq.instance = function(t: any) {
          let e = (window as any).ttq._i[t] || [];
          for (let n = 0; n < (window as any).ttq.methods.length; n++) {
            (window as any).ttq.setAndDefer(e, (window as any).ttq.methods[n]);
          }
          return e;
        };
        
        (window as any).ttq.load = function(t: any, e?: any) {
          (window as any).ttq._i = (window as any).ttq._i || {};
          (window as any).ttq._i[t] = [];
          (window as any).ttq._i[t]._u = `https://analytics.tiktok.com/i18n/pixel/events.js`;
          (window as any).ttq._t = (window as any).ttq._t || {};
          (window as any).ttq._t[t] = +new Date();
          (window as any).ttq._o = (window as any).ttq._o || {};
          (window as any).ttq._o[t] = e || {};
          
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=C4A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5&lib=${t}`;
          script.onload = () => {
            // Inicializar pixel após carregamento
            if (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
              (window as any).ttq.load(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
              (window as any).ttq.page();
            }
          };
          document.head.appendChild(script);
        };
        
        // Inicializar o pixel
        if (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
          (window as any).ttq.load(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
          (window as any).ttq.page();
        }
      }

      // Carregar TikTok Pixel com delay (baixa prioridade) - backup
      loadWithDelay('tiktok-pixel', 5000);
      
      pushEvent('gtm_config_tiktok', {
        pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
        enhanced_matching: true
      });

      // Configurar eventos padrão do TikTok
      const ttEvents = [
        'PageViewDbug',
        'ViewContentDbug',
        'AddToCartDbug',
        'InitiateCheckoutDbug',
        'CompletePaymentDbug',
        'SubmitFormDbug',
        'ClickButtonDbug',
        'SearchDbug',
        'ContactDbug'
      ];

      ttEvents.forEach(eventName => {
        pushEvent('gtm_tiktok_event_config', {
          event_name: eventName,
          pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
        });
      });
    }

    // Configurar Google Ads via GTM
    if (enableGoogle && process.env.NEXT_PUBLIC_GA4_ID) {
      pushEvent('gtm_config_google', {
        measurement_id: process.env.NEXT_PUBLIC_GA4_ID,
        enhanced_conversions: process.env.GOOGLE_ENHANCED_CONVERSIONS_ENABLED === 'true',
        enhanced_ecommerce: process.env.NEXT_PUBLIC_ENHANCED_ECOMMERCE_ENABLED === 'true'
      });

      // Configurar eventos de conversão do Google Ads
      const googleEvents = [
        'page_view',
        'view_item',
        'add_to_cart',
        'begin_checkout',
        'purchase',
        'generate_lead',
        'sign_up',
        'login',
        'search',
        'view_promotion',
        'select_promotion'
      ];

      googleEvents.forEach(eventName => {
        pushEvent('gtm_google_event_config', {
          event_name: eventName,
          measurement_id: process.env.NEXT_PUBLIC_GA4_ID
        });
      });
    }

    // Configurar Enhanced Conversions para máxima correspondência
    if (process.env.GOOGLE_ENHANCED_CONVERSIONS_ENABLED === 'true') {
      pushEvent('gtm_enhanced_conversions_config', {
        facebook_enabled: enableFacebook,
        tiktok_enabled: enableTikTok,
        google_enabled: enableGoogle,
        user_data_collection: {
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          address: true,
          city: true,
          region: true,
          postal_code: true,
          country: true
        }
      });
    }

    // Configurar correspondência avançada para todos os pixels
    pushEvent('gtm_advanced_matching_config', {
      facebook_advanced_matching: enableFacebook,
      tiktok_enhanced_matching: enableTikTok,
      google_enhanced_conversions: enableGoogle,
      data_collection_consent: true,
      privacy_compliant: true
    });

  }, [enableFacebook, enableTikTok, enableGoogle, pushEvent]);

  // Função para configurar eventos de conversão personalizados
  useEffect(() => {
    // Configurar eventos específicos do projeto
    const customEvents = [
      {
        name: 'personalization_start',
        facebook_event: 'InitiateCheckout',
        tiktok_event: 'InitiateCheckout',
        google_event: 'begin_checkout'
      },
      {
        name: 'personalization_complete',
        facebook_event: 'Purchase',
        tiktok_event: 'CompletePayment',
        google_event: 'purchase'
      },
      {
        name: 'cta_click',
        facebook_event: 'ViewContent',
        tiktok_event: 'ClickButton',
        google_event: 'select_promotion'
      },
      {
        name: 'form_submit',
        facebook_event: 'Lead',
        tiktok_event: 'SubmitForm',
        google_event: 'generate_lead'
      },
      {
        name: 'video_engagement',
        facebook_event: 'ViewContent',
        tiktok_event: 'ViewContent',
        google_event: 'video_start'
      }
    ];

    customEvents.forEach(event => {
      pushEvent('gtm_custom_event_mapping', {
        custom_event: event.name,
        facebook_mapping: event.facebook_event,
        tiktok_mapping: event.tiktok_event,
        google_mapping: event.google_event,
        cross_platform_tracking: true
      });
    });

  }, [pushEvent]);

  // Configurar tags de remarketing
  useEffect(() => {
    if (enableFacebook) {
      pushEvent('gtm_facebook_remarketing_config', {
        pixel_id: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
        custom_audiences: true,
        lookalike_audiences: true,
        dynamic_ads: true
      });
    }

    if (enableTikTok) {
      pushEvent('gtm_tiktok_remarketing_config', {
        pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
        custom_audiences: true,
        lookalike_audiences: true,
        dynamic_ads: true
      });
    }

    if (enableGoogle) {
      pushEvent('gtm_google_remarketing_config', {
        measurement_id: process.env.NEXT_PUBLIC_GA4_ID,
        remarketing_lists: true,
        similar_audiences: true,
        dynamic_remarketing: true
      });
    }

  }, [enableFacebook, enableTikTok, enableGoogle, pushEvent]);

  return null; // Este componente não renderiza nada visualmente
}

// Hook para tracking de conversões cross-platform
export function useAdPlatformTracking() {
  const { pushEvent } = useGTM();

  const trackConversion = (eventName: string, eventData: Record<string, any> = {}) => {
    // Enviar para todas as plataformas simultaneamente
    pushEvent('cross_platform_conversion', {
      event_name: eventName,
      facebook_enabled: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
      tiktok_enabled: !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
      google_enabled: !!process.env.NEXT_PUBLIC_GA4_ID,
      ...eventData
    });
  };

  const trackPurchase = (purchaseData: {
    value: number;
    currency: string;
    transaction_id: string;
    items: any[];
    user_data?: any;
  }) => {
    trackConversion('purchase', {
      ...purchaseData,
      event_category: 'ecommerce',
      conversion_type: 'purchase'
    });
  };

  const trackLead = (leadData: {
    value?: number;
    currency?: string;
    lead_type: string;
    user_data?: any;
  }) => {
    trackConversion('lead', {
      ...leadData,
      event_category: 'lead_generation',
      conversion_type: 'lead'
    });
  };

  const trackPersonalizationComplete = (personalizationData: {
    step_count: number;
    completion_time: number;
    user_data?: any;
  }) => {
    trackConversion('personalization_complete', {
      ...personalizationData,
      event_category: 'personalization',
      conversion_type: 'completion'
    });
  };

  return {
    trackConversion,
    trackPurchase,
    trackLead,
    trackPersonalizationComplete
  };
}