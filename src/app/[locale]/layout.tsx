import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AsyncTrackingScripts from '@/components/tracking/AsyncTrackingScripts';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ["latin"] });

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
  const messages = await getMessages({ locale });

  // Mapear locale para lang apropriado
  const langMap: Record<string, string> = {
    'pt': 'pt-BR',
    'en': 'en-US',
    'es': 'es-ES'
  };

  return (
    <html lang={langMap[locale] || 'pt-BR'} suppressHydrationWarning={true}>
      <head>
        {/* Preload de recursos críticos com fetchpriority */}
        <link rel="preload" href="/hero/bg-1440.webp" as="image" media="(min-width: 768px)" fetchPriority="high" />
        <link rel="preload" href="/hero/bg-750.webp" as="image" media="(max-width: 767px)" fetchPriority="high" />
        <link rel="preload" href="/images/logo_65x91.webp" as="image" fetchPriority="high" />
        <link rel="preload" href="https://db.onlinewebfonts.com/t/3bed3a67d2827afda9526cb21311b9f8.woff2" as="font" type="font/woff2" crossOrigin="anonymous" fetchPriority="high" />
        
        {/* Preconnect para recursos críticos externos */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://analytics.tiktok.com" />
        
        {/* DNS Prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//cdn.utmify.com.br" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <NextIntlClientProvider messages={messages}>
          {/* Skip links para navegação por teclado */}
          <a href="#main-content" className="skip-link">
            Pular para o conteúdo principal
          </a>
          <a href="#navigation" className="skip-link">
            Pular para a navegação
          </a>
          
          {children}
          {/* Carregamento assíncrono de tracking apenas em produção */}
          {process.env.NODE_ENV === 'production' && <AsyncTrackingScripts />}
        </NextIntlClientProvider>
        
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID} />
        )}
        
        {/* Vercel Analytics */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}