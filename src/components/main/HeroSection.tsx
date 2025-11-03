'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/useIsMobile';
import dynamic from 'next/dynamic';

const DynamicVideoPopup = dynamic(() => import('@/components/dynamic/DynamicVideoPopup'), {
  ssr: false,
});

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWatchVideoClick = () => {
    setIsVideoPopupOpen(true);
  };

  // Evitar problemas de hidratação durante o carregamento inicial
  if (!mounted) {
    return (
      <section className="relative h-[80vh] sm:h-[88vh] md:h-[92vh] lg:h-[96vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={desktopImage}
            alt="Hero Background"
            fill
            className="object-cover"
            priority={true}
            fetchPriority="high"
            quality={85}
            sizes="(max-width: 768px) 100vw, 100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        </div>
        <div className="relative z-20 w-full max-w-[750px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-50 text-center">
          <div className="py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="text-center space-y-6 sm:space-y-8 md:space-y-10">
              <h1 className="text-4xl md:text-7xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight font-fertigo text-shadow-hero">
                {t('title')}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white max-w-xl mx-auto leading-relaxed font-fertigo text-shadow-hero">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[80vh] sm:h-[88vh] md:h-[92vh] lg:h-[96vh] flex items-center justify-center overflow-hidden" suppressHydrationWarning>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={isMobile ? mobileImage : desktopImage}
          alt="Hero Background"
          fill
          className="object-cover"
          priority={true}
          fetchPriority="high"
          quality={85}
          sizes="(max-width: 768px) 100vw, 100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 w-full max-w-[750px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-50 text-center">
        <div className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="text-center space-y-6 sm:space-y-8 md:space-y-10">{/* Espaçamento progressivo e responsivo */}
            <h1 className="text-4xl md:text-7xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight font-fertigo text-shadow-hero">{/* Tipografia responsiva otimizada para mobile */}
              {t('title')}
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white max-w-xl mx-auto leading-relaxed font-fertigo text-shadow-hero">{/* Tipografia responsiva otimizada para mobile */}
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 justify-center items-center mt-2 sm:mt-4">
              <button 
                onClick={onCtaClick}
                className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg md:text-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-[85%] sm:w-auto min-w-[200px] sm:min-w-[240px]"
              >
                {t('createVideo')}
              </button>
              
              <button 
                onClick={handleWatchVideoClick}
                className="flex items-center gap-2 sm:gap-3 text-red-600 hover:text-red-200 transition-colors duration-300 w-full sm:w-auto justify-center sm:justify-start"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="text-base sm:text-lg text-white font-fertigo text-shadow-hero">{t('watchVideo')}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Rating Section */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5 text-white/90 mt-6 sm:mt-8 md:mt-10">
              <div className="flex items-center gap-[0.2px]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs sm:text-sm md:text-base font-medium">{t('rating')}</span>
              <div className="flex items-center gap-[0.2px] w-[70px] sm:w-[80px] h-[18px] sm:h-[20px]">
                <Image 
                  src="/images/image_3.png" 
                  alt="Trustpilot" 
                  width={80} 
                  height={20}
                  style={{ width: 'auto', height: 'auto' }}
                  className="object-contain"
                  loading="lazy"
                />
              </div>
            </div>
      </div>

      {/* Video Popup - só renderiza quando necessário */}
      {isVideoPopupOpen && (
        <DynamicVideoPopup
          isOpen={isVideoPopupOpen}
          onClose={() => setIsVideoPopupOpen(false)}
          videoSrc="https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/mobileVd.webm"
          title="Veja como será o seu vídeo personalizado!"
        />
      )}

    </section>
  );
};

export default HeroSection;