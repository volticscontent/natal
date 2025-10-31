'use client';

import { use, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { 
  HeroSection,
  FooterSection,
  PromoBanner,
  ProductCarousel
} from '@/components/main';
import { useUtmTracking } from '@/hooks/useUtmTracking';

// Lazy loading para componentes não críticos
const FloatingCarousel2 = lazy(() => import('@/components/main').then(mod => ({ default: mod.FloatingCarousel2 })));
const VideoSection = lazy(() => import('@/components/main').then(mod => ({ default: mod.VideoSection })));
const SocialProofSection = lazy(() => import('@/components/main').then(mod => ({ default: mod.SocialProofSection })));
const AvaliacaoEspecialistaSection = lazy(() => import('@/components/main').then(mod => ({ default: mod.AvaliacaoEspecialistaSection })));
const DescontoCard = lazy(() => import('@/components/main').then(mod => ({ default: mod.DescontoCard })));
const FAQSection = lazy(() => import('@/components/main').then(mod => ({ default: mod.FAQSection })));
const SocialCarousel = lazy(() => import('@/components/main').then(mod => ({ default: mod.SocialCarousel })));
const DynamicFloatingCarousel = lazy(() => import('@/components/dynamic/DynamicFloatingCarousel'));
const EspalhaBondadeSection = lazy(() => import('@/components/main/EspalhaBondadeSection'));
const EspiritoNatalinoSection = lazy(() => import('@/components/main/EspiritoNatalinoSection'));
const ComoPedirSection = lazy(() => import('@/components/main/ComoPedirSection'));
const CalendarioSection = lazy(() => import('@/components/main/CalendarioSection'));

export default function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  
  // Inicializar UTM tracking
  const { sessionId, utmParams, isInitialized, buildPersonalizationLink } = useUtmTracking();
  
  // Log para debug
  if (isInitialized) {
    console.log('UTM Tracking inicializado:', { sessionId, utmParams, locale });
  }

  // Função para redirecionar para personalização com UTMs
  const handleCtaClick = () => {
    const persUrl = buildPersonalizationLink('1');
    router.push(persUrl);
  };

  return (
    <div>
      {/* SESSÃO 01 - Banner de Promoção e Hero Section (crítico para LCP) */}
      <PromoBanner />
      
      {/* SESSÃO 02 - Hero Section (carregamento prioritário) */}
      <main id="main-content">
        <HeroSection onCtaClick={handleCtaClick} />
      
      {/* SESSÃO 03 - Header (após hero para melhor LCP) */}
      <Header />

      <Suspense fallback={<div style={{ height: '200px' }} />}>
        <DynamicFloatingCarousel />
      </Suspense>
      
      {/* SESSÃO 05 - Carrossel de Produtos (OS MAIS VENDIDOS) */}
      <ProductCarousel onProductClick={handleCtaClick} />


      <Suspense fallback={<div style={{ height: '400px' }} />}>
        <EspiritoNatalinoSection onCtaClick={handleCtaClick} />
      </Suspense>
      
      <Suspense fallback={<div style={{ height: '300px' }} />}>
        <ComoPedirSection onCtaClick={handleCtaClick} />
      </Suspense>
      
      <Suspense fallback={<div style={{ height: '200px' }} />}>
        <FloatingCarousel2 />
      </Suspense>
      
      <Suspense fallback={<div style={{ height: '400px' }} />}>
        <VideoSection onCtaClick={handleCtaClick} />
      </Suspense>
      
      <Suspense fallback={<div style={{ height: '500px' }} />}>
        <CalendarioSection onCtaClick={handleCtaClick} />
      </Suspense>
      
      <Suspense fallback={<div style={{ height: '300px' }} />}>
        <DescontoCard onCtaClick={handleCtaClick} />
      </Suspense>

      <Suspense fallback={<div style={{ height: '400px' }} />}>
        <FAQSection />
      </Suspense>

      <Suspense fallback={<div style={{ height: '300px' }} />}>
        <SocialCarousel />
      </Suspense>

      <Suspense fallback={<div style={{ height: '400px' }} />}>
        <SocialProofSection />
      </Suspense>
      
      <Suspense fallback={<div style={{ height: '300px' }} />}>
        <AvaliacaoEspecialistaSection onCtaClick={handleCtaClick} />
      </Suspense>

      <Suspense fallback={<div style={{ height: '400px' }} />}>
        <EspalhaBondadeSection onCtaClick={handleCtaClick} />
      </Suspense>
      </main>
            
      {/* SESSÃO 14 - Final */}      
      <FooterSection />
    </div>
  );
}
