'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PersData, STORAGE_KEYS } from '../types';
import ProgressBar from '../shared/ProgressBar';
import Navigation from '../shared/Navigation';
import OrderSummary from '../shared/OrderSummary';
import { useProducts } from '../../../../hooks/useProducts';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { recalculateAndSavePricing, savePersonalizationData } from '../utils/dataStorage';
import { useSmartTracking } from '../../../../hooks/useSmartTracking';

interface Step1QuantidadeCriancasProps {
  buildPersonalizationLink: (path: string) => string;
  t: (key: string) => string;
  locale: 'pt' | 'en' | 'es';
}

export default function Step1QuantidadeCriancas({
  buildPersonalizationLink,
  t,
  locale
}: Step1QuantidadeCriancasProps) {
  const router = useRouter();
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getMainProductByChildren, getProductPrice } = useProducts(locale);
  const isMobile = useIsMobile();
  const { trackMainFunnelProgress, trackFormInteraction, trackEvent } = useSmartTracking();

  // Carregar dados salvos e disparar page_view uma única vez
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.PERS_DATA);
    if (savedData) {
      try {
        const parsedData: PersData = JSON.parse(savedData);
        if (parsedData.quantidade_criancas) {
          setSelectedQuantity(parsedData.quantidade_criancas);
        }
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
      }
    }

    // Disparar evento de page view personalizado para Step 1 uma única vez por sessão
    const pvKey = 'pv_step_1';
    if (!sessionStorage.getItem(pvKey)) {
      trackEvent('perspgview1', 'high', {
        content_type: 'personalization_step',
        step_number: 1,
        step_name: 'quantity_selection',
        funnel_position: 'step_1_of_3',
        timestamp: Date.now()
      });
      sessionStorage.setItem(pvKey, '1');
      console.log('📄 Evento perspgview1 disparado - Step 1 visualizado');
    }
  }, [trackEvent]);

  // Função para obter preço baseado na quantidade de crianças
  const getPriceForQuantity = (quantity: number) => {
    const mainProduct = getMainProductByChildren(quantity);
    if (mainProduct) {
      const pricing = getProductPrice(mainProduct);
      return pricing;
    }
    return { price: 0, originalPrice: 0, currency: 'BRL' };
  };

  // Função para formatar preço
  const formatPrice = (price: number, currency: string = 'BRL') => {
    if (currency === 'BRL') {
      return `R$ ${price.toFixed(2).replace('.', ',')}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const quantityOptions = [
    {
      value: 1,
      title: t('step1.options.one.title'),
      description: t('step1.options.one.description'),
      icon: (
        <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      value: 2,
      title: t('step1.options.two.title'),
      description: t('step1.options.two.description'),
      icon: (
        <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    },
    {
      value: 3,
      title: t('step1.options.three.title'),
      description: t('step1.options.three.description'),
      icon: (
        <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      )
    }
  ];

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    
    // Track seleção de produto
    trackMainFunnelProgress('product_selection');
    
    // Tracking da seleção de quantidade
    trackFormInteraction('quantidade_selecionada', 'change');

    // Evento customizado para capturar o valor da quantidade selecionada
    trackEvent('product_view', 'medium', {
      step_number: 1,
      quantity_value: quantity,
      form_name: 'quantidade_criancas',
      event_category: 'personalization'
    });
    
    // Salvar dados imediatamente e recalcular preços
    try {
      const existingData = localStorage.getItem(STORAGE_KEYS.PERS_DATA);
      let persData: PersData;
      
      if (existingData) {
        persData = JSON.parse(existingData);
        persData.quantidade_criancas = quantity;
        // Inicializar array de crianças se não existir ou se o tamanho mudou
        if (!persData.children || persData.children.length !== quantity) {
          persData.children = Array.from({ length: quantity }, (_, index) => 
            persData.children && persData.children[index] ? persData.children[index] : { nome: '' }
          );
        }
      } else {
        persData = {
          quantidade_criancas: quantity,
          children: Array.from({ length: quantity }, () => ({ nome: '' })),
          mensagem: '',
          incluir_fotos: false,
          order_bumps: []
        };
      }

      savePersonalizationData({
        quantidade_criancas: persData.quantidade_criancas,
        children: persData.children,
        order_bumps: persData.order_bumps
      });

      // Recalcular preços imediatamente
      recalculateAndSavePricing(locale);
      
      // Disparar evento customizado para atualizar componentes
      window.dispatchEvent(new Event('localStorageChange'));
      
      console.log('Quantidade selecionada e preços atualizados:', quantity);
    } catch (error) {
      console.error('Erro ao salvar quantidade:', error);
    }
  };

  const handleNext = () => {
    if (!selectedQuantity) return;

    setIsLoading(true);
    
    // Usar requestIdleCallback para operações pesadas
    const processData = () => {
      try {
        // Carregar dados existentes ou criar novos
        const existingData = localStorage.getItem(STORAGE_KEYS.PERS_DATA);
        let persData: PersData;
        
        if (existingData) {
          persData = JSON.parse(existingData);
          persData.quantidade_criancas = selectedQuantity;
          // Inicializar array de crianças se não existir ou se o tamanho mudou
          if (!persData.children || persData.children.length !== selectedQuantity) {
            persData.children = Array.from({ length: selectedQuantity }, (_, index) => 
              persData.children && persData.children[index] ? persData.children[index] : { nome: '' }
            );
          }
        } else {
          persData = {
            quantidade_criancas: selectedQuantity,
            children: Array.from({ length: selectedQuantity }, () => ({ nome: '' })),
            mensagem: '',
            incluir_fotos: false,
            order_bumps: []
          };
        }

        savePersonalizationData({
          quantidade_criancas: persData.quantidade_criancas,
          children: persData.children,
          order_bumps: persData.order_bumps
        });

        // Recalcular preços com a nova quantidade
        recalculateAndSavePricing(locale);

        // Navegar para próximo step
        const nextUrl = buildPersonalizationLink('2');
        router.push(nextUrl);
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(processData, { timeout: 1000 });
    } else {
      setTimeout(processData, 100);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar fixo no topo da página */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <ProgressBar currentStep={1} totalSteps={3} t={t} />
      </div>
      
      <div className="container mx-auto px-4 max-w-7xl pt-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-block p-4 bg-white">
                <h1 className="text-4xl font-bold font-fertigo text-gray-800 mb-3 bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
                  {t('step1.title')}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('step1.subtitle')}
                </p>
              </div>
            </div>

            {/* Quantity Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-slide-up">
              {quantityOptions.map((option) => {
                const pricing = getPriceForQuantity(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleQuantitySelect(option.value)}
                    className={`
                      relative cursor-pointer rounded-3xl p-8 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2
                      ${selectedQuantity === option.value
                        ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-2xl shadow-red-500/25 ring-4 ring-red-200 ring-opacity-50'
                        : 'bg-white shadow-xl hover:shadow-2xl border border-gray-100 hover:border-red-200'
                      }
                      backdrop-blur-sm
                    `}
                  >
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 rounded-3xl opacity-5">
                      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full blur-xl"></div>
                      <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-red-300 to-red-500 rounded-full blur-lg"></div>
                    </div>

                    {/* Selection indicator */}
                    {selectedQuantity === option.value && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      {/* Icon */}
                      <div className="mb-6 flex justify-center">
                        <div className={`
                          p-4 rounded-2xl transition-all duration-300
                          ${selectedQuantity === option.value
                            ? 'bg-white backdrop-blur-sm'
                            : 'bg-red-50'
                          }
                        `}>
                          {option.icon}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`
                        text-2xl font-bold font-fertigo mb-3 transition-all duration-300
                        ${selectedQuantity === option.value
                          ? 'text-white drop-shadow-sm'
                          : 'text-gray-800'
                        }
                      `}>
                        {option.title}
                      </h3>

                      {/* Description */}
                      <p className={`
                        text-sm leading-relaxed transition-all duration-300 font-medium mb-4
                        ${selectedQuantity === option.value
                          ? 'text-white/95 drop-shadow-sm'
                          : 'text-gray-600'
                        }
                      `}>
                        {option.description}
                      </p>

                      {/* Pricing */}
                      <div className="space-y-2">
                        <div className={`
                          text-3xl font-bold transition-all duration-300
                          ${selectedQuantity === option.value
                            ? 'text-white drop-shadow-sm'
                            : 'text-green-700'
                          }
                        `}>
                          {formatPrice(pricing.price, pricing.currency)}
                        </div>
                        {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                          <div className="flex items-center justify-center space-x-2">
                            <span className={`
                              text-sm line-through transition-all duration-300
                              ${selectedQuantity === option.value
                                ? 'text-white/70'
                                : 'text-gray-500'
                              }
                            `}>
                              {formatPrice(pricing.originalPrice, pricing.currency)}
                            </span>
                            <span className={`
                              text-xs px-2 py-1 rounded-full font-bold transition-all duration-300
                              ${selectedQuantity === option.value
                                ? 'bg-white/20 text-white'
                                : 'bg-red-100 text-red-600'
                              }
                            `}>
                              -{Math.round((1 - pricing.price / pricing.originalPrice) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subtle glow effect for selected card */}
                    {selectedQuantity === option.value && (
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-400/20 to-red-600/20 blur-xl -z-10"></div>
                    )}

                    {/* Hover shimmer effect */}
                    <div className={`
                      absolute inset-0 rounded-3xl transition-opacity duration-500 overflow-hidden
                      ${selectedQuantity === option.value
                        ? 'opacity-0'
                        : 'opacity-0'
                      }
                    `}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* OrderSummary para Mobile - dentro do grid principal */}
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

            {/* Navigation */}
            <Navigation
              currentStep={1}
              totalSteps={3}
              isLoading={isLoading}
              canGoBack={false}
              canSkip={false}
              onNext={selectedQuantity ? handleNext : undefined}
              t={t}
              nextLabel={selectedQuantity ? t('navigation.continue') : t('step1.selectQuantity')}
            />
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
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.7s ease-out;
        }
      `}</style>
    </div>
  );
}
