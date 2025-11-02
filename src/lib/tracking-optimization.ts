'use client';

/**
 * Configurações de otimização para tracking
 * Reduz eventos desnecessários e melhora performance
 */

export const TRACKING_CONFIG = {
  // Reduzir frequência de eventos de form_interaction
  FORM_INTERACTION_DEBOUNCE: 500, // ms
  
  // Eventos críticos que sempre devem ser enviados
  CRITICAL_EVENTS: [
    'page_view',
    'begin_checkout',
    'purchase',
    'lead',
    'step_progress'
  ],
  
  // Eventos que podem ser agrupados/debounced
  DEBOUNCEABLE_EVENTS: [
    'form_interaction',
    'scroll',
    'video_progress'
  ],
  
  // Desabilitar debug em produção
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  
  // Limitar eventos por sessão
  MAX_EVENTS_PER_SESSION: 100,
  
  // Sampling para eventos não-críticos (% de eventos enviados)
  NON_CRITICAL_SAMPLING_RATE: 0.1 // 10%
};

/**
 * Verifica se um evento deve ser enviado baseado na configuração
 */
export function shouldTrackEvent(eventName: string, sessionEventCount: number): boolean {
  // Sempre enviar eventos críticos
  if (TRACKING_CONFIG.CRITICAL_EVENTS.includes(eventName)) {
    return true;
  }
  
  // Limitar total de eventos por sessão
  if (sessionEventCount >= TRACKING_CONFIG.MAX_EVENTS_PER_SESSION) {
    return false;
  }
  
  // Sampling para eventos não-críticos
  if (!TRACKING_CONFIG.CRITICAL_EVENTS.includes(eventName)) {
    return Math.random() < TRACKING_CONFIG.NON_CRITICAL_SAMPLING_RATE;
  }
  
  return true;
}

/**
 * Debounce para eventos de form_interaction
 */
export function createEventDebouncer(delay: number = TRACKING_CONFIG.FORM_INTERACTION_DEBOUNCE) {
  let timeoutId: NodeJS.Timeout;
  
  return function(callback: () => void) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
}

/**
 * Configuração otimizada para GTM
 */
export const OPTIMIZED_GTM_CONFIG = {
  // Reduzir tags desnecessárias
  ENABLE_FACEBOOK: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
  ENABLE_TIKTOK: !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
  ENABLE_GA4: true,
  
  // Configurações de performance
  DEFER_NON_CRITICAL_TAGS: true,
  BATCH_EVENTS: true,
  
  // Configurações de debug
  DEBUG_MODE: TRACKING_CONFIG.DEBUG_MODE,
  CONSOLE_LOGGING: TRACKING_CONFIG.DEBUG_MODE
};