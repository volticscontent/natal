import { useEffect, useState } from 'react';

interface UtmifyEvent {
  event: string;
  [key: string]: any;
}

interface UtmifyConfig {
  pixelId: string;
  apiUrl?: string;
}

declare global {
  interface Window {
    dataLayer: any[];
    utmify: {
      track: (event: string, data?: any) => void;
      init: (pixelId: string) => void;
    };
  }
}

export function useUtmify() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [config] = useState<UtmifyConfig>({
    pixelId: process.env.NEXT_PUBLIC_UTMFY_PIXEL_ID || '',
    apiUrl: process.env.NEXT_PUBLIC_UTMFY_API_URL || ''
  });

  useEffect(() => {
    // Verificar se o script da UTMify foi carregado
    const checkUtmifyLoaded = () => {
      if (typeof window !== 'undefined' && window.dataLayer) {
        setIsLoaded(true);
      }
    };

    // Verificar imediatamente
    checkUtmifyLoaded();

    // Verificar periodicamente até carregar
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.dataLayer) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    // Limpar interval após 10 segundos
    setTimeout(() => clearInterval(interval), 10000);

    return () => clearInterval(interval);
  }, []);

  const trackEvent = (eventName: string, eventData?: any) => {
    if (typeof window === 'undefined' || !isLoaded) {
      console.warn('UTMify não está carregada ainda');
      return;
    }

    try {
      // Enviar evento para o dataLayer da UTMify
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...eventData
      });

      console.log('Evento UTMify enviado:', { event: eventName, ...eventData });
    } catch (error) {
      console.error('Erro ao enviar evento para UTMify:', error);
    }
  };

  const trackPageView = (pageName?: string, additionalData?: any) => {
    trackEvent('page_view', {
      page_title: pageName || document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...additionalData
    });
  };

  const trackPurchase = (transactionData: {
    transaction_id: string;
    value: number;
    currency?: string;
    items?: any[];
  }) => {
    trackEvent('purchase', {
      transaction_id: transactionData.transaction_id,
      value: transactionData.value,
      currency: transactionData.currency || 'BRL',
      items: transactionData.items || []
    });
  };

  const trackAddToCart = (itemData: {
    item_id: string;
    item_name: string;
    value: number;
    quantity?: number;
  }) => {
    trackEvent('add_to_cart', {
      currency: 'BRL',
      value: itemData.value,
      items: [{
        item_id: itemData.item_id,
        item_name: itemData.item_name,
        quantity: itemData.quantity || 1,
        price: itemData.value
      }]
    });
  };

  const trackBeginCheckout = (checkoutData?: {
    value: number;
    currency?: string;
    items?: any[];
  }) => {
    trackEvent('begin_checkout', {
      currency: checkoutData?.currency || 'BRL',
      value: checkoutData?.value || 0,
      items: checkoutData?.items || []
    });
  };

  return {
    isLoaded,
    config,
    trackEvent,
    trackPageView,
    trackPurchase,
    trackAddToCart,
    trackBeginCheckout
  };
}