'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { ThankYouLastLink, ThankYouCartPanda } from '@/components/main/pós_compra';

interface ThankYouPageProps {
  params: Promise<{
    locale: string;
    provider: 'lastlink' | 'cartpanda';
  }>;
}

export default function ThankYouPage({ params }: ThankYouPageProps) {
  const { locale, provider } = use(params);
  const t = useTranslations('redirectPages');

  // Renderizar o componente correto baseado no provider
  if (provider === 'lastlink') {
    return <ThankYouLastLink />;
  }

  if (provider === 'cartpanda') {
    return <ThankYouCartPanda />;
  }

  // Provider inválido - redirecionar para home
  if (typeof window !== 'undefined') {
    window.location.href = `/${locale}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('notFound')}</h1>
        <p className="text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}