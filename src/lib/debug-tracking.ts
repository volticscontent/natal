'use client';

// Sistema de tracking de debug para Meta e TikTok
// Mantém o tracking atual intacto e adiciona eventos de debug específicos

interface DebugEventData {
  event_name: string;
  debug_mode: boolean;
  timestamp: number;
  page_url: string;
  user_agent?: string;
  [key: string]: any;
}

class DebugTracker {
  private isEnabled: boolean;
  private facebookPixelId: string | null;
  private tiktokPixelId: string | null;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TRACKING_DEBUG === 'true';
    this.facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || null;
    this.tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || null;
  }

  private createDebugEventData(eventName: string, additionalData: Record<string, any> = {}): DebugEventData {
    return {
      event_name: eventName,
      debug_mode: true,
      timestamp: Date.now(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : '',
      ...additionalData
    };
  }

  private sendToFacebook(eventName: string, eventData: DebugEventData) {
    if (!this.isEnabled || !this.facebookPixelId || typeof window === 'undefined') return;

    try {
      // Enviar via Facebook Pixel
      if (window.fbq) {
        window.fbq('track', eventName, eventData);
        console.log(`[DEBUG] Facebook Pixel - ${eventName}:`, eventData);
      }

      // Também enviar via GTM DataLayer para garantir que chegue ao Facebook
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'facebook_debug_event',
          facebook_event_name: eventName,
          facebook_event_data: eventData
        });
      }
    } catch (error) {
      console.error(`[DEBUG] Erro ao enviar evento Facebook ${eventName}:`, error);
    }
  }

  private sendToTikTok(eventName: string, eventData: DebugEventData) {
    if (!this.isEnabled || !this.tiktokPixelId || typeof window === 'undefined') return;

    try {
      // Enviar via TikTok Pixel
      if (window.ttq && window.ttq.track) {
        window.ttq.track(eventName, eventData);
        console.log(`[DEBUG] TikTok Pixel - ${eventName}:`, eventData);
      }

      // Também enviar via GTM DataLayer para garantir que chegue ao TikTok
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'tiktok_debug_event',
          tiktok_event_name: eventName,
          tiktok_event_data: eventData
        });
      }
    } catch (error) {
      console.error(`[DEBUG] Erro ao enviar evento TikTok ${eventName}:`, error);
    }
  }

  private sendDebugEvent(eventName: string, additionalData: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    const eventData = this.createDebugEventData(eventName, additionalData);
    
    // Enviar para ambas as plataformas
    this.sendToFacebook(eventName, eventData);
    this.sendToTikTok(eventName, eventData);

    // Log geral para debug
    console.log(`[DEBUG] Evento enviado para Meta e TikTok - ${eventName}:`, eventData);
  }

  // Evento: page_viewhomepagedebug
  trackHomePageView() {
    this.sendDebugEvent('page_viewhomepagedebug', {
      page_type: 'homepage',
      content_category: 'landing_page',
      event_label: 'carta_natal_homepage_viewed'
    });
  }

  // Evento: cta1debug, cta2debug, cta3debug
  trackCTAClick(ctaNumber: number, ctaSource: string, ctaText?: string) {
    this.sendDebugEvent(`cta${ctaNumber}debug`, {
      cta_number: ctaNumber,
      cta_source: ctaSource,
      cta_text: ctaText || '',
      content_category: 'cta_interaction',
      event_label: `carta_cta_${ctaNumber}_clicked`
    });
  }

  // Evento: step1debug, step2debug, step3debug (step carregado)
  trackStepLoaded(stepNumber: number, stepName?: string) {
    const eventName = `step${stepNumber}debug`;
    this.sendDebugEvent(eventName, {
      step_number: stepNumber,
      step_name: stepName || `step_${stepNumber}`,
      step_action: 'loaded',
      content_category: 'personalization_flow',
      event_label: `carta_step_${stepNumber}_loaded`
    });
  }

  // Evento: step3formdebug (formulário preenchido)
  trackFormFilled(stepNumber: number = 3) {
    const eventName = 'step3formdebug';
    this.sendDebugEvent(eventName, {
      step_number: stepNumber,
      form_action: 'filled',
      content_category: 'form_interaction',
      event_label: `carta_form_step_${stepNumber}_filled`
    });
  }

  // Evento: goToLastlinkdebug (clique em finalizar)
  trackGoToLastLink(buttonText?: string, pageUrl?: string, additionalData?: Record<string, any>) {
    this.sendDebugEvent('goToLastlinkdebug', {
      action: 'finalize_click',
      content_category: 'conversion_intent',
      event_label: 'carta_checkout_initiated',
      button_text: buttonText || 'Finalizar',
      page_location: pageUrl || window.location.href,
      ...additionalData
    });
  }

  // Método para identificar automaticamente CTAs na página
  identifyCTANumber(element: Element): number {
    const ctaElement = element.closest('[data-cta-number]') as HTMLElement;
    if (ctaElement && ctaElement.dataset.ctaNumber) {
      return parseInt(ctaElement.dataset.ctaNumber, 10);
    }

    // Identificação baseada na posição/seção
    const section = element.closest('section, div[class*="Section"]');
    if (section) {
      const sectionClass = section.className.toLowerCase();
      
      // Hero Section = CTA 1
      if (sectionClass.includes('hero')) return 1;
      
      // Video Section = CTA 2  
      if (sectionClass.includes('video')) return 2;
      
      // Calendario/Desconto Section = CTA 3
      if (sectionClass.includes('calendario') || sectionClass.includes('desconto')) return 3;
    }

    // Fallback: baseado na ordem de aparição
    const allCTAs = document.querySelectorAll('button, a[href*="pers"], [role="button"]');
    const ctaIndex = Array.from(allCTAs).indexOf(element as Element);
    return Math.min(ctaIndex + 1, 3); // Máximo 3 CTAs
  }
}

