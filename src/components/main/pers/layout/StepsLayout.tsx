'use client';

import { ReactNode } from 'react';
import OrderSummary from '../shared/OrderSummary';

interface StepsLayoutProps {
  children: ReactNode;
  currentStep: number;
  locale: 'pt' | 'en' | 'es';
  t: (key: string) => string;
  showOrderSummary?: boolean;
}

export default function StepsLayout({ 
  children, 
  currentStep, 
  locale, 
  t, 
  showOrderSummary = true 
}: StepsLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 pb-10">
          {/* Conteúdo Principal */}
          <div className="flex-1 lg:w-2/3">
            <div className="flex flex-col">
              {/* Conteúdo do Step */}
              <div className="flex-1">
                {children}
              </div>
              
              {/* Resumo do Pedido - Mobile (aparece antes da navegação) */}
              {showOrderSummary && (
                <div className="lg:hidden mt-8 mb-6">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      {t('step2.orderSummary') || 'Resumo do Pedido'}
                    </h3>
                    
                    <OrderSummary 
                      locale={locale}
                      showTotal={true}
                      className="border-0 shadow-none p-0"
                      t={t}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Resumo do Pedido - Desktop Sidebar */}
          {showOrderSummary && currentStep >= 2 && (
            <div className="hidden lg:block lg:w-1/3">
              <div className="sticky top-24">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    {t('step2.orderSummary') || 'Resumo do Pedido'}
                  </h3>
                  
                  <OrderSummary 
                    locale={locale}
                    showTotal={true}
                    className="border-0 shadow-none p-0"
                    t={t}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}