'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useUtmTracking } from './useUtmTracking';

// Tipos para Enhanced Ecommerce
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant?: string;
  price: number;
  quantity: number;
  currency?: string;
  item_brand?: string;
  item_list_name?: string;
  item_list_id?: string;
  index?: number;
}

export interface PurchaseData {
  transaction_id: string;
  value: number;
  currency: string;
  items: EcommerceItem[];
  coupon?: string;
  shipping?: number;
  tax?: number;
  affiliation?: string;
}

export interface UserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  };
}

// Tipo para dados do Facebook Pixel
interface FacebookPixelData {
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
  num_items: number;
  em?: string; // email
  ph?: string; // phone
  fn?: string; // first name
  ln?: string; // last name
  [key: string]: unknown; // Index signature para permitir propriedades dinâmicas
}

interface ClickData {
  element_selector: string;
  element_text: string;
  element_tag: string;
  click_x: number;
  click_y: number;
  page_x: number;
  page_y: number;
  timestamp: number;
  session_id: string;
}

export function useAdvancedTracking() {
  const { sessionId, utmParams } = useUtmTracking();
  const scrollDepthRef = useRef<Set<number>>(new Set());
  const clickMapRef = useRef<Map<string, number>>(new Map());
  const sessionStartRef = useRef<number>(Date.now());

  // Inicializar DataLayer se não existir
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.dataLayer) {
      window.dataLayer = [];
    }
  }, []);

  // Tracking de scroll depth com throttling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      // Throttle scroll events para evitar sobrecarga
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100);
        
        // Armazenar apenas marcos importantes (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        const milestone = milestones.find(m => scrollPercentage >= m && !scrollDepthRef.current.has(m));
        
        if (milestone) {
          scrollDepthRef.current.add(milestone);
          
          // Usar requestIdleCallback para tracking não-crítico
          const sendTracking = () => {
            // Enviar para GA4
            if (window.gtag) {
              window.gtag('event', 'scroll', {
                event_category: 'engagement',
                event_label: `${milestone}%`,
                value: milestone,
                custom_parameter_1: sessionId
              });
            }

            // Enviar para DataLayer
            if (window.dataLayer) {
              window.dataLayer.push({
                event: 'scroll_depth',
                scroll_depth: milestone,
                session_id: sessionId || 'unknown',
                ...utmParams
              });
            }
          };

          if (window.requestIdleCallback) {
            window.requestIdleCallback(sendTracking, { timeout: 1000 });
          } else {
            setTimeout(sendTracking, 0);
          }
        }
        
        scrollTimeout = null;
      }, 100); // Throttle de 100ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [sessionId, utmParams]);

  // Tracking de mapa de calor - Click Tracking com debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let clickQueue: Array<{
      selector: string;
      clickData: ClickData;
    }> = [];
    let processTimeout: NodeJS.Timeout | null = null;

    const processClickQueue = () => {
      if (clickQueue.length === 0) return;

      const clicksToProcess = [...clickQueue];
      clickQueue = [];

      // Processar em idle callback para não bloquear UI
      const processClicks = () => {
        clicksToProcess.forEach(({ selector, clickData }) => {
          // Incrementar contador de cliques
          const currentCount = clickMapRef.current.get(selector) || 0;
          clickMapRef.current.set(selector, currentCount + 1);

          // Enviar para GA4
          if (window.gtag) {
            window.gtag('event', 'click', {
              event_category: 'engagement',
              event_label: selector,
              custom_parameter_1: sessionId,
              custom_parameter_2: clickData.element_tag
            });
          }

          // Enviar para DataLayer
          if (window.dataLayer) {
            window.dataLayer.push({
              event: 'element_click',
              ...clickData,
              ...utmParams
            });
          }
        });
      };

      if (window.requestIdleCallback) {
        window.requestIdleCallback(processClicks, { timeout: 2000 });
      } else {
        setTimeout(processClicks, 0);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const selector = getElementSelector(target);
      
      // Capturar dados do clique (operação rápida)
      const clickData = {
        element_selector: selector,
        element_text: target.textContent?.slice(0, 50) || '', // Reduzido de 100 para 50
        element_tag: target.tagName.toLowerCase(),
        click_x: event.clientX,
        click_y: event.clientY,
        page_x: event.pageX,
        page_y: event.pageY,
        timestamp: Date.now(),
        session_id: sessionId || 'unknown'
      };

      // Adicionar à fila para processamento em batch
      clickQueue.push({ selector, clickData });

      // Debounce: processar após 200ms de inatividade ou quando fila atingir 5 itens
      if (processTimeout) clearTimeout(processTimeout);
      
      if (clickQueue.length >= 5) {
        processClickQueue();
      } else {
        processTimeout = setTimeout(processClickQueue, 200);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      if (processTimeout) clearTimeout(processTimeout);
      // Processar cliques pendentes na limpeza
      if (clickQueue.length > 0) processClickQueue();
    };
  }, [sessionId, utmParams]);

  // Função para obter seletor único do elemento
  const getElementSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  };

  // Enhanced Ecommerce - View Item
  const trackViewItem = useCallback((item: EcommerceItem) => {
    const eventData = {
      event: 'view_item',
      currency: item.currency || 'BRL',
      value: item.price,
      items: [item],
      session_id: sessionId || 'unknown',
      ...utmParams
    };

    // GA4
    if (window.gtag) {
      window.gtag('event', 'view_item', eventData);
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [item.item_id],
        content_type: 'product',
        value: item.price,
        currency: item.currency || 'BRL'
      });
    }

    // DataLayer
    if (window.dataLayer) {
      window.dataLayer.push(eventData);
    }
  }, [sessionId, utmParams]);

  // Enhanced Ecommerce - Add to Cart
  const trackAddToCart = useCallback((item: EcommerceItem) => {
    const eventData = {
      event: 'add_to_cart',
      currency: item.currency || 'BRL',
      value: item.price * item.quantity,
      items: [item],
      session_id: sessionId || 'unknown',
      ...utmParams
    };

    // GA4
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', eventData);
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [item.item_id],
        content_type: 'product',
        value: item.price * item.quantity,
        currency: item.currency || 'BRL'
      });
    }

    // TikTok Pixel
    if (window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: item.item_id,
        content_type: 'product',
        value: item.price * item.quantity,
        currency: item.currency || 'BRL'
      });
    }

    // DataLayer
    if (window.dataLayer) {
      window.dataLayer.push(eventData);
    }
  }, [sessionId, utmParams]);

  // Enhanced Ecommerce - Begin Checkout
  const trackBeginCheckout = useCallback((items: EcommerceItem[], value: number) => {
    const eventData = {
      event: 'begin_checkout',
      currency: 'BRL',
      value: value,
      items: items,
      session_id: sessionId || 'unknown',
      ...utmParams
    };

    // GA4
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', eventData);
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: items.map(item => item.item_id),
        content_type: 'product',
        value: value,
        currency: 'BRL',
        num_items: items.length
      });
    }

    // DataLayer
    if (window.dataLayer) {
      window.dataLayer.push(eventData);
    }
  }, [sessionId, utmParams]);

  // Enhanced Ecommerce - Purchase com Enhanced Conversions
  const trackPurchase = useCallback((purchaseData: PurchaseData, userData?: UserData) => {
    const eventData = {
      event: 'purchase',
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.value,
      currency: purchaseData.currency,
      items: purchaseData.items,
      coupon: purchaseData.coupon,
      shipping: purchaseData.shipping,
      tax: purchaseData.tax,
      session_id: sessionId || 'unknown',
      ...utmParams
    };

    // GA4 com Enhanced Conversions
    if (window.gtag) {
      // Evento de compra padrão
      window.gtag('event', 'purchase', eventData);

      // Enhanced Conversions (dados de primeira parte)
      if (userData) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
          user_data: {
            email_address: userData.email,
            phone_number: userData.phone,
            first_name: userData.first_name,
            last_name: userData.last_name,
            address: userData.address
          }
        });
      }
    }

    // Facebook Pixel com Enhanced Matching
    if (window.fbq) {
      const fbData: FacebookPixelData = {
        content_ids: purchaseData.items.map(item => item.item_id),
        content_type: 'product',
        value: purchaseData.value,
        currency: purchaseData.currency,
        num_items: purchaseData.items.length
      };

      // Enhanced Matching
      if (userData) {
        fbData.em = userData.email; // Email hash será feito automaticamente pelo pixel
        fbData.ph = userData.phone;
        fbData.fn = userData.first_name;
        fbData.ln = userData.last_name;
      }

      window.fbq('track', 'Purchase', fbData);
    }

    // TikTok Pixel
    if (window.ttq) {
      window.ttq.track('CompletePayment', {
        content_id: purchaseData.items.map(item => item.item_id).join(','),
        content_type: 'product',
        value: purchaseData.value,
        currency: purchaseData.currency
      });
    }

    // DataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        ...eventData,
        user_data: userData
      });
    }
  }, [sessionId, utmParams]);

  // Configurar User ID para correspondência entre sessões
  const setUserId = useCallback((userId: string) => {
    // GA4
    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
        user_id: userId,
        custom_map: {
          custom_parameter_1: 'session_id',
          custom_parameter_2: 'utm_source',
          custom_parameter_3: 'utm_campaign'
        }
      });
    }

    // Facebook Pixel - Apenas definir external_id se já estiver inicializado
    if (window.fbq && userId) {
      window.fbq('set', 'external_id', userId);
    }

    // DataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'user_id_set',
        user_id: userId,
        session_id: sessionId
      });
    }
  }, [sessionId]);

  // Obter dados da sessão para análise
  const getSessionData = useCallback(() => {
    return {
      session_id: sessionId || 'unknown',
      session_duration: Date.now() - sessionStartRef.current,
      scroll_depths: Array.from(scrollDepthRef.current),
      click_map: Object.fromEntries(clickMapRef.current),
      utm_params: utmParams,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: sessionStartRef.current,
      page_load_time: Date.now() - sessionStartRef.current
    };
  }, [sessionId, utmParams]);

  return {
    // Enhanced Ecommerce
    trackViewItem,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    
    // User Management
    setUserId,
    
    // Session Data
    getSessionData,
    
    // Dados da sessão
    sessionId,
    utmParams
  };
}

export default useAdvancedTracking;
