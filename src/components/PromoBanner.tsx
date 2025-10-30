'use client';

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PromoMessage {
  id: string;
  text: string;
  highlight?: string;
  icon?: React.ReactNode;
}

interface PromoBannerProps {
  messages?: PromoMessage[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  backgroundColor?: string;
  textColor?: string;
}

const defaultMessages: PromoMessage[] = [
  {
    id: '1',
    text: 'Hoje -20% em tudo',
    highlight: '-20%',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    )
  },
  {
    id: '2',
    text: 'Entrega em até 1 hora',
    highlight: '1 hora',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: '3',
    text: 'Mais de 40.000 famílias satisfeitas',
    highlight: '40.000',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
  {
    id: '4',
    text: 'Garantia de 180 dias',
    highlight: '180 dias',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const PromoBanner: React.FC<PromoBannerProps> = ({
  messages = defaultMessages,
  autoPlay = true,
  autoPlayInterval = 4000,
  backgroundColor = 'bg-gradient-to-r from-green-600 to-red-600',
  textColor = 'text-white'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

  const validMessages = Array.isArray(messages) ? messages : defaultMessages;

  useEffect(() => {
    if (!autoPlay || validMessages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validMessages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, validMessages.length]);

  const currentMessage = validMessages[currentIndex];

  return (
    <div className={`${backgroundColor} ${textColor} py-2 px-4 text-center relative overflow-hidden`}>
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center space-x-2 min-h-[40px]">
        {/* Icon */}
        {currentMessage.icon && (
          <div className="flex-shrink-0 animate-pulse">
            {currentMessage.icon}
          </div>
        )}

        {/* Message */}
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium">
            {currentMessage.text.split(currentMessage.highlight || '').map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && currentMessage.highlight && (
                  <span className="font-bold text-yellow-300 animate-pulse">
                    {currentMessage.highlight}
                  </span>
                )}
              </React.Fragment>
            ))}
          </span>
        </div>

        {/* Close Button */}
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          onClick={() => {
            // Implementar lógica para fechar o banner se necessário
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Indicators */}
      {validMessages.length > 1 && !isMobile && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-yellow-300 transition-all duration-300 ease-linear"
            style={{
              width: `${((currentIndex + 1) / validMessages.length) * 100}%`
            }}
          />
        </div>
      )}

      {/* Mobile Dots */}
      {validMessages.length > 1 && isMobile && (
        <div className="flex justify-center space-x-1 mt-1">
          {validMessages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-yellow-300 scale-125'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBanner;