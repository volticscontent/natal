'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
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
      {/* SESSÃO 01 - Hero, Header e Banner de Promoção */}
      <PromoBanner />
      <Header />
      
      {/* SESSÃO 02 - Hero Section */}
      <HeroSection onCtaClick={handleCtaClick} />
      
      {/* SESSÃO 03 - Carrossel Flutuante */}
      <FloatingCarousel />

      {/* SESSÃO 04 - Carrossel de Produtos (OS MAIS VENDIDOS) */}
      <ProductCarousel onProductClick={handleCtaClick} />

      {/* SESSÃO 05 - Leve o Espírito Natalino */}
      <EspiritoNatalinoSection onCtaClick={handleCtaClick} />
      
      {/* SESSÃO 06 - Como Pedir? */}
      <ComoPedirSection onCtaClick={handleCtaClick} />
      
      {/* SESSÃO 07 - Floating Carousel 2 */}
      <FloatingCarousel2 />
      
      {/* SESSÃO 08 - Video Section */}
      <VideoSection onCtaClick={handleCtaClick} />
      
      {/* SESSÃO 09 - Calendário do Advento */}
      <CalendarioSection onCtaClick={handleCtaClick} />
      
      {/* SESSÃO 10 - Card de Desconto */}
      <DescontoCard onCtaClick={handleCtaClick} />

      {/* SESSÃO 10.5 - FAQ / Dúvidas Frequentes */}
      <FAQSection />

      {/* SESSÃO 10.6 - Carrossel Social #GerandoSorrisos */}
      <SocialCarousel />

      {/* SESSÃO 11 - Prova Social */}
      <SocialProofSection />
      
      {/* SESSÃO 12 - Avaliação de Especialistas */}
      <AvaliacaoEspecialistaSection onCtaClick={handleCtaClick} />

      {/* SESSÃO 13 - Espalhando Bondade */}
      <EspalhaBondadeSection onCtaClick={handleCtaClick} />
            
      {/* SESSÃO 14 - Final */}      
      <FooterSection />
    </div>
  );
}
