// 📊 Integração Google Analytics 4 - Eventos Diferenciados

import { BaseDataLayerEvent } from '../types';

// Interface para itens de e-commerce
interface EcommerceItem {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
}

interface GA4Config {
  measurement_id_primary: string;
  measurement_id_conversions: string;
}

// 🎯 Mapeamento de Eventos GA4
const GA4_EVENT_MAPPING = {
  // Landing Page
  'landing_page_view': 'page_view',
  'landing_cta_click': 'select_promotion',
  'landing_video_engagement': 'video_engagement',
  'landing_scroll_depth': 'scroll',
  
  // Steps
  'step_1_page_view': 'page_view',
  'step_1_quantity_selected': 'add_to_cart',
  'step_1_navigation': 'funnel_step_complete',
  
  'step_2_page_view': 'page_view',
  'step_2_bump_interaction': 'select_item',
  'step_2_add_to_cart': 'add_to_cart',
  
  'step_3_page_view': 'page_view',
  'step_3_form_interaction': 'form_interaction',
  'step_3_form_submit': 'form_submit',
  'step_3_begin_checkout': 'begin_checkout',

  // Personalization Page Views (eventos customizados, sem page_view padrão)
  'perspgview1': 'pers_page_view',
  'perspgview2': 'pers_page_view',
  'perspgview3': 'pers_page_view',
  
  // Conversões
  'checkout_initiated': 'begin_checkout',
  'purchase_completed': 'purchase',
  'thank_you_social_share': 'share'
};

// 🚀 Envio para GA4
export const sendToGA4 = async (event: BaseDataLayerEvent, config: GA4Config): Promise<void> => {
  try {
    if (typeof window === 'undefined' || !(window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      console.warn('⚠️ GA4 não está disponível');
      return;
    }

    const gtag = (window as Window & { gtag: (...args: unknown[]) => void }).gtag;
    const ga4EventName = GA4_EVENT_MAPPING[event.event as keyof typeof GA4_EVENT_MAPPING] || event.event;
    
    // Determinar qual measurement ID usar
    const measurementId = isConversionEvent(event.event) 
      ? config.measurement_id_conversions 
      : config.measurement_id_primary;

    // Preparar parâmetros do evento
    const eventParams = buildGA4EventParams(event);

    // Enviar evento
    gtag('event', ga4EventName, {
      send_to: measurementId,
      ...eventParams
    });

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 GA4 Event Sent:', {
        event_name: ga4EventName,
        measurement_id: measurementId,
        params: eventParams
      });
    }

  } catch (error) {
    console.error('❌ Erro ao enviar evento para GA4:', error);
    throw error;
  }
};

// 🎯 Construir Parâmetros do Evento
const buildGA4EventParams = (event: BaseDataLayerEvent): Record<string, unknown> => {
  const baseParams = {
    // Parâmetros customizados
    page_type: event.page_context.page_type,
    page_name: event.page_context.page_name,
    locale: event.page_context.locale,
    session_id: event.user_data.session_id,
    
    // UTM Parameters
    campaign_source: event.campaign_data.utm_source,
    campaign_medium: event.campaign_data.utm_medium,
    campaign_name: event.campaign_data.utm_campaign,
    campaign_term: event.campaign_data.utm_term,
    campaign_content: event.campaign_data.utm_content,
    
    // Timestamp
    event_timestamp: event.timestamp || Date.now()
  };

  // Adicionar parâmetros específicos por tipo de evento
  const specificParams = getEventSpecificParams(event);
  
  return {
    ...baseParams,
    ...specificParams
  };
};

