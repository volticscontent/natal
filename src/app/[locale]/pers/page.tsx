'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUtmTracking } from '@/hooks/useUtmTracking';

export default function PersPage() {
  const router = useRouter();
  const t = useTranslations('redirectPages');
  const { buildPersonalizationLink, isInitialized } = useUtmTracking();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    if (isInitialized && !hasRedirected) {
      setHasRedirected(true);
      // Redirecionar para o primeiro step
      const step1Url = buildPersonalizationLink('1');
      router.replace(step1Url);
    }
  }, [isInitialized, buildPersonalizationLink, router, hasRedirected]);
  
  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('redirectingToPersonalization')}</p>
      </div>
    </div>
  );
}