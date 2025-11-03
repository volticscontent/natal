'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslations } from 'next-intl';

interface VideoSectionProps {
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  onCtaClick?: () => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({
  title,
  subtitle,
  videoUrl = "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/mobileVd.webm", // Vídeo do R2
  onCtaClick
}) => {
  const t = useTranslations('video');
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Auto-play setup otimizado
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      let retryCount = 0;
      const maxRetries = 3;
      
      // Configurar o vídeo para autoplay
      video.muted = true; // Garantir que está mutado
      video.playsInline = true;
      video.loop = true;
      
      const attemptPlay = async () => {
        if (retryCount >= maxRetries) return;
        
        try {
          // Aguardar o vídeo estar pronto
          if (video.readyState >= 2) {
            await video.play();
            console.log('Video autoplay successful');
          }
        } catch (error) {
          retryCount++;
          console.log('Autoplay attempt failed:', error);
          
          // Usar requestIdleCallback para não bloquear UI
          if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
              if (retryCount < maxRetries) {
                setTimeout(attemptPlay, 200);
              }
            }, { timeout: 1000 });
          } else {
            setTimeout(attemptPlay, 200);
          }
        }
      };

      // Tentar reproduzir quando os metadados estiverem carregados
      const onLoadedMetadata = () => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(attemptPlay, { timeout: 500 });
        } else {
          setTimeout(attemptPlay, 0);
        }
      };

      // Tentar reproduzir quando dados suficientes estiverem carregados
      const onCanPlay = () => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(attemptPlay, { timeout: 500 });
        } else {
          setTimeout(attemptPlay, 0);
        }
      };

      // Adicionar event listeners com passive
      video.addEventListener('loadedmetadata', onLoadedMetadata, { passive: true });
      video.addEventListener('canplay', onCanPlay, { passive: true });
      
      // Tentar reproduzir imediatamente se já estiver carregado
      if (video.readyState >= 2) {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(attemptPlay, { timeout: 500 });
        } else {
          setTimeout(attemptPlay, 0);
        }
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('canplay', onCanPlay);
      };
    }
  }, []);

  return (
    <section className="pb-8 md:py-16 lg:py-24" style={{ backgroundColor: '#5e925e' }}>
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16'} items-center`}>
          
          {/* Video Player */}
          <div className="relative order-2 lg:order-1">
            {/* Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-red-500 text-white px-3 py-1 text-sm font-bold uppercase tracking-wide rounded">
                {t('badge')}
              </span>
            </div>

            <div 
              className={`relative ${isMobile ? 'aspect-[9/16]' : 'aspect-video lg:aspect-[4/3] xl:aspect-video'} overflow-hidden shadow-2xl rounded-lg`}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                preload="auto"
                autoPlay
                controls={false}
                suppressHydrationWarning
              >
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl.replace('.webm', '.mp4')} type="video/mp4" />
                {t('videoNotSupported')}
              </video>

              {/* Video Controls - Botão de Mute sempre visível */}
              <div className="absolute bottom-4 right-4 z-20">
                <button
                  onClick={handleMuteToggle}
                  className="bg-red-600 bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all duration-200"
                  title={isMuted ? t('muteButton') : t('unmuteButton')}
                >
                  {isMuted ? (
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 p-4 md:p-6 lg:p-8 xl:p-10 order-1 lg:order-2">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-fertigo font-bold text-black mb-2 leading-tight">
                <span className="text-red-600">{(title || t('title')).split(' ')[0]}</span>{' '}
              </h2>
              <span className="text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-fertigo font-bold leading-tight">{(title || t('title')).split(' ').slice(1).join(' ')}</span>
              <p className="text-base md:text-lg lg:text-xl text-white leading-relaxed mt-6 lg:mt-10 max-w-2xl">
                {subtitle || t('subtitle')}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 lg:space-y-6">
              <ul className="space-y-3 lg:space-y-4">
                <li className="flex items-start gap-3 lg:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-white text-base lg:text-lg font-medium">
                      <strong>{t('features.newVideo.title')}</strong>
                    </span>
                    <p className="text-sm lg:text-base text-white mt-1 opacity-90">{t('features.newVideo.description')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 lg:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white text-base lg:text-lg font-medium">{t('features.personalization')}</span>
                </li>
                <li className="flex items-start gap-3 lg:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white text-base lg:text-lg font-medium">{t('features.quality')}</span>
                </li>
                <li className="flex items-start gap-3 lg:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white text-base lg:text-lg font-medium">{t('features.comment')}</span>
                </li>
                <li className="flex items-start gap-3 lg:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white text-base lg:text-lg font-medium">{t('features.fastOrder')}</span>
                </li>
                <li className="flex items-start gap-3 lg:gap-4">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-white text-base lg:text-lg font-medium">{t('features.delivery.title')}</span>
                    <p className="text-sm lg:text-base text-white mt-1 opacity-90">{t('features.delivery.description')}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            {onCtaClick && (
              <div className="pt-4 lg:pt-6">
                <button
                  onClick={onCtaClick}
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-3 lg:py-4 px-6 lg:px-8 rounded-full transition-all duration-300 transform hover:scale-105 uppercase tracking-wide shadow-lg hover:shadow-xl text-base lg:text-lg"
                >
                  {t('createVideo')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