// 📊 Parâmetros Específicos por Evento
// 🔄 Construir Parâmetros Específicos do Evento
const getEventSpecificParams = (event: BaseDataLayerEvent): Record<string, unknown> => {
  const { event: event_name, event_data } = event;

  switch (event_name) {
    case 'landing_page_view':
      if ('content_type' in event_data && 'content_id' in event_data) {
        return {
          page_title: event.page_context.page_title,
          page_location: event.page_context.page_url,
          content_group1: 'landing',
          content_group2: 'home',
          content_type: event_data.content_type,
          content_id: event_data.content_id
        };
      }
      break;

    case 'landing_cta_click':
      if ('cta_text' in event_data) {
        return {
          promotion_id: 'hero_cta',
          promotion_name: event_data.cta_text,
          creative_name: 'hero_button',
          creative_slot: event_data.cta_position
        };
      }
      break;

    case 'landing_video_engagement':
      if ('video_id' in event_data) {
        return {
          video_title: 'Natal Personalizado - Video Principal',
          video_provider: 'custom',
          video_current_time: event_data.duration_watched,
          video_duration: event_data.duration_watched,
          video_percent: event_data.progress_percentage,
          video_visible: true,
          video_action: event_data.action
        };
      }
      break;

    case 'landing_scroll_depth':
      if ('scroll_percentage' in event_data) {
        return {
          percent_scrolled: event_data.scroll_percentage,
          engagement_time_msec: event_data.time_to_scroll,
          sections_viewed: event_data.sections_viewed
        };
      }
      break;

    case 'step_1_page_view':
      return {
        page_title: 'Step 1 - Quantidade de Crianças',
        page_location: '/step1',
        content_group1: 'funnel',
        content_group2: 'step1'
      };

    case 'step_1_quantity_selected':
      if ('quantity_selected' in event_data) {
        return {
          item_id: 'natal_personalizado',
          item_name: 'Natal Personalizado',
          item_category: 'personalized_product',
          quantity: event_data.quantity_selected,
          price: event_data.price_per_unit
        };
      }
      break;

    case 'step_2_page_view':
      return {
        page_title: 'Step 2 - Order Bumps',
        page_location: '/step2',
        content_group1: 'funnel',
        content_group2: 'step2'
      };

    case 'step_2_bump_interaction':
      if ('bump_name' in event_data) {
        return {
          item_id: event_data.bump_id,
          item_name: event_data.bump_name,
          item_category: 'order_bump',
          price: event_data.bump_price
        };
      }
      break;

    case 'step_2_add_to_cart':
      if ('items' in event_data) {
        return {
          currency: event_data.currency,
          value: event_data.value,
          items: (event_data.items as EcommerceItem[]).map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            item_category: item.category,
            quantity: item.quantity,
            price: item.price
          }))
        };
      }
      break;

    case 'step_3_form_interaction':
      if ('field_name' in event_data) {
        return {
          form_id: 'personalization_form',
          form_name: 'Dados das Crianças',
          form_destination: '/checkout-redirect',
          form_completion_rate: event_data.form_completion_percentage,
          field_name: event_data.field_name,
          field_type: event_data.field_type
        };
      }
      break;

    case 'step_3_form_submit':
      if ('form_completion_time' in event_data) {
        return {
          form_id: 'personalization_form',
          form_name: 'Dados das Crianças',
          form_completion_time: Math.floor(event_data.form_completion_time / 1000),
          form_fields_completed: event_data.fields_completed,
          form_validation_errors: event_data.validation_errors
        };
      }
      break;

    case 'step_3_begin_checkout':
      if ('items' in event_data) {
        return {
          currency: event_data.currency,
          value: event_data.value,
          coupon: '', // Se houver cupom
          items: (event_data.items as EcommerceItem[]).map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            item_category: item.category,
            quantity: item.quantity,
            price: item.price
          }))
        };
      }
      break;

    // Personalization Page Views (perspgviewX)
    case 'perspgview1':
      return {
        page_title: 'Personalização - Passo 1',
        page_location: event.page_context.page_url,
        content_group1: 'personalization',
        content_group2: 'perspgview1'
      };

    case 'perspgview2':
      return {
        page_title: 'Personalização - Passo 2',
        page_location: event.page_context.page_url,
        content_group1: 'personalization',
        content_group2: 'perspgview2'
      };

    case 'perspgview3':
      return {
        page_title: 'Personalização - Passo 3',
        page_location: event.page_context.page_url,
        content_group1: 'personalization',
        content_group2: 'perspgview3'
      };

    case 'checkout_initiated':
      if ('checkout_provider' in event_data) {
        return {
          currency: 'BRL',
          value: event_data.order_value,
          checkout_step: 1,
          checkout_option: event_data.checkout_provider
        };
      }
      break;

    case 'purchase_completed':
      if ('transaction_id' in event_data) {
        return {
          transaction_id: event_data.transaction_id,
          currency: event_data.currency,
          value: event_data.value,
          tax: 0,
          shipping: 0,
          items: (event_data.items as EcommerceItem[]).map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            item_category: item.category,
            quantity: item.quantity,
            price: item.price
          }))
        };
      }
      break;

    case 'thank_you_social_share':
      if ('platform' in event_data && 'share_type' in event_data) {
        return {
          method: event_data.platform,
          content_type: event_data.share_type,
          item_id: 'purchase_celebration'
        };
      }
      break;

    default:
      return {};
  }

  return {};
};

