'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  const [isLoading, setIsLoading] = useState(true);
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

    // Simular loading para melhor UX
    setTimeout(() => setIsLoading(false), 1000);

    // Limpar dados do localStorage após confirmação
    if (sessionIdParam) {
      localStorage.removeItem('pers_personalization_data');
      localStorage.removeItem('pers_session_data');
      localStorage.removeItem('pers_current_step');
    }

    // Tracking de conversão
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: orderId,
          value: totalAmount ? parseFloat(totalAmount) : 0,
          currency: 'BRL',
          items: [{
            item_id: 'recadinhos-papai-noel',
            item_name: 'Recadinhos do Papai Noel',
            category: 'Personalização',
            quantity: childrenCount || 1,
            price: totalAmount ? parseFloat(totalAmount) : 0,
          }]
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: totalAmount ? parseFloat(totalAmount) : 0,
          currency: 'BRL',
          content_ids: ['recadinhos-papai-noel'],
          content_type: 'product',
        });
      }
    }
  }, [searchParams, sessionId, utmParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t('processing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Image
            src="/images/logo_65x91.webp"
            alt={t('logoAlt')}
            width={65}
            height={91}
            className="mx-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <span className="font-semibold text-green-600">R$ {orderData.total_amount}</span>
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
                <span>{t('step1')}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>{t('step2')}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>{t('step3')}</span>
              </div>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="border-t pt-8">
            <p className="text-gray-600 mb-4">{t('shareText')}</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => window.open(`https://wa.me/?text=${t('whatsappShare')} ${window.location.origin}`, '_blank')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📱 WhatsApp
              </button>
              <button 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}`, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📘 Facebook
              </button>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8">
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