'use client';

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslations } from 'next-intl';

interface PromoBannerProps {
  messages?: string[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  messages,
  autoPlay = false,
  autoPlayInterval = 4000
}) => {
  const t = useTranslations('promoBanner');
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();
  
  // Usar mensagens das traduções se não fornecidas via props
  const displayMessages = messages || [t('message')];

  useEffect(() => {
    if (!autoPlay || displayMessages.length <= 1) return;

    const updateMessage = () => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          setCurrentIndex((prev) => (prev + 1) % displayMessages.length);
        }, { timeout: 100 });
      } else {
        setCurrentIndex((prev) => (prev + 1) % displayMessages.length);
      }
    };

    const interval = setInterval(updateMessage, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, displayMessages.length, autoPlayInterval]);

  if (displayMessages.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#99deb1] to-[#f0ba45] text-black py-2 md:py-3 relative overflow-hidden">{/* Banner responsivo sem z-index fixo */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center relative">
          {/* Message Display */}
          <div className="text-center min-h-[24px] flex items-center justify-center">
            <p className={`font-bold transition-opacity duration-500 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              {displayMessages[currentIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
          
export default PromoBanner;
