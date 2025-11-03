'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType } from 'embla-carousel';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/useIsMobile';

interface VideoData {
  src: string;
  thumbnail: string;
  instagramHandle: string;
  name: string;
}

interface EspiritoNatalinoSectionProps {
  title?: string;
  subtitle?: string;
  clientsCount?: string;
  videos?: VideoData[];
  onCtaClick?: () => void;
}

const EspiritoNatalinoSection: React.FC<EspiritoNatalinoSectionProps> = ({
  title,
  subtitle,
  videos = [
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0001.webm", thumbnail: "/images/videoframe_WW001.png", instagramHandle: "@carla_santos", name: "Carla Santos" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0002.webm", thumbnail: "/images/videoframe_WW002.png", instagramHandle: "@ana_oliveira", name: "Ana Oliveira" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0003.webm", thumbnail: "/images/videoframe_WW003.png", instagramHandle: "@juliana_costa", name: "Juliana Costa" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0004.webm", thumbnail: "/images/videoframe_WW004.png", instagramHandle: "@patricia_lima", name: "Patrícia Lima" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0005.webm", thumbnail: "/images/videoframe_WW005.png", instagramHandle: "@fernanda_silva", name: "Fernanda Silva" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0006.webm", thumbnail: "/images/videoframe_WW006.png", instagramHandle: "@mariana_rocha", name: "Mariana Rocha" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0007.webm", thumbnail: "/images/videoframe_WW007.png", instagramHandle: "@camila_alves", name: "Camila Alves" },
    { src: "https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev/videosite/VID-20251027-WA0008.webm", thumbnail: "/images/videoframe_WW008.png", instagramHandle: "@bruna_martins", name: "Bruna Martins" }
  ],
  onCtaClick
}) => {
  const t = useTranslations('christmasSpirit');
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false
  });
  
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(false);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [videoRefs, setVideoRefs] = useState<(HTMLVideoElement | null)[]>([]);
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());
  const [shouldDeferHeavy, setShouldDeferHeavy] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);



  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    const newIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIndex);
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    
    // Controlar reprodução dos vídeos
    videoRefs.forEach((video, index) => {
      if (video) {
        if (index === newIndex) {
          video.play().catch(() => {
            // Silenciar erros de autoplay
          });
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [videoRefs]);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  // Inicializar array de referências dos vídeos
  useEffect(() => {
    setVideoRefs(new Array(videos.length).fill(null));
  }, [videos.length]);

  // Reproduzir o primeiro vídeo quando o componente carrega
  useEffect(() => {
    if (videoRefs[0]) {
      videoRefs[0].play().catch(() => {
        // Silenciar erros de autoplay
      });
    }
  }, [videoRefs]);

  useEffect(() => {
    try {
      type NI = { saveData?: boolean; effectiveType?: string };
      const nav = navigator as unknown as { connection?: NI; mozConnection?: NI; webkitConnection?: NI };
      const conn: NI | undefined = nav.connection || nav.mozConnection || nav.webkitConnection;
      const saveData = !!conn?.saveData;
      const type = (conn?.effectiveType || '').toLowerCase();
      const isSlow = ['slow-2g', '2g', '3g'].includes(type);
      setShouldDeferHeavy(saveData || isSlow);
    } catch {}
  }, []);

  // Ensure video markup only renders on client to avoid hydration mismatches
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const head = document.head;
    const existing = new Set(
      Array.from(document.querySelectorAll('link[rel="preload"][as="image"][data-preload-thumb="true"]'))
        .map((el) => el.getAttribute('href') || '')
    );
    const toPreload = videos.slice(0, Math.min(8, videos.length));
    toPreload.forEach((v) => {
      if (!existing.has(v.thumbnail)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = v.thumbnail;
        link.setAttribute('data-preload-thumb', 'true');
        head.appendChild(link);
      }
    });
  }, [videos]);
  return (
    <section id="reviews" className="py-10 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center px-4">
          <h2 className="text-[38px] md:text-5xl font-fertigo font-bold text-black my-6 leading-tight">
            {title || t('title')}
          </h2>
          
          {/* 5 Stars Rating */}
          <div className="flex justify-center items-center gap-[0.8px] mb-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-[22px] h-[22px] text-[#bbb012ab] fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          
          <p className="text-[18px] md:text-2xl text-black font-medium bg-[#f8ebd4] px-4 py-2 rounded-full inline-block shadow-md">
            {subtitle || t('subtitle')}
          </p>
        </div>

        {/* Videos Embla Carousel */}
        <div className="my-12 relative">

          
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex">
              {videos.map((video, index) => {
                const leftNeighbor = (selectedIndex - 1 + videos.length) % videos.length;
                const rightNeighbor = (selectedIndex + 1) % videos.length;
                const preload = index === selectedIndex || index === leftNeighbor || index === rightNeighbor;
                const earlyThumb = index < 4;
                const thumbEager = earlyThumb || isMobile || preload;
                return (
                <div key={index} className="embla__slide flex-[0_0_80%] md:flex-[0_0_60%] lg:flex-[0_0_40%] min-w-0 pl-4">
                  <div className="relative group">
                    <div className="relative aspect-[9/12] bg-white rounded-2xl overflow-hidden shadow-lg mx-auto max-w-sm">
                      {/* Thumbnail-first loading system */}
                      <div className="relative w-full h-full">
                        {/* Thumbnail - Always visible until video is loaded */}
                        <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${loadedVideos.has(index) ? 'opacity-0' : 'opacity-100'}`}>
                          <Image
                            src={video.thumbnail}
                            alt={`Thumbnail de ${video.name}`}
                            fill
                            className="object-cover"
                            unoptimized
                            loading={thumbEager ? 'eager' : 'lazy'}
                            sizes="(max-width: 768px) 80vw, (max-width: 1024px) 60vw, 40vw"
                            quality={65}
                            placeholder="blur"
                            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                            priority={thumbEager}
                            fetchPriority={thumbEager ? 'high' : 'low'}
                          />

                          <div className="bg-white bg-opacity-90 rounded-full p-4 shadow-lg hover:bg-opacity-100 transition-all duration-300">
                            <svg 
                              className="w-8 h-8 text-red-500" 
                              fill="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>

                        </div>

                        {/* Video - Only loads when thumbnail is clicked or slide is active (and not deferring on slow/mobile data) */}
                        {isHydrated && (loadedVideos.has(index) || (selectedIndex === index && !shouldDeferHeavy)) && (
                          <video
                            suppressHydrationWarning
                            ref={(el) => {
                              if (el && videoRefs[index] !== el) {
                                const newRefs = [...videoRefs];
                                newRefs[index] = el;
                                setVideoRefs(newRefs);
                              }
                            }}
                            className="w-full h-full object-cover block relative z-20"
                            muted
                            loop
                            playsInline
                            crossOrigin="anonymous"
                            preload={selectedIndex === index ? 'metadata' : 'none'}
                            poster={video.thumbnail}
                            style={{ display: 'block', visibility: 'visible' }}
                            onLoadedData={() => {
                              setLoadedVideos(prev => new Set(prev).add(index));
                            }}
                            onError={() => {
                              // Silenciar erros esperados de rede/tipo; o navegador já tentará a próxima fonte
                            }}
                          >
                            <source suppressHydrationWarning src={video.src} type="video/webm" />
                            {/* <source suppressHydrationWarning src={video.src.replace('.webm', '.mp4')} type="video/mp4" /> */}
                          </video>
                        )}
                      </div>

                      {/* Instagram Handle Overlay - Bottom Left */}
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {video.instagramHandle}
                      </div>
                      

                    </div>
                  </div>
                </div>
              );})}
            </div>
          </div>

          {/* Custom Navigation Buttons */}
          <button 
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('aria.prevButton')}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('aria.nextButton')}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>       
       </div>

        {/* CTA Section */}
        <div className="text-center px-20">
          <button
            onClick={onCtaClick}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-5 px-2 rounded-full transition-all duration-300 transform hover:scale-105 uppercase tracking-wide"
          >
            {t('ctaButton')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default EspiritoNatalinoSection;
