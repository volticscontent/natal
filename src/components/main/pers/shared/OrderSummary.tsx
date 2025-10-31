'use client';

import { useEffect, useState } from 'react';
import { getCurrentPricing, recalculateAndSavePricing } from '../utils/dataStorage';
import { PricingResult, formatPrice } from '../../../../lib/pricing-calculator';

interface OrderSummaryProps {
  locale?: string;
  title?: string;
  showTotal?: boolean;
  className?: string;
  t: (key: string) => string;
  // Props opcionais para override manual (compatibilidade)
  manualItems?: Array<{ id: string; title: string; price: number; }>;
  manualTotal?: number;
  manualBaseVideoPrice?: number;
  manualBaseVideoTitle?: string;
}

export default function OrderSummary({
  locale = 'pt',
  title,
  showTotal = true,
  className = '',
  t,
  manualItems,
  manualTotal,
  manualBaseVideoPrice,
  manualBaseVideoTitle
}: OrderSummaryProps) {
  const [pricingData, setPricingData] = useState<PricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPricingData = () => {
      console.group('🧮 OrderSummary - Loading Pricing Data');
      
      // Se há dados manuais, usar eles (modo compatibilidade)
      if (manualItems || manualTotal || manualBaseVideoPrice) {
        console.log('Using manual pricing data for compatibility');
        console.groupEnd();
        setIsLoading(false);
        return;
      }

      // Tentar obter preços salvos
      let pricing = getCurrentPricing(locale);
      
      // Se não há preços salvos, recalcular
      if (!pricing) {
        console.log('No saved pricing found, recalculating...');
        pricing = recalculateAndSavePricing(locale);
      }

      console.log('Final pricing data:', pricing);
      setPricingData(pricing);
      setIsLoading(false);
      console.groupEnd();
    };

    loadPricingData();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pers_personalization_data' || e.key === 'pers_pricing_data') {
        console.log('Storage changed, reloading pricing data');
        loadPricingData();
      }
    };

    // Listener customizado para mudanças no mesmo tab
    const handleCustomStorageChange = () => {
      console.log('Custom storage change detected, reloading pricing data');
      loadPricingData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [locale, manualItems, manualTotal, manualBaseVideoPrice]);

  // Modo compatibilidade - usar dados manuais
  if (manualItems || manualTotal || manualBaseVideoPrice) {
    const items = manualItems || [];
    const total = manualTotal || 0;
    
    if (items.length === 0 && !manualBaseVideoPrice) {
      return null;
    }

    const summaryTitle = title || t('step2.orderSummary');

    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <h3 className="font-semibold text-gray-800 mb-4">
          {summaryTitle}
        </h3>
        <div className="space-y-2">
          {/* Valor base do vídeo */}
          {manualBaseVideoPrice && manualBaseVideoPrice > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-800">{manualBaseVideoTitle || t('step2.baseVideo')}</span>
              <span className="text-gray-800 font-medium">{formatPrice(manualBaseVideoPrice, locale)}</span>
            </div>
          )}
          
          {/* Order bumps */}
          {items.map(item => (
            <div key={item.id} className="flex justify-between">
              <span className="text-gray-800">{item.title}</span>
              <span className="text-gray-800 font-medium">{formatPrice(item.price, locale)}</span>
            </div>
          ))}
          
          {showTotal && (
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-800">{t('step2.total')}</span>
                <span className="text-green-700">{formatPrice(total, locale)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Se não há dados de preços, não mostrar nada
  if (!pricingData) {
    return null;
  }

  const summaryTitle = title || t('step2.orderSummary');

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-4">
        {summaryTitle}
      </h3>
      <div className="space-y-2">
        {/* Itens do breakdown */}
        {pricingData.breakdown.map(item => (
          <div key={item.id} className="flex justify-between">
            <span className="text-gray-800">
              {item.title}
              {item.quantity && item.quantity > 1 && ` (${item.quantity}x)`}
            </span>
            <div className="text-right">
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-gray-500 line-through text-sm block">
                  {formatPrice(item.originalPrice, pricingData.currency)}
                </span>
              )}
              <span className="text-gray-800 font-medium">
                {formatPrice(item.price, pricingData.currency)}
              </span>
            </div>
          </div>
        ))}

        {/* Desconto do combo (se aplicável) */}
        {pricingData.comboDiscount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>{t('step2.comboDiscount')}</span>
            <span className="font-medium">
              -{formatPrice(pricingData.comboDiscount, pricingData.currency)}
            </span>
          </div>
        )}
        
        {showTotal && (
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span className="text-gray-800">{t('step2.total')}</span>
              <span className="text-green-700">
                {formatPrice(pricingData.total, pricingData.currency)}
              </span>
            </div>
            
            {/* Mostrar economia se houver */}
            {pricingData.comboDiscount > 0 && (
              <div className="text-sm text-green-700 mt-1">
                {t('step2.savings')}: {formatPrice(pricingData.comboDiscount, pricingData.currency)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}