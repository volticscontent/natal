import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import PageViewTracker from '@/components/tracking/PageViewTracker';
import ClarityInit from '@/components/tracking/ClarityInit';
import { Inter } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import SupportWhatsAppButton from '@/components/SupportWhatsAppButton';

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
          {/* Meta Pixel injection moved to root layout */}
          {/* TikTok Pixel */}
          <Script
            id="tiktok-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,t){
                  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                  ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
                  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)))};
                  };
                  for(var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
                  ttq.load=function(sdkid){var script=d.createElement('script');script.type='text/javascript';script.async=!0;script.src='https://analytics.tiktok.com/i18n/pixel/events.js?sdkid='+sdkid+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(script,a)};
                  ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || ''}');
                  ttq.page();
                })(window,document,'ttq');
              `
            }}
          />
          <ClarityInit />
          {/* Page view derivado por URL */}
          <PageViewTracker />
          {children}
          {/* noscript removed to evitar disparo em /pers/* */}
          <SupportWhatsAppButton />
        </NextIntlClientProvider>
        
        {/* Vercel Analytics */}
        <SpeedInsights />
        <Analytics />
        
        {/* UTMify injection moved to root layout */}
      </body>
    </html>
  );
}
