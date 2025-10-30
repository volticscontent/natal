'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PersData, STORAGE_KEYS } from '../types';
import { useProducts } from '../../../../hooks/useProducts';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { useDataLayer } from '../../../../hooks/useDataLayer';
import ProgressBar from '../shared/ProgressBar';
import Navigation from '../shared/Navigation';
import OrderSummary from '../shared/OrderSummary';
import { recalculateAndSavePricing } from '../utils/dataStorage';

interface Step2OrderBumpsProps {
  buildPersonalizationLink: (path: string) => string;
  t: (key: string) => string;
  locale?: 'pt' | 'en' | 'es';
}

export default function Step2OrderBumps({
  buildPersonalizationLink,
  t,
  locale = 'pt'
}: Step2OrderBumpsProps) {
  const router = useRouter();
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { trackPageView, trackStepProgress, trackProductInteraction } = useDataLayer();
  
  const { 
    loading: productsLoading, 
    error: productsError,
    getOrderBumps,
    getProductPrice,
    getLocalizedText
  } = useProducts(locale);

  const availableOrderBumps = getOrderBumps();

  // Tracking da visualização da página
  useEffect(() => {
    trackPageView({
      pageTitle: 'Personalização - Order Bumps',
      pagePath: '/pers/2',
      stepNumber: 2,
      stepName: 'order_bumps'
    });
  }, [trackPageView]);

  // Carregar dados salvos
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.PERS_DATA);
    if (savedData) {
      try {
        const parsedData: PersData = JSON.parse(savedData);
        if (parsedData.order_bumps && parsedData.order_bumps.length > 0) {
          setSelectedBumps(parsedData.order_bumps);
        }
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
      }
    }
  }, []);

  // Salvar dados automaticamente e recalcular preços
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.PERS_DATA);
    let currentData: PersData = {
      quantidade_criancas: 1,
      children: [],
      mensagem: 'default',
      incluir_fotos: false,
      fotos: [],
      order_bumps: selectedBumps,
      observacoes: ''
    };

    if (savedData) {
      try {
        const parsedData: PersData = JSON.parse(savedData);
        currentData = { ...parsedData, order_bumps: selectedBumps };
      } catch (error) {
        console.error('Erro ao carregar dados existentes:', error);
      }
    }

    localStorage.setItem(STORAGE_KEYS.PERS_DATA, JSON.stringify(currentData));
    
    // Recalcular preços sempre que os order bumps mudarem
    recalculateAndSavePricing(locale);
    
    // Disparar evento para notificar outros componentes sobre a mudança
    window.dispatchEvent(new Event('localStorageChange'));
  }, [selectedBumps, locale]);

  const toggleOrderBump = (id: string) => {
    // Tracking da interação com order bump
    trackProductInteraction({
      itemId: id,
      itemName: id,
      interactionType: selectedBumps.includes(id) ? 'remove_from_cart' : 'add_to_cart',
      itemCategory: 'order_bump',
      price: 0, // Será calculado depois
      quantity: 1
    });

    setSelectedBumps(prev => {
      // Se está tentando selecionar o combo
      if (id === 'combo-addons') {
        if (prev.includes(id)) {
          // Se o combo já está selecionado, apenas remove ele
          return prev.filter(bumpId => bumpId !== id);
        } else {
          // Se está selecionando o combo, remove todos os outros e adiciona apenas o combo
          return ['combo-addons'];
        }
      } else {
        // Se está selecionando um order bump individual
        if (prev.includes(id)) {
          // Se já está selecionado, apenas remove
          return prev.filter(bumpId => bumpId !== id);
        } else {
          // Se está selecionando um individual, remove o combo (se existir) e adiciona o individual
          const withoutCombo = prev.filter(bumpId => bumpId !== 'combo-addons');
          return [...withoutCombo, id];
        }
      }
    });
  };

  const handleNext = () => {
    // Tracking do progresso para o próximo step
    trackStepProgress({
      stepFrom: 2,
      stepTo: 3,
      stepName: 'order_bumps_to_contato'
    });

    setIsLoading(true);
    const nextUrl = buildPersonalizationLink('3');
    router.push(nextUrl);
  };

  const handlePrevious = () => {
    const backUrl = buildPersonalizationLink('1');
    router.push(backUrl);
  };

  const handleSkip = () => {
    // Tracking do skip
    trackStepProgress({
      stepFrom: 2,
      stepTo: 3,
      stepName: 'order_bumps_skipped'
    });

    setSelectedBumps([]);
    const nextUrl = buildPersonalizationLink('3');
    router.push(nextUrl);
  };

  // Loading state
  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('form.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (productsError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('error.loadingProducts')}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar fixo no topo da página */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <ProgressBar currentStep={2} totalSteps={3} t={t} />
      </div>
      
      <div className="container mx-auto px-4 max-w-6xl pt-20 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold font-fertigo text-gray-800 mb-3 bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('step2.orderBumps.description')}
            </p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            <div className="animate-slide-up">
              {/* Order Bumps */}
              <div className="mb-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
                  {availableOrderBumps.map((bump, index) => {
                    const pricing = getProductPrice(bump);
                    const localizedTitle = getLocalizedText(bump.title);
                    const localizedDescription = getLocalizedText(bump.description);
                    const isSelected = selectedBumps.includes(bump.id);
                    
                    return (
                      <div
                        key={bump.id}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-102 animate-fade-in-up group ${
                          isSelected 
                            ? 'border-red-400 bg-gradient-to-br from-red-50/10 to-red-100 shadow-lg' 
                            : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => toggleOrderBump(bump.id)}
                      >
                        {/* Ícone do produto */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 ${
                            isSelected 
                              ? 'bg-gradient-to-br from-red-500 to-red-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-green-600 group-hover:to-green-700'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          
                          {/* Checkbox visual */}
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-300 group-hover:border-green-700'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          {localizedTitle}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                          {localizedDescription}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className={`px-4 py-2 rounded-xl font-bold text-lg transition-all duration-300 ${
                            isSelected 
                              ? 'bg-red-500 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-800 group-hover:bg-red-100 group-hover:text-red-800'
                          }`}>
                            R$ {pricing.price.toFixed(2)}
                          </div>
                          
                          {/* Badge de desconto se houver */}
                          {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                              -{Math.round((1 - pricing.price / pricing.originalPrice) * 100)}%
                            </div>
                          )}
                        </div>
                        
                        {/* Efeito de seleção */}
                        {isSelected && (
                          <div className="absolute inset-0 rounded-2xl bg-green-500/10 pointer-events-none animate-pulse"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* OrderSummary para Mobile */}
              {isMobile && (
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-2xl font-bold font-fertigo text-black mb-6 text-center">
                      {t('step2.orderSummary')}
                    </h3>
                    <OrderSummary 
                      locale={locale} 
                      showTotal={true}
                      className="space-y-4"
                      t={t}
                    />
                  </div>
                </div>
              )}
              
              {/* Botões de Navegação */}
              <Navigation
                currentStep={2}
                totalSteps={3}
                isLoading={isLoading}
                canGoBack={true}
                canSkip={true}
                onNext={handleNext}
                onBack={handlePrevious}
                onSkip={handleSkip}
                t={t}
              />
            </div>
          </div>
          
          {/* OrderSummary para Desktop - Sidebar */}
          {!isMobile && (
            <div className="lg:col-span-1 mb-10">
              <div className="sticky top-24 animate-slide-in-right">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold font-fertigo text-black mb-6 text-center">
                    {t('step2.orderSummary')}
                  </h3>
                  <OrderSummary 
                    locale={locale} 
                    showTotal={true}
                    className="space-y-4"
                    t={t}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.7s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}