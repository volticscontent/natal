// Import WindowWithGtag interface
interface WindowWithGtag extends Window {
  gtag: (...args: unknown[]) => void;
  dataLayer: unknown[];
}

// Interface para parâmetros de eventos GA4
export interface GA4EventParameters {
  page_title?: string;
  page_location?: string;
  content_group1?: string;
  content_group2?: string;
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
  item_list_id?: string;
  item_list_name?: string;
  video_title?: string;
  video_provider?: string;
  video_current_time?: number;
  video_duration?: number;
  video_percent?: number;
  video_visible?: boolean;
  item_id?: string;
  item_name?: string;
  item_category?: string;
  content_type?: string;
  currency?: string;
  checkout_step?: number;
  checkout_option?: string;
  payment_type?: string;
  transaction_id?: string;
  affiliation?: string;
  method?: string;
  percent_scrolled?: number;
  engagement_time_msec?: number;
  engagement_type?: string;
  value?: number;
  items?: GA4Item[];
  [key: string]: unknown;
}

// Interface para itens de e-commerce GA4
export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_brand?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  coupon?: string;
  affiliation?: string;
  location_id?: string;
  item_list_id?: string;
  item_list_name?: string;
  index?: number;
  promotion_id?: string;
  promotion_name?: string;
  creative_name?: string;
  creative_slot?: string;
}

// Interface para dados de página
export interface PageData {
  page_title: string;
  page_location: string;
  page_referrer?: string;
  content_group1?: string;
  content_group2?: string;
  content_group3?: string;
  content_group4?: string;
  content_group5?: string;
  custom_parameters?: Record<string, unknown>;
}

// Interface para dados de e-commerce
export interface EcommerceData {
  currency: string;
  value: number;
  transaction_id?: string;
  affiliation?: string;
  coupon?: string;
  shipping?: number;
  tax?: number;
  items: GA4Item[];
}

// Interface para propriedades do usuário
export interface UserProperties {
  user_id?: string;
  user_type?: string;
  traffic_source?: string;
  campaign_type?: string;
  device_category?: string;
  [key: string]: unknown;
}

// Interface para dados de conversão
export interface ConversionData {
  event_name: string;
  currency: string;
  value: number;
  transaction_id: string;
  items: GA4Item[];
  custom_parameters?: Record<string, unknown>;
}

// Interface para eventos server-side
export interface ServerSideEventData {
  client_id: string;
  events: Array<{
    name: string;
    params: GA4EventParameters;
  }>;
  user_properties?: UserProperties;
  timestamp_micros?: number;
  user_id?: string;
  non_personalized_ads?: boolean;
}

// Configuração do Google Analytics 4
export const GA4_CONFIG = {
  measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '',
  apiSecret: process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET || '',
  debugMode: process.env.NODE_ENV === 'development',
  cookieFlags: 'SameSite=None;Secure',
  customDimensions: {
    user_type: 'custom_dimension_1',
    traffic_source: 'custom_dimension_2',
    campaign_type: 'custom_dimension_3',
    funnel_step: 'custom_dimension_4',
    page_category: 'custom_dimension_5',
    user_engagement_level: 'custom_dimension_6',
    device_category: 'custom_dimension_7',
    utm_source_detailed: 'custom_dimension_8',
    utm_medium_detailed: 'custom_dimension_9',
    utm_campaign_detailed: 'custom_dimension_10',
  },
  customMetrics: {
    scroll_depth_percentage: 'custom_metric_1',
    time_on_page_seconds: 'custom_metric_2',
    form_completion_rate: 'custom_metric_3',
    cta_click_rate: 'custom_metric_4',
    video_completion_rate: 'custom_metric_5',
  },
  enhancedEcommerce: {
    enabled: true,
    currency: 'BRL',
    trackPurchases: true,
    trackRefunds: true,
    trackPromotions: true,
  },
};

