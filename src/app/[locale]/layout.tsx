import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import PageViewTracker from '@/components/tracking/PageViewTracker';
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
          {/* Meta Pixel */}
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !(function(f,b,e,v,n,t,s){
                  if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
                  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
                })(window,document,'https://connect.facebook.net/en_US/fbevents.js');
                (function(){
                  var id0 = '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ''}';
                  if (id0) { fbq('init', id0); fbq('set','autoConfig',false,id0); }
                  var __fbq = window.fbq;
                  window.fbq = function(){
                    var cmd = arguments[0];
                    var args = Array.prototype.slice.call(arguments,1);
                    var path = (window.location.pathname || '');
                    if (cmd === 'track' && args[0] === 'PageView' && path.includes('/pers/')) { return; }
                    return __fbq.apply(window,[cmd].concat(args));
                  };
                  if (!(window.location.pathname || '').includes('/pers/')) { fbq('track', 'PageView'); }
                })();
              `
            }}
          />
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
          {/* Page view derivado por URL */}
          <PageViewTracker />
          {children}
          <noscript>
            <img height="1" width="1" style={{display:'none'}} alt="" src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ''}&ev=PageView&noscript=1`} />
          </noscript>
          <SupportWhatsAppButton />
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
