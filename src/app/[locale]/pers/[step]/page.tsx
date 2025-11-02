'use client';

import { useUtmTracking } from '@/hooks/useUtmTracking';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGA4Tracking } from '@/lib/ga4-events';
import { usePersonalizationPageTitle } from '@/hooks/usePageTitle';
import { useDebugTracking } from '@/lib/debug-tracking';
import Step1QuantidadeCriancas from '@/components/main/pers/steps/Step1QuantidadeCriancas';
import Step2OrderBumps from '@/components/main/pers/steps/Step2OrderBumps';
import Step3DadosCriancas from '@/components/main/pers/steps/Step3DadosCriancas';
import { use } from 'react';

interface PersStepPageProps {
  params: Promise<{
    step: string;
    locale: string;
  }>;
}

export default function PersStepPage({ params }: PersStepPageProps) {
  const { step, locale } = use(params);
  const { buildPersonalizationLink, isInitialized } = useUtmTracking(locale as 'pt' | 'en' | 'es');
  const t = useTranslations('pers');
  const router = useRouter();
  
  // Título dinâmico da página
  usePersonalizationPageTitle(step, locale);
  
  // GA4 Tracking
  const { trackCartaPersonalizada } = useGA4Tracking();
  
  // Debug Tracking para Meta e TikTok
  const { trackStepLoad } = useDebugTracking();

  // Redirecionar se não há step ou step inválido
  useEffect(() => {
    if (isInitialized) {
      if (!step || !['1', '2', '3'].includes(step)) {
        const step1Url = buildPersonalizationLink('1');
        router.replace(step1Url);
      } else {
        // 🎄 GA4 Tracking: Carta Personalizada por step
        trackCartaPersonalizada({
          personalization_step: `step_${step}`,
          step_number: parseInt(step),
          page_location: window.location.href,
          user_language: locale
        });

        // 🎯 DEBUG TRACKING: Step carregado para Meta e TikTok
        if (step === '1') {
          trackStepLoad(1, 'Quantidade de Crianças');
        } else if (step === '3') {
          trackStepLoad(3, 'Dados das Crianças');
        }
      }
    }
  }, [step, isInitialized, buildPersonalizationLink, router, trackCartaPersonalizada, trackStepLoad, locale]);

  // Loading state enquanto inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderizar componente baseado no step
  const renderStep = () => {
    switch (step) {
      case '1':
        return (
          <Step1QuantidadeCriancas 
            buildPersonalizationLink={buildPersonalizationLink}
            t={t}
            locale={locale as 'pt' | 'en' | 'es'}
          />
        );
      case '2':
        return (
          <Step2OrderBumps 
            buildPersonalizationLink={buildPersonalizationLink}
            t={t}
            locale={locale as 'pt' | 'en' | 'es'}
          />
        );
      case '3':
        return (
          <Step3DadosCriancas 
            locale={locale as 'pt' | 'en' | 'es'}
            buildPersonalizationLink={buildPersonalizationLink}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return renderStep();
}