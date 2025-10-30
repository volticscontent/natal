'use client';

import React from 'react';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslations } from 'next-intl';

interface FloatingCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface FloatingCarouselProps {
  cards?: FloatingCard[];
}

const FloatingCarousel: React.FC<FloatingCarouselProps> = ({
  cards
}) => {
  const isMobile = useIsMobile();
  const t = useTranslations('floatingCarousel');
  
  // Criar cards com ícones e textos traduzidos
  const defaultCards: FloatingCard[] = [
    {
      id: '1',
      icon: <Image src="/images/image_8.png" alt="Entrega rápida" width={50} height={45} className="object-contain" />,
      title: t('cards.0.title'),
      subtitle: t('cards.0.subtitle')
    },
    {
      id: '2',
      icon: <Image src="/images/image_6.png" alt="Avaliações" width={60} height={40} className="object-contain" />,
      title: t('cards.1.title'),
      subtitle: t('cards.1.subtitle')
    },
    {
      id: '3',
      icon: <Image src="/images/image_15.png" alt="Personalização" width={35} height={40} className="object-contain" />,
      title: t('cards.2.title'),
      subtitle: t('cards.2.subtitle')
    },
    {
      id: '4',
      icon: <Image src="/images/image_19.png" alt="Surpresa de Natal" width={35} height={35} className="object-contain" />,
      title: t('cards.3.title'),
      subtitle: t('cards.3.subtitle')
    },
  ];
  
  const validCards = Array.isArray(cards) ? cards : defaultCards;

  // Criar array expandido para animação CSS contínua
  const expandedCards = Array(20).fill(validCards).flat();

  return (
    <section className="pt-2 pb-10 md:py-4 bg-white overflow-hidden">
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        .scroll-left {
          animation: scroll-left 6s linear infinite;
        }
        
        .scroll-right {
          animation: scroll-right 10s linear infinite;
        }
      `}</style>

      <div className="relative">
        {/* Mobile Version - CSS Animation */}
        {isMobile ? (
          <div className="flex justify-center">
            <div className="w-full max-w overflow-hidden">
              <div className="flex scroll-left" style={{ width: 'calc(200% + 40px)' }}>
                {expandedCards.map((card, index) => (
                  <div key={`${card.id}-${index}`} className="flex-shrink-0 mx-2" style={{ width: 'calc(50vw - 16px)' }}>
                    <div className="bg-white rounded-2xl py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                          {card.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                            {card.title}
                          </h3>
                          {card.subtitle && (
                            <p className="text-xs text-gray-600 mt-1">
                              {card.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Version - CSS Animation */
          <div className="flex justify-center">
            <div className="w-full max-w-6xl overflow-hidden">
              <div className="flex scroll-right" style={{ width: 'calc(200% + 80px)' }}>
                {expandedCards.map((card, index) => (
                  <div key={`${card.id}-${index}`} className="flex-shrink-0 mx-4" style={{ minWidth: '280px' }}>
                    <div className="bg-white rounded-2xl p-4 min-w-[280px] transform transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                            {card.title}
                          </h3>
                          {card.subtitle && (
                            <p className="text-sm text-gray-600 mt-1 font-bold">
                              {card.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FloatingCarousel;