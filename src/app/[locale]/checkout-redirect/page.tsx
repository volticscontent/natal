'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCheckoutPageTitle } from '@/hooks/usePageTitle';
import { useSmartTracking } from '@/hooks/useSmartTracking';

export default function CheckoutRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent } = useSmartTracking();
  
  // Título dinâmico da página
  useCheckoutPageTitle('pt'); // Default para português, pode ser melhorado com locale dinâmico

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const checkoutUrl = searchParams.get('checkout_url');

    if (!checkoutUrl) {
      return;
    }

    try {
      const decodedUrl = decodeURIComponent(checkoutUrl);
      const pvKey = 'pv_checkout_begin';
      if (!sessionStorage.getItem(pvKey)) {
        trackEvent('begin_checkout', 'high', {
          product_type: 'video_personalizado',
          price: 49.99,
          session_id: sessionId || ''
        });
        try {
          if (typeof window !== 'undefined' && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
            (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'InitiateCheckout', {
              value: 49.99,
              currency: 'BRL',
              content_type: 'product',
              num_items: 1
            });
          }
        } catch {}
        sessionStorage.setItem(pvKey, '1');
      }
      window.location.href = decodedUrl;
    } catch (err) {
      console.error('Erro ao redirecionar para checkout:', err);
    }
  }, [searchParams, router, trackEvent]);
  return null;
}
