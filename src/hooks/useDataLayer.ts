'use client';

import { useCallback, useRef } from 'react';

import { FunnelUtils } from '@/lib/ga4-funnel-config';
import { useEventController } from '@/lib/event-controller';

// Tipos para os eventos de tracking
export interface BaseEvent {
  event: string;
  timestamp?: number;
  user_id?: string;
  session_id?: string;
}

export interface PageViewEvent extends BaseEvent {
  event: 'page_view';
  page_title: string;
  page_location: string;
  page_path: string;
  step_number?: number;
  step_name?: string;
}

export interface StepProgressEvent extends BaseEvent {
  event: 'step_progress';
  step_from: number;
  step_to: number;
  step_name: string;
  progress_percentage: number;
}

export interface FormInteractionEvent extends BaseEvent {
  event: 'form_interaction';
  form_name: string;
  field_name: string;
  interaction_type: 'focus' | 'blur' | 'change' | 'submit';
  step_number: number;
}

export interface ProductInteractionEvent extends BaseEvent {
  event: 'product_interaction';
  interaction_type: 'add_to_cart' | 'remove_from_cart' | 'view_item';
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  quantity: number;
}

export interface CheckoutEvent extends BaseEvent {
  event: 'begin_checkout';
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    quantity: number;
  }>;
  checkout_step: number;
  payment_type?: string;
}

export interface CustomEvent extends BaseEvent {
  event: string;
  [key: string]: unknown;
}

export type DataLayerEvent = 
  | PageViewEvent 
  | StepProgressEvent 
  | FormInteractionEvent 
  | ProductInteractionEvent 
  | CheckoutEvent 
  | CustomEvent;

