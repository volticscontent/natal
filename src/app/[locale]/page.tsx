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
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePageTitle } from '@/hooks/usePageTitle';

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
  
  // Título dinâmico da página inicial
  const getHomePageTitle = (locale: string) => {
    const titles: Record<string, string> = {
      pt: 'Recadinhos do Papai Noel - Vídeos Personalizados',
      en: 'Santa Messages - Personalized Videos',
      es: 'Mensajes de Papá Noel - Videos Personalizados'
    };
    return titles[locale] || titles['pt'];
  };
  
  const getHomePageDescription = (locale: string) => {
    const descriptions: Record<string, string> = {
      pt: 'Crie vídeos personalizados do Papai Noel para suas crianças. Magia natalina única e inesquecível!',
      en: 'Create personalized Santa videos for your children. Unique and unforgettable Christmas magic!',
      es: 'Crea videos personalizados de Papá Noel para tus niños. ¡Magia navideña única e inolvidable!'
    };
    return descriptions[locale] || descriptions['pt'];
  };
  
  usePageTitle({ 
    title: getHomePageTitle(locale), 
    description: getHomePageDescription(locale),
    locale 
  });
  
  // Inicializar UTM tracking
  const { sessionId, utmParams, isInitialized, buildPersonalizationLink } = useUtmTracking();
  
  // Inicializar pixel tracking
  const { trackEvent } = usePixelTracking();
  
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
