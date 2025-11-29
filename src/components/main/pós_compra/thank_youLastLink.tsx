'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useUtmTracking } from '@/hooks/useUtmTracking';

interface OrderData {
  session_id?: string;
  order_id?: string;
  customer_name?: string;
  children_count?: number;
  total_amount?: string;
}

export default function ThankYouLastLink() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData>({});
  const t = useTranslations('thankYouLastLink');
  
  // Inicializar UTM tracking para coletar UTMs quando o cliente retorna
  const { sessionId, utmParams } = useUtmTracking();

  useEffect(() => {
    // Log para debug - mostra que os UTMs foram coletados na página de thank you
    console.log('UTM Tracking na página Thank You (LastLink)', {
      sessionId,
      utmParams,
      url: window.location.href
    });
    
    // Capturar dados da URL (parâmetros do LastLink)
    const sessionIdParam = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    const customerName = searchParams.get('customer_name');
    const childrenCount = searchParams.get('children_count');
    const totalAmount = searchParams.get('total_amount');

    setOrderData({
      session_id: sessionIdParam || undefined,
      order_id: orderId || undefined,
      customer_name: customerName || undefined,
      children_count: childrenCount ? parseInt(childrenCount) : undefined,
      total_amount: totalAmount || undefined,
    });

    // Renderização imediata, sem loading

    // Limpar dados do localStorage após confirmação
    if (sessionIdParam) {
      localStorage.removeItem('pers_personalization_data');
      localStorage.removeItem('pers_session_data');
      localStorage.removeItem('pers_current_step');
    }
  }, [searchParams, sessionId, utmParams]);

  // Header color fixed to match logo background

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50">
      {/* Header */}
      <div className="shadow-sm" id="thankyou-header" style={{ backgroundColor: '#e02119' }}>
        <div className="max-w-4xl mx-auto px-4 py-2 md:py-4">
          <NextImage
            src="/images/mundo-do-noel.jpg"
            alt="Mundo do Noel"
            width={65}
            height={91}
            className="mx-auto h-14 w-auto md:h-20 -mb-2 md:-mb-3"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>

          {/* Personalized Message */}
          <div className="mb-8">
            {orderData.customer_name && (
              <p className="text-xl text-gray-700 mb-4">
                {t('thankYou')}, <span className="font-semibold text-red-600">{orderData.customer_name}</span>!
              </p>
            )}
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('orderProcessed')}
              <br />
              {orderData.children_count && (
                <>{t('personalizedMessages')} {orderData.children_count} {orderData.children_count > 1 ? t('children') : t('child')} {t('beingPrepared')}</>
              )}
            </p>
          </div>

          {/* Order Details */}
          {(orderData.order_id || orderData.total_amount) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">{t('orderDetails')}</h3>
              <div className="space-y-2 text-sm">
                {orderData.order_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('orderNumber')}</span>
                    <span className="font-mono font-semibold">{orderData.order_id}</span>
                  </div>
                )}
                {orderData.total_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('totalAmount')}</span>
                    <span className="font-semibold text-green-700">R$ {orderData.total_amount}</span>
                  </div>
                )}
                {orderData.session_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('sessionId')}</span>
                    <span className="font-mono text-xs">{orderData.session_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-4">{t('nextSteps')}</h3>
            <div className="text-left space-y-3 text-sm text-blue-800">
              <div className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Entre em contato conosco pelo Whatsapp para confirmar as informações do video! (Botão verde flutuante abaixo)</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Seu video irá para lista de produção.</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Assim que estiver pronto te enviaremos o link do video para que você faça o Download.</span>
              </div>
            </div>
          </div>

          {/* Back to Home (repositioned) */}
          <div className="mt-6">
            <Link 
              href="/"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </div>
    </div>
  );
}
