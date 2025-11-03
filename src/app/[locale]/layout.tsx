import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import PixelScripts from '@/components/tracking/PixelScripts';
import PixelDebugger from '@/components/tracking/PixelDebugger';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';

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
        <link rel="preload" href="/images/logo.webp" as="image" fetchPriority="high" />
        <link rel="preload" href="https://db.onlinewebfonts.com/t/3bed3a67d2827afda9526cb21311b9f8.woff2" as="font" type="font/woff2" crossOrigin="anonymous" fetchPriority="high" />
        
        {/* Preconnect para recursos críticos externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        
        {/* DNS Prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//cdn.utmify.com.br" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {/* Skip links para navegação por teclado */}
          <a href="#main-content" className="skip-link">
            Pular para o conteúdo principal
          </a>
          <a href="#navigation" className="skip-link">
            Pular para a navegação
          </a>
          
          {children}
          {/* Carregamento dos pixels Facebook e TikTok */}
          {process.env.NODE_ENV === 'production' && <PixelScripts />}
          {/* Debug dos pixels */}
          <PixelDebugger />
        </NextIntlClientProvider>
        
        {/* Vercel Analytics */}
        <SpeedInsights />
        <Analytics />
        
        {/* UTMify Script */}
        <Script
          id="utmify-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://cdn.utmify.com.br/scripts/utms.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_UTMFY_PIXEL_ID}');
            `
          }}
        />
      </body>
    </html>
  );
}