// Mapeamento de eventos específicos para GA4
export const GA4_EVENT_MAPPING = {
  // Landing Page Events
  'landing_page_view': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Landing Page - Natal Personalizado',
      page_location: 'landing_page',
      content_group1: 'landing',
      content_group2: 'home',
    },
  },
  'hero_cta_click': {
    event_name: 'select_promotion',
    parameters: {
      promotion_id: 'hero_cta',
      promotion_name: 'Hero Call to Action',
      creative_name: 'hero_button',
      creative_slot: 'hero_section',
    },
  },
  'product_carousel_view': {
    event_name: 'view_item_list',
    parameters: {
      item_list_id: 'product_carousel',
      item_list_name: 'Produtos Natalinos',
    },
  },
  'video_section_play': {
    event_name: 'video_start',
    parameters: {
      video_title: 'Video Explicativo Natal',
      video_provider: 'custom',
      video_current_time: 0,
      video_duration: 120,
      video_percent: 0,
      video_visible: true,
    },
  },
  'discount_card_view': {
    event_name: 'view_promotion',
    parameters: {
      promotion_id: 'discount_card',
      promotion_name: 'Desconto Especial',
      creative_name: 'discount_banner',
      creative_slot: 'middle_section',
    },
  },
  'testimonial_view': {
    event_name: 'view_item',
    parameters: {
      item_id: 'testimonial_section',
      item_name: 'Avaliações de Especialistas',
      item_category: 'social_proof',
      content_type: 'testimonial',
    },
  },

  // Step 1 Events
  'step1_page_view': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Step 1 - Quantidade de Crianças',
      page_location: 'step1_quantidade',
      content_group1: 'funnel',
      content_group2: 'step1',
    },
  },
  'quantity_selection': {
    event_name: 'select_item',
    parameters: {
      item_id: 'quantity_selector',
      item_name: 'Seleção de Quantidade',
      item_category: 'funnel_interaction',
      content_type: 'form_field',
    },
  },
  'step1_continue_click': {
    event_name: 'begin_checkout',
    parameters: {
      currency: 'BRL',
      checkout_step: 1,
      checkout_option: 'quantity_selected',
    },
  },

  // Step 2 Events
  'step2_page_view': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Step 2 - Order Bumps',
      page_location: 'step2_order_bumps',
      content_group1: 'funnel',
      content_group2: 'step2',
    },
  },
  'order_bump_selection': {
    event_name: 'add_to_cart',
    parameters: {
      currency: 'BRL',
      item_category: 'order_bump',
      checkout_step: 2,
    },
  },
  'step2_continue_click': {
    event_name: 'add_shipping_info',
    parameters: {
      currency: 'BRL',
      checkout_step: 2,
      checkout_option: 'order_bumps_selected',
    },
  },

  // Step 3 Events
  'step3_page_view': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Step 3 - Dados das Crianças',
      page_location: 'step3_dados_criancas',
      content_group1: 'funnel',
      content_group2: 'step3',
    },
  },
  // Personalization Page Views (renomeados para perspgviewX)
  'perspgview1': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Personalização - Passo 1',
      page_location: 'pers_step1',
      content_group1: 'personalization',
      content_group2: 'perspgview1',
    },
  },
  'perspgview2': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Personalização - Passo 2',
      page_location: 'pers_step2',
      content_group1: 'personalization',
      content_group2: 'perspgview2',
    },
  },
  'perspgview3': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Personalização - Passo 3',
      page_location: 'pers_step3',
      content_group1: 'personalization',
      content_group2: 'perspgview3',
    },
  },
  'child_data_form_start': {
    event_name: 'begin_checkout',
    parameters: {
      currency: 'BRL',
      checkout_step: 3,
      checkout_option: 'child_data_form',
    },
  },
  'child_data_form_submit': {
    event_name: 'add_payment_info',
    parameters: {
      currency: 'BRL',
      checkout_step: 3,
      payment_type: 'form_completion',
    },
  },

  // Checkout Events
  'checkout_redirect': {
    event_name: 'purchase',
    parameters: {
      currency: 'BRL',
      transaction_id: '',
      affiliation: 'Natal Personalizado',
      checkout_step: 4,
      checkout_option: 'external_checkout',
    },
  },

  // Thank You Page Events
  'thank_you_page_view': {
    event_name: 'page_view',
    parameters: {
      page_title: 'Obrigado - Pedido Confirmado',
      page_location: 'thank_you',
      content_group1: 'conversion',
      content_group2: 'thank_you',
    },
  },
  'social_share_click': {
    event_name: 'share',
    parameters: {
      method: '',
      content_type: 'success_page',
      item_id: 'thank_you_share',
    },
  },

  // Engagement Events
  'scroll_depth_25': {
    event_name: 'scroll',
    parameters: {
      percent_scrolled: 25,
      engagement_time_msec: 0,
    },
  },
  'scroll_depth_50': {
    event_name: 'scroll',
    parameters: {
      percent_scrolled: 50,
      engagement_time_msec: 0,
    },
  },
  'scroll_depth_75': {
    event_name: 'scroll',
    parameters: {
      percent_scrolled: 75,
      engagement_time_msec: 0,
    },
  },
  'scroll_depth_100': {
    event_name: 'scroll',
    parameters: {
      percent_scrolled: 100,
      engagement_time_msec: 0,
    },
  },
  'exit_intent': {
    event_name: 'user_engagement',
    parameters: {
      engagement_type: 'exit_intent',
      engagement_time_msec: 0,
    },
  },
};