// Instância global do tracker
export const debugTracker = new DebugTracker();

// Hook React para usar o debug tracker
export function useDebugTracking() {
  const safeExecute = (fn: () => void, functionName: string) => {
    try {
      if (debugTracker && typeof fn === 'function') {
        fn();
      }
    } catch (error) {
      console.warn(`Erro ao executar ${functionName}:`, error);
    }
  };

  return {
    trackHomePageView: () => safeExecute(() => debugTracker.trackHomePageView(), 'trackHomePageView'),
    trackCTAClick: (ctaNumber: number, ctaSource: string, ctaText?: string) => 
      safeExecute(() => debugTracker.trackCTAClick(ctaNumber, ctaSource, ctaText), 'trackCTAClick'),
    trackStepLoaded: (stepNumber: number, stepName?: string) => 
      safeExecute(() => debugTracker.trackStepLoaded(stepNumber, stepName), 'trackStepLoaded'),
    trackStepLoad: (stepNumber: number, stepName?: string) => 
      safeExecute(() => debugTracker.trackStepLoaded(stepNumber, stepName), 'trackStepLoad'),
    trackFormFilled: (stepNumber?: number) => 
      safeExecute(() => debugTracker.trackFormFilled(stepNumber), 'trackFormFilled'),
    trackFormFill: (stepNumber: number, stepName?: string, additionalData?: Record<string, any>) => 
      safeExecute(() => debugTracker.trackFormFilled(stepNumber), 'trackFormFill'),
    trackGoToLastLink: (buttonText?: string, pageUrl?: string, additionalData?: Record<string, any>) => 
      safeExecute(() => debugTracker.trackGoToLastLink(buttonText, pageUrl, additionalData), 'trackGoToLastLink'),
    trackFinalLinkClick: (buttonText?: string, pageUrl?: string, additionalData?: Record<string, any>) => 
      safeExecute(() => debugTracker.trackGoToLastLink(buttonText, pageUrl, additionalData), 'trackFinalLinkClick'),
    identifyCTANumber: (element: Element) => debugTracker?.identifyCTANumber(element) || 0
  };
}

// Função para inicializar tracking automático de CTAs
export function initializeDebugCTATracking() {
  if (typeof window === 'undefined') return;

  // Listener global para cliques em CTAs
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Identificar se é um CTA
    const ctaSelectors = [
      'button',
      'a[href*="pers"]',
      '[role="button"]',
      '.cta',
      '.btn',
      '[data-cta]'
    ];

    const isCTA = ctaSelectors.some(selector => 
      target.matches(selector) || target.closest(selector)
    );

    if (isCTA) {
      const ctaElement = ctaSelectors.reduce((found, selector) => 
        found || target.closest(selector), null as Element | null
      ) || target;

      const ctaNumber = debugTracker.identifyCTANumber(ctaElement);
      const ctaText = ctaElement.textContent?.trim() || '';
      const ctaSource = ctaElement.getAttribute('data-source') || 'homepage';

      debugTracker.trackCTAClick(ctaNumber, ctaSource, ctaText);
    }
  });

  console.log('[DEBUG] Sistema de tracking de debug inicializado para Meta e TikTok');
}

export default debugTracker;