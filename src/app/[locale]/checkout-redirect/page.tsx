'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CheckoutRedirectLoading from '@/components/CheckoutRedirectLoading';
import { useCheckoutPageTitle } from '@/hooks/usePageTitle';
import { useSmartTracking } from '@/hooks/useSmartTracking';

export default function CheckoutRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { trackEvent } = useSmartTracking();
  
  // Título dinâmico da página
  useCheckoutPageTitle('pt'); // Default para português, pode ser melhorado com locale dinâmico

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const checkoutUrl = searchParams.get('checkout_url');

    if (!sessionId) {
      setError('Sessão inválida. Redirecionando para a página inicial...');
      setTimeout(() => {
        router.push('/');
      }, 3000);
      return;
    }

    if (!checkoutUrl) {
      setError('URL de checkout não encontrada. Redirecionando para a página inicial...');
      setTimeout(() => {
        router.push('/');
      }, 3000);
      return;
    }

    // Aguarda um pouco para mostrar a tela de loading e depois redireciona
    const timer = setTimeout(() => {
      try {
        // Decodifica a URL do checkout
        const decodedUrl = decodeURIComponent(checkoutUrl);
        
        // Track GA4 - Checkout Iniciado (apenas uma vez por sessão)
        const pvKey = 'pv_checkout_begin';
        if (!sessionStorage.getItem(pvKey)) {
          trackEvent('begin_checkout', 'high', {
            product_type: 'video_personalizado',
            price: 49.99, // Preço base padrão
            session_id: sessionId
          });
          sessionStorage.setItem(pvKey, '1');
        }
        
        // Redireciona para o checkout
        window.location.href = decodedUrl;
      } catch (err) {
        console.error('Erro ao redirecionar para checkout:', err);
        setError('Erro ao processar o redirecionamento. Tente novamente.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    }, 2000); // 2 segundos de delay para mostrar a tela de loading

    return () => clearTimeout(timer);
  }, [searchParams, router, trackEvent]);

  const handleTimeout = () => {
    setError('O redirecionamento está demorando mais que o esperado. Redirecionando para a página inicial...');
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Ops! Algo deu errado
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            {error}
          </p>
          <button 
            onClick={() => router.push('/')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutRedirectLoading 
      message="Aguarde! Estamos registrando seus dados e te redirecionando para o pagamento!"
      onTimeout={handleTimeout}
      timeoutMs={30000}
    />
  );
}