// Classe para gerenciar GA4
export class GA4Manager {
  private measurementId: string;
  private isInitialized = false;
  private debugMode: boolean;

  constructor() {
    this.measurementId = GA4_CONFIG.measurementId;
    this.debugMode = GA4_CONFIG.debugMode;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.measurementId) return;

    try {
      // Carregar Google Analytics 4
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // Configurar dataLayer e gtag
      (window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }).dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer || [];
      function gtag(...args: unknown[]) {
        (window as Window & { dataLayer?: unknown[] }).dataLayer?.push(args);
      }
      (window as Window & { gtag: (...args: unknown[]) => void }).gtag = gtag;

      // Configuração inicial
      gtag('js', new Date());
      gtag('config', this.measurementId, {
        debug_mode: this.debugMode,
        send_page_view: false, // Controlamos manualmente
        cookie_flags: GA4_CONFIG.cookieFlags,
        custom_map: GA4_CONFIG.customDimensions,
        enhanced_ecommerce: GA4_CONFIG.enhancedEcommerce.enabled,
      });

      // Configurar dimensões customizadas
      this.setupCustomDimensions();

      this.isInitialized = true;
      console.log('GA4 inicializado:', this.measurementId);
    } catch (error) {
      console.error('Erro ao inicializar GA4:', error);
    }
  }

  private setupCustomDimensions(): void {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (!gtag) return;

    // Configurar dimensões customizadas
    Object.entries(GA4_CONFIG.customDimensions).forEach(([key, dimension]) => {
      gtag('config', this.measurementId, {
        [dimension]: key,
      });
    });
  }

  trackEvent(eventName: string, parameters: GA4EventParameters = {}): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    try {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (!gtag) return;

      // Buscar mapeamento do evento
      const eventMapping = GA4_EVENT_MAPPING[eventName as keyof typeof GA4_EVENT_MAPPING];
      
      if (eventMapping) {
        // Usar evento mapeado
        const enhancedParameters = {
          ...eventMapping.parameters,
          ...parameters,
          timestamp: Date.now(),
          debug_mode: this.debugMode,
        };

        gtag('event', eventMapping.event_name, enhancedParameters);
        
        if (this.debugMode) {
          console.log('GA4 - Evento mapeado enviado:', {
            original_event: eventName,
            ga4_event: eventMapping.event_name,
            parameters: enhancedParameters,
          });
        }
      } else {
        // Evento customizado
        const customParameters = {
          ...parameters,
          custom_event_name: eventName,
          timestamp: Date.now(),
          debug_mode: this.debugMode,
        };

        gtag('event', 'custom_event', customParameters);
        
        if (this.debugMode) {
          console.log('GA4 - Evento customizado enviado:', {
            event: eventName,
            parameters: customParameters,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao enviar evento para GA4:', error);
    }
  }

  trackPageView(pageData: PageData): void {
    if (!this.isInitialized) return;

    try {
      const gtag = (window as unknown as WindowWithGtag).gtag;
      if (!gtag) return;

      const pageViewData = {
        page_title: pageData.page_title || document.title,
        page_location: pageData.page_location || window.location.href,
        page_referrer: pageData.page_referrer || document.referrer,
        content_group1: pageData.content_group1 || 'general',
        content_group2: pageData.content_group2 || 'page',
        content_group3: pageData.content_group3 || '',
        timestamp: Date.now(),
        ...GA4_CONFIG.customDimensions,
      };

      gtag('event', 'page_view', pageViewData);
      
      if (this.debugMode) {
        console.log('GA4 - Page view enviado:', pageViewData);
      }
    } catch (error) {
      console.error('Erro ao enviar page view para GA4:', error);
    }
  }

  trackEcommerce(eventType: string, ecommerceData: EcommerceData): void {
    if (!this.isInitialized || !GA4_CONFIG.enhancedEcommerce.enabled) return;

    try {
      const gtag = (window as unknown as WindowWithGtag).gtag;
      if (!gtag) return;

      const ecommerceEvent = {
        currency: ecommerceData.currency || GA4_CONFIG.enhancedEcommerce.currency,
        value: ecommerceData.value || 0,
        transaction_id: ecommerceData.transaction_id || '',
        items: ecommerceData.items || [],
        coupon: ecommerceData.coupon || '',
        shipping: ecommerceData.shipping || 0,
        tax: ecommerceData.tax || 0,
        affiliation: ecommerceData.affiliation || 'Natal Personalizado',
        timestamp: Date.now(),
      };

      gtag('event', eventType, ecommerceEvent);
      
      if (this.debugMode) {
        console.log('GA4 - Evento ecommerce enviado:', {
          type: eventType,
          data: ecommerceEvent,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar evento ecommerce para GA4:', error);
    }
  }

  setUserProperties(userProperties: UserProperties): void {
    if (!this.isInitialized) return;

    try {
      const gtag = (window as unknown as WindowWithGtag).gtag;
      if (!gtag) return;

      gtag('set', 'user_properties', {
        ...userProperties,
        timestamp: Date.now(),
      });
      
      if (this.debugMode) {
        console.log('GA4 - Propriedades do usuário definidas:', userProperties);
      }
    } catch (error) {
      console.error('Erro ao definir propriedades do usuário no GA4:', error);
    }
  }

  trackConversion(conversionData: ConversionData): void {
    if (!this.isInitialized) return;

    try {
      const gtag = (window as unknown as WindowWithGtag).gtag;
      if (!gtag) return;

      const conversionEvent = {
        send_to: this.measurementId,
        value: conversionData.value || 0,
        currency: conversionData.currency || 'BRL',
        transaction_id: conversionData.transaction_id || '',
        items: conversionData.items || [],
        timestamp: Date.now(),
      };

      gtag('event', 'conversion', conversionEvent);
      
      if (this.debugMode) {
        console.log('GA4 - Conversão enviada:', conversionEvent);
      }
    } catch (error) {
      console.error('Erro ao enviar conversão para GA4:', error);
    }
  }

  // Método para envio via Measurement Protocol (server-side)
  async sendServerSideEvent(eventData: ServerSideEventData): Promise<void> {
    if (!GA4_CONFIG.apiSecret) return;

    try {
      const payload = {
        client_id: eventData.client_id || 'anonymous',
        events: eventData.events.map(event => ({
          name: event.name,
          params: {
            ...event.params,
            timestamp_micros: Date.now() * 1000,
          },
        })),
        user_properties: eventData.user_properties,
        timestamp_micros: eventData.timestamp_micros,
        user_id: eventData.user_id,
        non_personalized_ads: eventData.non_personalized_ads,
      };

      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${GA4_CONFIG.apiSecret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (this.debugMode) {
        console.log('GA4 - Evento server-side enviado:', {
          status: response.status,
          payload,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar evento server-side para GA4:', error);
    }
  }
}

// Instância global do GA4
export const ga4Manager = new GA4Manager();