import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mapeamento de países para locales suportados
const COUNTRY_TO_LOCALE: Record<string, string> = {
  // Português
  'BR': 'pt', 'PT': 'pt', 'AO': 'pt', 'MZ': 'pt', 'CV': 'pt', 'GW': 'pt', 'ST': 'pt', 'TL': 'pt', 'MO': 'pt',
  
  // Espanhol
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es', 'CL': 'es', 'EC': 'es', 'GT': 'es',
  'CU': 'es', 'BO': 'es', 'DO': 'es', 'HN': 'es', 'PY': 'es', 'SV': 'es', 'NI': 'es', 'CR': 'es', 'PA': 'es',
  'UY': 'es', 'PR': 'es', 'GQ': 'es',
  
  // Inglês (default para outros países)
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en', 'ZA': 'en', 'IN': 'en', 'SG': 'en'
};

// Detectar país via headers (Cloudflare, Vercel, etc.)
function detectCountryFromHeaders(request: NextRequest): string | null {
  // Cloudflare
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry.toUpperCase();
  }

  // Vercel
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  if (vercelCountry && vercelCountry !== 'XX') {
    return vercelCountry.toUpperCase();
  }

  // AWS CloudFront
  const awsCountry = request.headers.get('cloudfront-viewer-country');
  if (awsCountry && awsCountry !== 'XX') {
    return awsCountry.toUpperCase();
  }

  return null;
}

// Detectar locale baseado no Accept-Language
function detectLocaleFromAcceptLanguage(request: NextRequest): string | null {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return null;

  // Extrair o primeiro idioma preferido
  const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
  
  for (const lang of languages) {
    if (lang.startsWith('pt')) return 'pt';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('en')) return 'en';
  }

  return null;
}

// Middleware customizado
const intlMiddleware = createMiddleware({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se a URL já tem um locale, usar o middleware padrão do next-intl
  const hasLocale = ['pt', 'en', 'es'].some(locale => 
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    return intlMiddleware(request);
  }

  // Se está acessando a raiz (/), detectar país e redirecionar
  if (pathname === '/') {
    let detectedLocale = 'pt'; // default

    // 1. Tentar detectar via headers do CDN/proxy
    const country = detectCountryFromHeaders(request);
    if (country && COUNTRY_TO_LOCALE[country]) {
      detectedLocale = COUNTRY_TO_LOCALE[country];
      console.log(`País detectado via headers: ${country} -> locale: ${detectedLocale}`);
    } else {
      // 2. Fallback: detectar via Accept-Language
      const langLocale = detectLocaleFromAcceptLanguage(request);
      if (langLocale) {
        detectedLocale = langLocale;
        console.log(`Locale detectado via Accept-Language: ${detectedLocale}`);
      }
    }

    // Redirecionar para a página com locale detectado e parâmetro especial
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}`;
    
    // Adicionar parâmetro para mostrar popup de confirmação
    url.searchParams.set('country_detected', 'true');
    url.searchParams.set('detected_country', country || 'unknown');
    url.searchParams.set('detected_locale', detectedLocale);

    return NextResponse.redirect(url);
  }

  // Para outras rotas sem locale, usar o middleware padrão
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};