// Biblioteca para disparar eventos GA4 customizados no frontend

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

interface CartaEventData {
  page_location?: string;
  user_language?: string;
  personalization_step?: string;
  user_age?: number;
  user_name?: string;
  carta_length?: number;
  time_spent_writing?: number;
  product_type?: string;
  price?: number;
  payment_method?: string;
  amount?: number;
  currency?: string;
  total_time?: number;
  final_price?: number;
  delivery_method?: string;
  abandoned_step?: string;
  cta_source?: string;
  time_spent?: number;
  error_type?: string;
  error_message?: string;
  current_step?: string;
  help_type?: string;
}

class GA4Events {
  private static isGtagLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  private static sendEvent(eventName: string, parameters: CartaEventData = {}) {
    if (!this.isGtagLoaded()) {
      console.warn('GA4 gtag não carregado, evento não enviado:', eventName);
      return;
    }

    // Adicionar dados padrão
    const defaultParams = {
      page_location: window.location.href,
      user_language: navigator.language || 'pt-BR',
      timestamp: new Date().toISOString()
    };

    const eventData = { ...defaultParams, ...parameters };

    window.gtag('event', eventName, eventData);
    
    console.log(`📊 GA4 Event: ${eventName}`, eventData);
  }

  // 1. Carta Iniciada
  static cartaIniciada(params: {
    page_location?: string;
    user_language?: string;
    cta_source?: string;
  } = {}) {
    this.sendEvent('carta_iniciada', {
      page_location: params.page_location || window.location.href,
      user_language: params.user_language || navigator.language,
      cta_source: params.cta_source
    });
  }

  // 2. Carta Personalizada
  static cartaPersonalizada(params: {
    personalization_step: string;
    user_age?: number;
    user_name?: string;
  }) {
    this.sendEvent('carta_personalizada', {
      personalization_step: params.personalization_step,
      user_age: params.user_age,
      user_name: params.user_name ? 'provided' : 'not_provided' // Não enviar nome real por privacidade
    });
  }

  // 3. Carta Escrita
  static cartaEscrita(params: {
    carta_length: number;
    time_spent_writing: number;
  }) {
    this.sendEvent('carta_escrita', {
      carta_length: params.carta_length,
      time_spent_writing: params.time_spent_writing
    });
  }

  // 4. Checkout Iniciado
  static checkoutIniciado(params: {
    product_type: string;
    price: number;
  }) {
    this.sendEvent('checkout_iniciado', {
      product_type: params.product_type,
      price: params.price,
      currency: 'BRL'
    });
  }

  // 5. Pagamento Processado
  static pagamentoProcessado(params: {
    payment_method: string;
    amount: number;
    currency?: string;
  }) {
    this.sendEvent('pagamento_processado', {
      payment_method: params.payment_method,
      amount: params.amount,
      currency: params.currency || 'BRL'
    });
  }

  // 6. Carta Finalizada (Conversão Principal)
  static cartaFinalizada(params: {
    total_time: number;
    final_price: number;
    delivery_method: string;
  }) {
    this.sendEvent('carta_finalizada', {
      total_time: params.total_time,
      final_price: params.final_price,
      delivery_method: params.delivery_method,
      currency: 'BRL'
    });
  }

  // Eventos auxiliares para análise
  static stepAbandoned(step: string, timeSpent: number) {
    this.sendEvent('step_abandoned', {
      abandoned_step: step,
      time_spent: timeSpent
    });
  }

  static errorOccurred(errorType: string, errorMessage: string, step: string) {
    this.sendEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      current_step: step
    });
  }

  static helpRequested(helpType: string, currentStep: string) {
    this.sendEvent('help_requested', {
      help_type: helpType,
      current_step: currentStep
    });
  }
}

// Hook React para tracking automático
export function useGA4Tracking() {
  const trackCartaIniciada = (params?: Parameters<typeof GA4Events.cartaIniciada>[0]) => {
    GA4Events.cartaIniciada(params);
  };

  const trackCartaPersonalizada = (params: Parameters<typeof GA4Events.cartaPersonalizada>[0]) => {
    GA4Events.cartaPersonalizada(params);
  };

  const trackCartaEscrita = (params: Parameters<typeof GA4Events.cartaEscrita>[0]) => {
    GA4Events.cartaEscrita(params);
  };

  const trackCheckoutIniciado = (params: Parameters<typeof GA4Events.checkoutIniciado>[0]) => {
    GA4Events.checkoutIniciado(params);
  };

  const trackPagamentoProcessado = (params: Parameters<typeof GA4Events.pagamentoProcessado>[0]) => {
    GA4Events.pagamentoProcessado(params);
  };

  const trackCartaFinalizada = (params: Parameters<typeof GA4Events.cartaFinalizada>[0]) => {
    GA4Events.cartaFinalizada(params);
  };

  const trackStepAbandoned = (step: string, timeSpent: number) => {
    GA4Events.stepAbandoned(step, timeSpent);
  };

  const trackError = (errorType: string, errorMessage: string, step: string) => {
    GA4Events.errorOccurred(errorType, errorMessage, step);
  };

  const trackHelpRequested = (helpType: string, currentStep: string) => {
    GA4Events.helpRequested(helpType, currentStep);
  };

  return {
    trackCartaIniciada,
    trackCartaPersonalizada,
    trackCartaEscrita,
    trackCheckoutIniciado,
    trackPagamentoProcessado,
    trackCartaFinalizada,
    trackStepAbandoned,
    trackError,
    trackHelpRequested
  };
}

export default GA4Events;