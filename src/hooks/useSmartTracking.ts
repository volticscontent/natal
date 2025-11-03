'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useUtmTracking } from './useUtmTracking';
import { useUtmify } from './useUtmify';

// Tipos de eventos do funil
export type FunnelEvent = 
  | 'funnel_start'
  | 'step_completed'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'page_view'
  | 'form_interaction'
  | 'product_view'
  | 'video_engagement'
  | 'scroll_depth'
  | 'error_tracking'
  | 'exit_intent'
  | 'session_quality'
  | 'perspgview1'
  | 'perspgview2'
  | 'perspgview3'
  | 'step_3_begin_checkout';

export type EventPriority = 'high' | 'medium' | 'low';

interface TrackingEvent {
  event: FunnelEvent;
  priority: EventPriority;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

interface FunnelStep {
  step: number;
  name: string;
  url: string;
  completed_at?: number;
}

interface SessionData {
  session_id: string;
  utm_params: Record<string, string>;
  funnel_steps: FunnelStep[];
  total_value: number;
  products: string[];
  order_bumps: string[];
  start_time: number;
  last_activity: number;
}

export function useSmartTracking() {
  const { sessionId, utmParams } = useUtmTracking();
  const { trackEvent: trackUtmifyEvent, isLoaded: utmifyLoaded } = useUtmify();
  const sessionData = useRef<SessionData | null>(null);
  const eventQueue = useRef<TrackingEvent[]>([]);
  const isInitialized = useRef(false);

  // Inicializar sessão de tracking
  useEffect(() => {
    if (sessionId && !isInitialized.current) {
      sessionData.current = {
        session_id: sessionId || '',
        utm_params: Object.fromEntries(
          Object.entries(utmParams).filter(([, value]) => value !== undefined)
        ) as Record<string, string>,
        funnel_steps: [],
        total_value: 0,
        products: [],
        order_bumps: [],
        start_time: Date.now(),
        last_activity: Date.now()
      };
      isInitialized.current = true;
      
      // Removido o disparo automático do funnel_start para evitar InitiateCheckout automático
      // O evento funnel_start agora deve ser disparado manualmente quando apropriado
      console.log('🎯 [SmartTracking] Sessão inicializada sem disparo automático de funnel_start');
    }
  }, [sessionId, utmParams]);

  // Mapear eventos para Facebook
  const mapToFacebookEvent = (event: FunnelEvent): string | null => {
    // Suprimir PageView em páginas de personalização para evitar duplicidade
    if (event === 'page_view') {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (path.includes('/pers/')) return null; // não enviar PageView no Facebook
      return 'PageView';
    }

    const mapping: Record<FunnelEvent, string | null> = {
      funnel_start: 'InitiateCheckout',
      step_completed: 'CompleteRegistration',
      add_to_cart: 'AddToCart',
      begin_checkout: 'InitiateCheckout',
      purchase: 'Purchase',
      product_view: 'ViewContent',
      form_interaction: 'Lead',
      video_engagement: 'ViewContent',
      scroll_depth: null,
      error_tracking: null,
      exit_intent: null,
      session_quality: null,
      page_view: null,
      // perspgviewX devem ser enviados como eventos customizados (trackCustom)
      perspgview1: null,
      perspgview2: null,
      perspgview3: null,
      step_3_begin_checkout: 'InitiateCheckout'
    };
    return mapping[event];
  };

  // Mapear eventos específicos para GA4 (perspgviewX -> page_view)
  const mapToGA4Event = (
    event: FunnelEvent
  ): { name: string; paramsEnhancer?: (p?: Record<string, unknown>) => Record<string, unknown> } => {
    const isPersPgView = event === 'perspgview1' || event === 'perspgview2' || event === 'perspgview3';
    if (isPersPgView) {
      return {
        name: 'page_view',
        paramsEnhancer: (p = {}) => ({
          page_title: typeof document !== 'undefined' ? document.title : 'Personalização',
          page_location: typeof window !== 'undefined' ? window.location.href : undefined,
          content_group1: 'personalization',
          content_group2: event,
          ...p,
        }),
      };
    }
    return { name: event };
  };

  // Enviar eventos em batch
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];

    try {
      // Enviar para Google Analytics 4 (mapeando perspgviewX para page_view)
      if (typeof window !== 'undefined' && window.gtag) {
        eventsToSend.forEach(({ event, properties }) => {
          const mapped = mapToGA4Event(event);
          const params = mapped.paramsEnhancer ? mapped.paramsEnhancer(properties) : properties;
          window.gtag('event', mapped.name, params);
        });
      }

      // Enviar para Facebook Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        const isPersPage = typeof window !== 'undefined' && window.location.pathname.includes('/pers/');
        eventsToSend.forEach(({ event, properties }) => {
          const fbEvent = mapToFacebookEvent(event);
          // Não enviar nenhum page_view para Facebook em páginas de personalização
          if (event === 'page_view' && isPersPage) {
            return; // skip completamente
          }
          if (fbEvent) {
            // Eventos padrão
            window.fbq('track', fbEvent, properties);
          } else {
            // Eventos customizados devem aparecer com o nome real no Pixel Helper
            window.fbq('trackCustom', event as string, properties);
          }
        });
      }

