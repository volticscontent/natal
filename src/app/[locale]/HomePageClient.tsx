'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { 
  HeroSection,
  FooterSection,
  PromoBanner,
  FloatingCarousel,
  FloatingCarousel2,
  VideoSection,
  ProductCarousel,
  SocialProofSection,
  AvaliacaoEspecialistaSection,
  DescontoCard,
  FAQSection,
  SocialCarousel
} from '@/components/main';
import EspalhaBondadeSection from '@/components/main/EspalhaBondadeSection';
import EspiritoNatalinoSection from '@/components/main/EspiritoNatalinoSection';
import ComoPedirSection from '@/components/main/ComoPedirSection';
import CalendarioSection from '@/components/main/CalendarioSection';
import { useUtmTracking } from '@/hooks/useUtmTracking';
import { useDataLayer } from '@/hooks/useDataLayer';

interface HomePageClientProps {
  locale: string;
}

export default function HomePageClient({ locale }: HomePageClientProps) {
  const router = useRouter();
  
  // Inicializar UTM tracking
  const { sessionId, utmParams, isInitialized, buildPersonalizationLink } = useUtmTracking();
  
  // Inicializar DataLayer tracking
  const { trackPageView, trackCustomEvent } = useDataLayer();
  
  // Track page view quando a página carregar
  useEffect(() => {
    if (isInitialized) {
      trackPageView({
        pageTitle: 'Recadinhos do Papai Noel - Página Principal',
        pagePath: `/${locale}`,
      });
    }
  }, [isInitialized, locale, trackPageView]);
  
  // Log para debug
  if (isInitialized) {
    console.log('UTM Tracking inicializado:', { sessionId, utmParams, locale });
  }

  // Função para redirecionar para personalização com UTMs
  const handleCtaClick = (source: string = 'generic') => {
    // Track CTA click event
    trackCustomEvent('cta_click', {
      source: source,
      page: 'home',
      destination: 'personalization_step_1',
      locale: locale,
    });
    
    const persUrl = buildPersonalizationLink('1');
    router.push(persUrl);
  };

  return (
    <div>
      {/* SESSÃO 01 - Hero, Header e Banner de Promoção */}
      <PromoBanner />
      <Header />
      
      {/* SESSÃO 02 - Hero Section */}
      <HeroSection onCtaClick={() => handleCtaClick('hero_section')} />
      
      {/* SESSÃO 03 - Carrossel Flutuante */}
      <FloatingCarousel />

      {/* SESSÃO 04 - Carrossel de Produtos (OS MAIS VENDIDOS) */}
      <ProductCarousel onProductClick={() => handleCtaClick('product_carousel')} />

      {/* SESSÃO 05 - Leve o Espírito Natalino */}
      <EspiritoNatalinoSection onCtaClick={() => handleCtaClick('espirito_natalino')} />
      
      {/* SESSÃO 06 - Como Pedir? */}
      <ComoPedirSection onCtaClick={() => handleCtaClick('como_pedir')} />
      
      {/* SESSÃO 07 - Floating Carousel 2 */}
      <FloatingCarousel2 />
      
      {/* SESSÃO 08 - Video Section */}
      <VideoSection onCtaClick={() => handleCtaClick('video_section')} />
      
      {/* SESSÃO 09 - Calendário do Advento */}
      <CalendarioSection onCtaClick={() => handleCtaClick('calendario')} />
      
      {/* SESSÃO 10 - Card de Desconto */}
      <DescontoCard onCtaClick={() => handleCtaClick('desconto_card')} />

      {/* SESSÃO 10.5 - FAQ / Dúvidas Frequentes */}
      <FAQSection />

      {/* SESSÃO 10.6 - Carrossel Social #GerandoSorrisos */}
      <SocialCarousel />

      {/* SESSÃO 11 - Prova Social */}
      <SocialProofSection />
      
      {/* SESSÃO 12 - Avaliação de Especialistas */}
      <AvaliacaoEspecialistaSection onCtaClick={() => handleCtaClick('avaliacao_especialista')} />

      {/* SESSÃO 13 - Espalhando Bondade */}
      <EspalhaBondadeSection onCtaClick={() => handleCtaClick('espalha_bondade')} />
            
      {/* SESSÃO 14 - Final */}      
      <FooterSection />
    </div>
  );
}