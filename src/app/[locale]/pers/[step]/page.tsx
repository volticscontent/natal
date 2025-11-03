'use client';

import { useUtmTracking } from '@/hooks/useUtmTracking';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePersonalizationPageTitle } from '@/hooks/usePageTitle';
import Step1QuantidadeCriancas from '@/components/main/pers/steps/Step1QuantidadeCriancas';
import Step2OrderBumps from '@/components/main/pers/steps/Step2OrderBumps';
import Step3DadosCriancas from '@/components/main/pers/steps/Step3DadosCriancas';
import { use } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';

interface PersStepPageProps {
  params: Promise<{
    step: string;
    locale: string;
  }>;
}

export default function PersStepPage({ params }: PersStepPageProps) {
  const { step, locale } = use(params);
  const { buildPersonalizationLink, isInitialized } = useUtmTracking(locale as 'pt' | 'en' | 'es');
  // Inicializar pixels para garantir que fbq/ttq/gtag estejam disponíveis
  usePixelTracking();
  const t = useTranslations('pers');
  const router = useRouter();
  
  // Título dinâmico da página
  usePersonalizationPageTitle(step, locale);

  // Redirecionar se não há step ou step inválido
  useEffect(() => {
    if (isInitialized) {
      if (!step || !['1', '2', '3'].includes(step)) {
        const step1Url = buildPersonalizationLink('1');
        router.replace(step1Url);
      }
    }
  }, [step, isInitialized, buildPersonalizationLink, router, locale]);

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