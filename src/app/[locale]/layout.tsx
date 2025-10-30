import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import CountryConfirmationPopup from '@/components/CountryConfirmationPopup';
import GA4CustomDimensions from '@/components/tracking/GA4CustomDimensions';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  console.log('Layout - Locale recebido:', locale);
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* GA4 Custom Dimensions - Componente de tracking avançado */}
      <GA4CustomDimensions locale={locale as 'pt' | 'en' | 'es'} />
      {children}
      <CountryConfirmationPopup />
    </NextIntlClientProvider>
  );
}