      // Enviar para endpoint personalizado (opcional)
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.current?.session_id,
          events: eventsToSend
        })
      }).catch(err => console.warn('Tracking endpoint error:', err));

    } catch (error) {
      console.error('Error flushing tracking events:', error);
      // Re-adicionar eventos à fila em caso de erro
      eventQueue.current.unshift(...eventsToSend);
    }
  }, []);

  // Agendar envio de eventos
  const scheduleEventFlush = useCallback(() => {
    setTimeout(flushEvents, 2000); // Enviar a cada 2 segundos
  }, [flushEvents]);

  // Função principal de tracking
  const trackEvent = useCallback((
    event: FunnelEvent,
    priority: EventPriority = 'medium',
    properties: Record<string, unknown> = {}
  ) => {
    if (!sessionData.current) return;

    const trackingEvent: TrackingEvent = {
      event,
      priority,
      properties: {
        ...properties,
        session_id: sessionData.current.session_id,
        timestamp: Date.now(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        ...sessionData.current.utm_params
      },
      timestamp: Date.now()
    };

    // Atualizar última atividade
    sessionData.current.last_activity = Date.now();

    // Adicionar à fila de eventos
    eventQueue.current.push(trackingEvent);

    // Enviar para UTMify se carregada
    if (utmifyLoaded && trackUtmifyEvent) {
      trackUtmifyEvent(event, {
        ...properties,
        session_id: sessionData.current.session_id,
        ...sessionData.current.utm_params
      });
    }

    // Enviar eventos de alta prioridade imediatamente
    if (priority === 'high') {
      flushEvents();
    } else {
      // Agendar envio em batch para eventos de menor prioridade
      scheduleEventFlush();
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 [SmartTracking] ${event}:`, trackingEvent);
    }
  }, [flushEvents, scheduleEventFlush, utmifyLoaded, trackUtmifyEvent]);

  // Tracking específico para steps do funil
  const trackStepCompleted = useCallback((step: number, stepName: string) => {
    if (!sessionData.current) return;

    const stepData: FunnelStep = {
      step,
      name: stepName,
      url: window.location.href,
      completed_at: Date.now()
    };

    sessionData.current.funnel_steps.push(stepData);

    trackEvent('step_completed', 'high', {
      step_number: step,
      step_name: stepName,
      funnel_progress: `${step}/3`,
      time_on_step: calculateTimeOnStep(step)
    });
  }, [trackEvent]);

  // Calcular tempo gasto em cada step
  const calculateTimeOnStep = (currentStep: number): number => {
    if (!sessionData.current) return 0;
    
    const previousStep = sessionData.current.funnel_steps
      .filter(s => s.step === currentStep - 1)
      .pop();
    
    if (!previousStep) return Date.now() - sessionData.current.start_time;
    
    return Date.now() - (previousStep.completed_at || sessionData.current.start_time);
  };

  // Tracking de produtos e carrinho
  const trackAddToCart = useCallback((products: string[], orderBumps: string[], totalValue: number) => {
    if (!sessionData.current) return;

    sessionData.current.products = products;
    sessionData.current.order_bumps = orderBumps;
    sessionData.current.total_value = totalValue;

    trackEvent('add_to_cart', 'high', {
      products,
      order_bumps: orderBumps,
      total_value: totalValue,
      currency: 'BRL',
      num_items: products.length + orderBumps.length
    });
  }, [trackEvent]);

  // Tracking de interações com formulário
  const trackFormInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    trackEvent('form_interaction', 'low', {
      field_name: fieldName,
      action,
      step: getCurrentStep()
    });
  }, [trackEvent]);

  // Obter step atual baseado na URL
  const getCurrentStep = (): number => {
    const path = window.location.pathname;
    if (path.includes('/pers/1')) return 1;
    if (path.includes('/pers/2')) return 2;
    if (path.includes('/pers/3')) return 3;
    return 0;
  };

  // Tracking de scroll depth
  const trackScrollDepth = useCallback((depth: number) => {
    trackEvent('scroll_depth', 'low', {
      scroll_depth: depth,
      page: window.location.pathname
    });
  }, [trackEvent]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      flushEvents(); // Enviar eventos pendentes
    };
  }, [flushEvents]);

  // Tracking de progresso principal do funil
  const trackMainFunnelProgress = useCallback((step: string) => {
    trackEvent('funnel_start', 'high', {
      step,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  // Tracking de conversão do funil
  const trackFunnelConversion = useCallback((data: Record<string, unknown>) => {
    trackEvent('purchase', 'high', {
      ...data,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackStepCompleted,
    trackAddToCart,
    trackFormInteraction,
    trackScrollDepth,
    trackMainFunnelProgress,
    trackFunnelConversion,
    flushEvents,
    sessionData: sessionData.current,
    isInitialized: isInitialized.current
  };
}

// Tipos para window.gtag e window.fbq
declare global {
  interface Window {
    gtag: (command: string, targetId?: string, config?: Record<string, unknown>) => void;
    fbq: (command: string, eventName?: string, parameters?: Record<string, unknown>) => void;
  }
}