export const useDataLayer = () => {
  const { processEvent } = useEventController();
  const lastEventRef = useRef<{ [key: string]: number }>({});

  // Inicializar dataLayer se não existir
  const initializeDataLayer = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
    }
  }, []);

  // Função principal para enviar eventos com debounce
  const pushEvent = useCallback((event: DataLayerEvent) => {
    if (typeof window === 'undefined') return;

    // Sistema de debounce para evitar eventos duplicados
    // Criar chave usando apenas propriedades serializáveis (evitar elementos HTML)
    const serializableEvent = { ...event };
    
    // Função para limpar objetos de propriedades circulares
    const cleanObject = (obj: any, seen = new WeakSet()): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (seen.has(obj)) {
        return '[Circular]';
      }

      // Verificar se é um elemento HTML, Node, React Fiber ou Event
      if (obj instanceof HTMLElement || 
          obj instanceof Node || 
          obj instanceof Element ||
          obj instanceof Event ||
          (typeof obj === 'object' && obj.constructor && 
           (obj.constructor.name === 'FiberNode' || 
            obj.constructor.name === 'SyntheticEvent' ||
            obj.constructor.name?.includes('HTML') ||
            obj.constructor.name?.includes('Event')))) {
        return null;
      }

      if (typeof obj === 'function') {
        return null;
      }

      // Verificar se é window, document ou outros objetos globais
      if (obj === window || obj === document || obj === global) {
        return null;
      }

      seen.add(obj);

      try {
        if (Array.isArray(obj)) {
          return obj.map(item => cleanObject(item, seen)).filter(item => item !== null);
        }

        const cleaned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && 
              !key.startsWith('__react') && 
              !key.startsWith('_react') &&
              !key.startsWith('__') &&
              key !== 'nativeEvent' &&
              key !== 'currentTarget' &&
              key !== 'target' &&
              key !== 'stateNode' &&
              key !== 'return' &&
              key !== 'child' &&
              key !== 'sibling' &&
              key !== 'alternate') {
            try {
              const cleanedValue = cleanObject(obj[key], seen);
              if (cleanedValue !== null) {
                cleaned[key] = cleanedValue;
              }
            } catch (error) {
              // Se houver erro na limpeza de uma propriedade específica, pular
              continue;
            }
          }
        }

        return cleaned;
      } catch (error) {
        return '[Cleaning Error]';
      }
    };
    
    const cleanedEvent = cleanObject(serializableEvent);
    
    // Criar chave de evento de forma mais segura
    let eventKey: string;
    try {
      eventKey = `${event.event}_${JSON.stringify(cleanedEvent)}`;
    } catch (error) {
      // Fallback se ainda houver problemas de serialização
      eventKey = `${event.event}_${Date.now()}_${Math.random()}`;
      console.warn('Erro na serialização do evento, usando chave alternativa:', error);
    }
    
    const now = Date.now();
    const lastEventTime = lastEventRef.current[eventKey] || 0;
    
    // Evitar eventos duplicados em menos de 1 segundo
    if (now - lastEventTime < 1000) {
      console.log(`🚫 Evento duplicado bloqueado: ${event.event}`);
      return;
    }
    
    lastEventRef.current[eventKey] = now;

    initializeDataLayer();

    // Adicionar timestamp se não fornecido
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    // Verificar se deve enviar o evento através do controlador
    if (!processEvent(event.event, eventWithTimestamp)) {
      return; // Evento filtrado pelo controlador
    }

    // Push para dataLayer (garantindo que existe após inicialização)
    if (window.dataLayer) {
      window.dataLayer.push(eventWithTimestamp);
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 DataLayer Event:', eventWithTimestamp);
    }
  }, [initializeDataLayer, processEvent]);

  // Eventos específicos para facilitar o uso
  const trackPageView = useCallback((params: {
    pageTitle: string;
    pagePath: string;
    stepNumber?: number;
    stepName?: string;
  }) => {
    pushEvent({
      event: 'page_view',
      page_title: params.pageTitle,
      page_location: window.location.href,
      page_path: params.pagePath,
      step_number: params.stepNumber,
      step_name: params.stepName,
    });
  }, [pushEvent]);

  const trackStepProgress = useCallback((params: {
    stepFrom: number;
    stepTo: number;
    stepName: string;
  }) => {
    const progressPercentage = (params.stepTo / 3) * 100; // Assumindo 3 steps total
    
    pushEvent({
      event: 'step_progress',
      step_from: params.stepFrom,
      step_to: params.stepTo,
      step_name: params.stepName,
      progress_percentage: progressPercentage,
    });
  }, [pushEvent]);

  const trackFormInteraction = useCallback((params: {
    formName: string;
    fieldName: string;
    interactionType: 'focus' | 'blur' | 'change' | 'submit' | 'start';
    stepNumber: number;
  }) => {
    pushEvent({
      event: 'form_interaction',
      form_name: params.formName,
      field_name: params.fieldName,
      interaction_type: params.interactionType,
      step_number: params.stepNumber,
    });
  }, [pushEvent]);

  const trackProductInteraction = useCallback((params: {
    interactionType: 'add_to_cart' | 'remove_from_cart' | 'view_item';
    itemId: string;
    itemName: string;
    itemCategory: string;
    price: number;
    quantity: number;
  }) => {
    pushEvent({
      event: 'product_interaction',
      interaction_type: params.interactionType,
      item_id: params.itemId,
      item_name: params.itemName,
      item_category: params.itemCategory,
      price: params.price,
      quantity: params.quantity,
    });
  }, [pushEvent]);

  const trackBeginCheckout = useCallback((params: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      price: number;
      quantity: number;
    }>;
    checkoutStep: number;
    paymentType?: string;
  }) => {
    pushEvent({
      event: 'begin_checkout',
      currency: params.currency,
      value: params.value,
      items: params.items,
      checkout_step: params.checkoutStep,
      payment_type: params.paymentType,
    });
  }, [pushEvent]);

  const trackCustomEvent = useCallback((eventName: string, parameters: Record<string, unknown> = {}) => {
    pushEvent({
      event: eventName,
      ...parameters,
    });
  }, [pushEvent]);

  // Tracking de funis específicos
  const trackFunnelStep = useCallback((params: {
    funnelId: string;
    stepName: string;
    stepNumber: number;
    additionalData?: Record<string, unknown>;
  }) => {
    // Track no GA4 via dataLayer (removido duplicação com gtag direto)
    pushEvent({
      event: 'funnel_step_completed',
      funnel_id: params.funnelId,
      step_name: params.stepName,
      step_number: params.stepNumber,
      completion_time: Date.now(),
      ...params.additionalData,
    });
  }, [pushEvent]);

  const trackFunnelAbandonment = useCallback((params: {
    funnelId: string;
    exitStep: string;
    timeSpent: number;
    reason?: string;
  }) => {
    pushEvent({
      event: 'funnel_abandonment',
      funnel_id: params.funnelId,
      exit_step: params.exitStep,
      time_spent: params.timeSpent,
      abandonment_reason: params.reason || 'user_exit',
    });
  }, [pushEvent]);

  const trackFunnelConversion = useCallback((params: {
    funnelId: string;
    conversionValue: number;
    stepsCompleted: number;
    conversionType?: string;
  }) => {
    pushEvent({
      event: 'funnel_conversion',
      funnel_id: params.funnelId,
      conversion_value: params.conversionValue,
      conversion_time: Date.now(),
      steps_completed: params.stepsCompleted,
      conversion_type: params.conversionType || 'purchase',
    });
  }, [pushEvent]);

  // Tracking específico para o funil principal
  const trackMainFunnelProgress = useCallback((step: 'homepage' | 'engagement' | 'personalization' | 'product_selection' | 'lead_generation' | 'purchase') => {
    const stepMap = {
      homepage: { name: 'Página Inicial', number: 1 },
      engagement: { name: 'Engajamento com Conteúdo', number: 2 },
      personalization: { name: 'Início da Personalização', number: 3 },
      product_selection: { name: 'Seleção de Produto', number: 4 },
      lead_generation: { name: 'Dados Preenchidos', number: 5 },
      purchase: { name: 'Compra Finalizada', number: 6 }
    };

    const stepInfo = stepMap[step];
    trackFunnelStep({
      funnelId: 'main_conversion_funnel',
      stepName: stepInfo.name,
      stepNumber: stepInfo.number
    });
  }, [trackFunnelStep]);

  // Tracking específico para funil de vídeo
  const trackVideoFunnelProgress = useCallback((step: 'page_view' | 'video_start' | 'video_25' | 'video_50' | 'video_complete' | 'cta_click') => {
    const stepMap = {
      page_view: { name: 'Visualização da Página', number: 1 },
      video_start: { name: 'Início do Vídeo', number: 2 },
      video_25: { name: '25% do Vídeo', number: 3 },
      video_50: { name: '50% do Vídeo', number: 4 },
      video_complete: { name: 'Vídeo Completo', number: 5 },
      cta_click: { name: 'CTA Clicado', number: 6 }
    };

    const stepInfo = stepMap[step];
    trackFunnelStep({
      funnelId: 'video_engagement_funnel',
      stepName: stepInfo.name,
      stepNumber: stepInfo.number
    });
  }, [trackFunnelStep]);

  return {
    // Função principal
    pushEvent,
    
    // Eventos específicos
    trackPageView,
    trackStepProgress,
    trackFormInteraction,
    trackProductInteraction,
    trackBeginCheckout,
    trackCustomEvent,
    
    // Tracking de funis
    trackFunnelStep,
    trackFunnelAbandonment,
    trackFunnelConversion,
    trackMainFunnelProgress,
    trackVideoFunnelProgress,
    
    // Utilitários
    initializeDataLayer,
  };
};