// 🎯 Verificar se é Evento de Conversão
const isConversionEvent = (eventName: string): boolean => {
  const conversionEvents = [
    'step_3_begin_checkout',
    'checkout_initiated',
    'purchase_completed'
  ];
  
  return conversionEvents.includes(eventName);
};

// 📊 Enhanced Ecommerce Events
export const sendEnhancedEcommerceEvent = (
  eventName: string, 
  ecommerceData: Record<string, unknown>, 
  config: GA4Config
): void => {
  if (typeof window === 'undefined' || !(window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
    console.warn('⚠️ GA4 não está disponível');
    return;
  }

  const gtag = (window as Window & { gtag: (...args: unknown[]) => void }).gtag;
  
  gtag('event', eventName, {
    send_to: config.measurement_id_primary,
    ...ecommerceData
  });
};

// 🎯 Configurar Parâmetros Customizados
export const configureGA4CustomParameters = (config: GA4Config): void => {
  if (typeof window === 'undefined' || !(window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
    console.warn('⚠️ GA4 não está disponível');
    return;
  }

  const gtag = (window as Window & { gtag: (...args: unknown[]) => void }).gtag;

  // Configurar mapeamento de parâmetros customizados
  gtag('config', config.measurement_id_primary, {
    custom_map: {
      'custom_parameter_1': 'page_type',
      'custom_parameter_2': 'step_number',
      'custom_parameter_3': 'cta_position',
      'custom_parameter_4': 'funnel_position',
      'custom_parameter_5': 'session_id'
    }
  });

  // Configurar dimensões customizadas
  gtag('config', config.measurement_id_primary, {
    send_page_view: false, // Controlar page views manualmente
    allow_google_signals: true,
    allow_ad_personalization_signals: true
  });
};

// 🔄 Batch de Eventos
export const sendGA4EventBatch = async (
  events: BaseDataLayerEvent[], 
  config: GA4Config
): Promise<void> => {
  try {
    const promises = events.map(event => sendToGA4(event, config));
    await Promise.allSettled(promises);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 GA4 Batch enviado: ${events.length} eventos`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar batch para GA4:', error);
    throw error;
  }
};

// 📈 User Properties
export const setGA4UserProperties = (userProperties: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || !(window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
    console.warn('⚠️ GA4 não está disponível');
    return;
  }

  const gtag = (window as Window & { gtag: (...args: unknown[]) => void }).gtag;
  
  gtag('set', 'user_properties', userProperties);
  
  console.log('✅ GA4 User Properties definidas:', userProperties);
};

// 🎯 Conversões Personalizadas
export const sendGA4CustomConversion = (
  conversionName: string,
  conversionValue: number,
  conversionCurrency: string = 'BRL',
  config: GA4Config
): void => {
  if (typeof window === 'undefined' || !(window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
    console.warn('⚠️ GA4 não está disponível');
    return;
  }

  const gtag = (window as Window & { gtag: (...args: unknown[]) => void }).gtag;
  
  gtag('event', 'conversion', {
    send_to: config.measurement_id_conversions,
    value: conversionValue,
    currency: conversionCurrency,
    transaction_id: `conv_${Date.now()}`,
    custom_conversion_name: conversionName
  });
};

const ga4Functions = {
  sendToGA4,
  sendEnhancedEcommerceEvent,
  configureGA4CustomParameters,
  sendGA4EventBatch,
  setGA4UserProperties,
  sendGA4CustomConversion
};

export default ga4Functions;
