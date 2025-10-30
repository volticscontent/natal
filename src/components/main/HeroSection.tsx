'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/useIsMobile';
import VideoPopup from './VideoPopup';

interface HeroSectionProps {
  onCtaClick?: () => void;
  desktopImage?: string;
  mobileImage?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onCtaClick,
  desktopImage = "/hero/bg-1440.webp",
  mobileImage = "/hero/bg-750.webp"
}) => {
  const t = useTranslations('hero');
  const isMobile = useIsMobile();
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);

  const handleWatchVideoClick = () => {
    setIsVideoPopupOpen(true);
  };

  return (
    <section className="relative h-[82vh] flex items-center justify-center overflow-hidden md:h-[96vh]">{/* Hero com altura de 68% da viewport */}
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={isMobile ? mobileImage : desktopImage}
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 max-w-[750px] mx-auto px-4 sm:px-6 lg:px-8 text-center mt-78 md:mt-40 lg:mt-44">
        <div className="rounded-3xl px-6 md:p-4 lg:p-12">{/* Padding responsivo para melhor visualização mobile */}
          <div className="text-center space-y-4 md:space-y-8">{/* Espaçamento responsivo entre elementos */}
            <h1 className="text-4xl md:text-7xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight font-fertigo text-shadow-hero">{/* Tipografia responsiva otimizada para mobile */}
              {t('title')}
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white max-w-xl mx-auto leading-relaxed font-fertigo text-shadow-hero">{/* Tipografia responsiva otimizada para mobile */}
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center items-center">{/* Espaçamento responsivo entre botões */}
              <button 
                onClick={onCtaClick}
                className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-8 py-5 md:py-5 rounded-full text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-[80%] sm:w-auto"
              >
                {t('createVideo')}
              </button>
              
              <button 
                onClick={handleWatchVideoClick}
                className="flex items-center gap-2 text-red-600 hover:text-red-200 transition-colors duration-300 w-full sm:w-auto justify-center sm:justify-start"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="text-lg text-white font-fertigo text-shadow-hero">{t('watchVideo')}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center mt-5 justify-center gap-5 text-white/90">
              <div className="flex items-center gap-[0.2px]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-200 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm md:text-base font-medium">{t('rating')}</span>
              <div className="flex items-center gap-[0.2px]">
                <Image src="/images/image_3.png" alt="Trustpilot" width={80} height={100} />
              </div>
            </div>
      </div>

      {/* Video Popup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={() => setIsVideoPopupOpen(false)}
        videoSrc="/videos/modelo/sessãoVideo/mobileVd.webm"
        title="Veja como será o seu vídeo personalizado!"
      />

    </section>
  );
};

export default HeroSection;