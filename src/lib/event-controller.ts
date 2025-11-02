'use client';

import { TRACKING_CONFIG, shouldTrackEvent, createEventDebouncer } from './tracking-optimization';

/**
 * Controlador de eventos para otimizar tracking
 * Evita duplicações e controla frequência de envio
 */
class EventController {
  private eventQueue: Map<string, any> = new Map();
  private sessionEventCount: number = 0;
  private lastEvents: Map<string, number> = new Map();
  private debouncers: Map<string, ReturnType<typeof createEventDebouncer>> = new Map();
  
  constructor() {
    // Recuperar contador de sessão do sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('tracking_event_count');
      this.sessionEventCount = stored ? parseInt(stored, 10) : 0;
    }
  }

  /**
   * Cria uma versão serializável do evento removendo propriedades circulares
   */
  private createSerializableEvent(eventData: any): any {
    return this.deepCleanObject(eventData, new WeakSet());
  }

  /**
   * Função recursiva para limpar objetos de referências circulares
   */
  private deepCleanObject(obj: any, seen: WeakSet<object>): any {
    // Valores primitivos passam direto
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Verificar se já vimos este objeto (referência circular)
    if (seen.has(obj)) {
      return '[Circular Reference]';
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
      return '[DOM Element]';
    }

    // Verificar se é uma função
    if (typeof obj === 'function') {
      return '[Function]';
    }

    // Verificar se é window, document ou outros objetos globais
    if (obj === window || obj === document || obj === global) {
      return '[Global Object]';
    }

    // Adicionar à lista de objetos vistos
    seen.add(obj);

    try {
      // Processar arrays
      if (Array.isArray(obj)) {
        return obj.map(item => this.deepCleanObject(item, seen));
      }

      // Processar objetos
      const cleaned: any = {};
      for (const key in obj) {
        // Filtrar propriedades problemáticas
        if (key.startsWith('__react') ||
            key.startsWith('_react') ||
            key.startsWith('__') ||
            key === 'nativeEvent' ||
            key === 'currentTarget' ||
            key === 'target' ||
            key === 'stateNode' ||
            key === 'return' ||
            key === 'child' ||
            key === 'sibling' ||
            key === 'alternate') {
          continue;
        }

        if (obj.hasOwnProperty(key)) {
          try {
            cleaned[key] = this.deepCleanObject(obj[key], seen);
          } catch (error) {
            // Se houver erro na serialização de uma propriedade específica, pular
            cleaned[key] = '[Serialization Error]';
          }
        }
      }

      return cleaned;
    } catch (error) {
      return '[Object Serialization Error]';
    }
  }

  /**
   * Processa um evento antes de enviá-lo
   */
  processEvent(eventName: string, eventData: any): boolean {
    // Verificar se deve enviar o evento
    if (!shouldTrackEvent(eventName, this.sessionEventCount)) {
      console.log(`[EventController] Evento ${eventName} filtrado por sampling/limite`);
      return false;
    }

    // Verificar duplicação recente (últimos 5 segundos)
    const now = Date.now();
    const serializableEvent = this.createSerializableEvent(eventData);
    const eventKey = `${eventName}_${JSON.stringify(serializableEvent)}`;
    const lastTime = this.lastEvents.get(eventKey);
    
    if (lastTime && (now - lastTime) < 5000) {
      console.log(`[EventController] Evento duplicado ignorado: ${eventName}`);
      return false;
    }

    // Aplicar debounce para eventos específicos
    if (TRACKING_CONFIG.DEBOUNCEABLE_EVENTS.includes(eventName)) {
      return this.debounceEvent(eventName, eventData);
    }

    // Registrar evento
    this.registerEvent(eventKey, now);
    return true;
  }

  /**
   * Aplica debounce para eventos específicos
   */
  private debounceEvent(eventName: string, eventData: any): boolean {
    if (!this.debouncers.has(eventName)) {
      this.debouncers.set(eventName, createEventDebouncer());
    }

    const debouncer = this.debouncers.get(eventName)!;
    const serializableEvent = this.createSerializableEvent(eventData);
    const eventKey = `${eventName}_${JSON.stringify(serializableEvent)}`;
    
    debouncer(() => {
      this.registerEvent(eventKey, Date.now());
      // Enviar evento após debounce
      this.sendDebouncedEvent(eventName, eventData);
    });

    return false; // Não enviar imediatamente
  }

  /**
   * Envia evento após debounce
   */
  private sendDebouncedEvent(eventName: string, eventData: any) {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventData,
        _debounced: true
      });
    }
  }

  /**
   * Registra evento enviado
   */
  private registerEvent(eventKey: string, timestamp: number) {
    this.lastEvents.set(eventKey, timestamp);
    this.sessionEventCount++;
    
    // Salvar contador no sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tracking_event_count', this.sessionEventCount.toString());
    }

    // Limpar eventos antigos (mais de 1 minuto)
    const cutoff = timestamp - 60000;
    for (const [key, time] of this.lastEvents.entries()) {
      if (time < cutoff) {
        this.lastEvents.delete(key);
      }
    }
  }

  /**
   * Obtém estatísticas de eventos
   */
  getStats() {
    return {
      sessionEventCount: this.sessionEventCount,
      recentEventsCount: this.lastEvents.size,
      debugMode: TRACKING_CONFIG.DEBUG_MODE
    };
  }

  /**
   * Reseta contador de sessão
   */
  resetSession() {
    this.sessionEventCount = 0;
    this.lastEvents.clear();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tracking_event_count');
    }
  }
}

// Instância singleton
export const eventController = new EventController();

/**
 * Hook para usar o controlador de eventos
 */
export function useEventController() {
  return {
    processEvent: (eventName: string, eventData: any) => 
      eventController.processEvent(eventName, eventData),
    getStats: () => eventController.getStats(),
    resetSession: () => eventController.resetSession()
  };
}