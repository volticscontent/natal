import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

// Configuração do middleware de internacionalização
const intlMiddleware = createIntlMiddleware({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get('user-agent') || '';
  const desktopBypassCookie = request.cookies.get('desktop_access')?.value || '';
  const hasDesktopBypass = /^(1|true)$/i.test(desktopBypassCookie);
  try { console.log('[MW] start', { pathname, hasDesktopBypass, ua: ua.slice(0,120) }); } catch {}

  const isMobileOrTabletGlobal = /Mobi|Android|iPhone|iPod|IEMobile|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(ua)
    || /iPad|Tablet/i.test(ua);
  const isDesktopGlobal = !isMobileOrTabletGlobal;
  const isApi = pathname.startsWith('/api/');
  const isVideo = pathname.startsWith('/videos/') || /\.(webm|mp4)$/i.test(pathname);
  const isDesktopPage = !pathname.includes('/desktop-blocked') && !pathname.includes('/desktop-login');
  if (isDesktopGlobal && !hasDesktopBypass && !isApi && !isVideo && isDesktopPage) {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const primaryLang = acceptLanguage.split(',')[0]?.toLowerCase() || '';
    const baseLocale = (pathname.match(/^\/(pt|en|es)(\/|$)/)?.[1])
      || (primaryLang.startsWith('es') ? 'es' : primaryLang.startsWith('pt') ? 'pt' : 'en');
    const vercelCountry = request.headers.get('x-vercel-ip-country') || '';
    const cfCountry = request.headers.get('cf-ipcountry') || '';
    const ipCountry = (vercelCountry || cfCountry).toUpperCase();
    const mapCountryToSlug = (code?: string): string | null => {
      switch ((code || '').toUpperCase()) {
        case 'BR': return 'br';
        case 'US': return 'us';
        case 'GB': return 'gb';
        case 'UK': return 'gb';
        case 'CA': return 'ca';
        case 'AU': return 'au';
        case 'ES': return 'es';
        default: return null;
      }
    };
    const detectedCountrySlug = mapCountryToSlug(ipCountry);
    const blockedUrl = new URL(`/${baseLocale}/desktop-blocked`, request.url);
    blockedUrl.search = request.nextUrl.search;
    const res = NextResponse.redirect(blockedUrl);
    const isoCountry = (detectedCountrySlug || '') === 'br' ? 'BR'
      : (detectedCountrySlug === 'us' ? 'US'
      : (detectedCountrySlug === 'gb' ? 'GB'
      : (detectedCountrySlug === 'ca' ? 'CA'
      : (detectedCountrySlug === 'au' ? 'AU'
      : (detectedCountrySlug === 'es' ? 'ES' : '')))));
    if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
    res.cookies.set('geo_locale', baseLocale, { path: '/', maxAge: 60 * 60 * 6 });
    return res;
  }

  if (pathname === '/') {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const vercelCountry = request.headers.get('x-vercel-ip-country') || '';
    const cfCountry = request.headers.get('cf-ipcountry') || '';
    const primaryLang = acceptLanguage.split(',')[0]?.toLowerCase() || '';
    const baseLocale = primaryLang.startsWith('es') ? 'es' : primaryLang.startsWith('pt') ? 'pt' : 'en';
    const ipCountry = (vercelCountry || cfCountry).toUpperCase();
    const countryFromLang = primaryLang.includes('-') ? primaryLang.split('-')[1].toUpperCase() : '';

    const mapCountryToSlug = (code?: string): string | null => {
      switch ((code || '').toUpperCase()) {
        case 'BR': return 'br';
        case 'US': return 'us';
        case 'GB': return 'gb';
        case 'UK': return 'gb';
        case 'CA': return 'ca';
        case 'AU': return 'au';
        case 'ES': return 'es';
        default: return null;
      }
    };

    const detectedCountrySlug = mapCountryToSlug(ipCountry) || mapCountryToSlug(countryFromLang);

    let target: string;
    if (baseLocale === 'pt') {
      target = `/pt/${detectedCountrySlug || 'br'}`;
    } else if (baseLocale === 'en') {
      const candidate = detectedCountrySlug || 'us';
      const supported = ['us', 'gb', 'ca', 'au'];
      target = `/en/${supported.includes(candidate) ? candidate : 'us'}`;
    } else {
      target = `/es/${detectedCountrySlug || 'es'}`;
    }

    const isMobileOrTabletRoot = /Mobi|Android|iPhone|iPod|IEMobile|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(ua)
      || /iPad|Tablet/i.test(ua);
    const isDesktopRoot = !isMobileOrTabletRoot;

    try { console.log('[MW] root decision', { isDesktopRoot, hasDesktopBypass }); } catch {}
    if (isDesktopRoot && !hasDesktopBypass) {
      const url = new URL(`/${baseLocale}/desktop-blocked`, request.url);
      const res = NextResponse.redirect(url);
      try { console.log('[MW] root rewrite to blocked', { target: `/${baseLocale}/desktop-blocked` }); } catch {}
      const isoCountry = (detectedCountrySlug || '') === 'br' ? 'BR'
        : (detectedCountrySlug === 'us' ? 'US'
        : (detectedCountrySlug === 'gb' ? 'GB'
        : (detectedCountrySlug === 'ca' ? 'CA'
        : (detectedCountrySlug === 'au' ? 'AU'
        : (detectedCountrySlug === 'es' ? 'ES' : '')))));
      if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
      res.cookies.set('geo_locale', baseLocale, { path: '/', maxAge: 60 * 60 * 6 });
      return res;
    }

    const url = new URL(target, request.url);
    url.search = request.nextUrl.search;
    const res = NextResponse.rewrite(url);
    const isoCountry = (detectedCountrySlug || '') === 'br' ? 'BR'
      : (detectedCountrySlug === 'us' ? 'US'
      : (detectedCountrySlug === 'gb' ? 'GB'
      : (detectedCountrySlug === 'ca' ? 'CA'
      : (detectedCountrySlug === 'au' ? 'AU'
      : (detectedCountrySlug === 'es' ? 'ES' : '')))));
    if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
    res.cookies.set('geo_locale', baseLocale, { path: '/', maxAge: 60 * 60 * 6 });
    return res;
  }

  // Suporte a rotas com país primeiro: /dom, /dom/en, /mx, /mx/es, etc.
  // Mapeia para estrutura /locale/country mantendo o restante do caminho
  const countryFirstMatch = pathname.match(/^\/(br|do|dom|mx|us|gb|uk|ca|au|eu|es|pt)(?:\/(pt|en|es))?(?:\/(.*))?$/i);
  if (countryFirstMatch) {
    const rawCountry = countryFirstMatch[1].toLowerCase();
    const maybeLocale = (countryFirstMatch[2] || '').toLowerCase();
    const rest = countryFirstMatch[3] ? `/${countryFirstMatch[3]}` : '';

    const alias: Record<string, string> = { uk: 'gb', dom: 'dom' };
    const countrySlug = alias[rawCountry] || rawCountry;

    const acceptLanguage = request.headers.get('accept-language') || '';
    const primaryLang = acceptLanguage.split(',')[0]?.toLowerCase() || '';
    const defaultLocale = primaryLang.startsWith('es') ? 'es' : primaryLang.startsWith('pt') ? 'pt' : 'en';
    const locale = (maybeLocale === 'pt' || maybeLocale === 'en' || maybeLocale === 'es') ? maybeLocale : defaultLocale;

    const isMobileOrTabletLocal = /Mobi|Android|iPhone|iPod|IEMobile|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(ua)
      || /iPad|Tablet/i.test(ua);
    const isDesktopLocal = !isMobileOrTabletLocal;

    if (isDesktopLocal && !hasDesktopBypass) {
      const blockedUrl = new URL(`/${locale}/desktop-blocked`, request.url);
      blockedUrl.search = request.nextUrl.search;
      const res = NextResponse.redirect(blockedUrl);
      const isoCountryBlocked = locale === 'pt' ? 'BR' : locale === 'es' ? 'ES' : 'US';
      if (isoCountryBlocked) res.cookies.set('geo_country', isoCountryBlocked, { path: '/', maxAge: 60 * 60 * 6 });
      res.cookies.set('geo_locale', locale, { path: '/', maxAge: 60 * 60 * 6 });
      return res;
    }

    const url = new URL(`/${locale}/${countrySlug}${rest}`, request.url);
    url.search = request.nextUrl.search;
    const res = NextResponse.redirect(url);
    const isoCountry = countrySlug === 'br' ? 'BR' : countrySlug === 'us' ? 'US' : countrySlug === 'gb' ? 'GB' : countrySlug === 'ca' ? 'CA' : countrySlug === 'au' ? 'AU' : countrySlug === 'es' ? 'ES' : '';
    if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
    res.cookies.set('geo_locale', locale, { path: '/', maxAge: 60 * 60 * 6 });
    return res;
  }

  // Reescrita para variantes com hífen (pt-br, en-us, en-gb, es-es) -> estrutura /locale/country
  const hyphenLocaleMatch = pathname.match(/^\/(pt-br|en-us|en-gb|es-es)(\/|$)/i);
  if (hyphenLocaleMatch) {
    const variant = hyphenLocaleMatch[1].toLowerCase();
    const rest = pathname.replace(new RegExp(`^\/${variant}`), '');
    let rewrittenPath = '';
    switch (variant) {
      case 'pt-br':
        rewrittenPath = `/pt/br${rest}`;
        break;
      case 'en-us':
        rewrittenPath = `/en/us${rest}`;
        break;
      case 'en-gb':
        rewrittenPath = `/en/gb${rest}`;
        break;
      case 'es-es':
        rewrittenPath = `/es/es${rest}`;
        break;
      default:
        rewrittenPath = pathname; // não deve acontecer
    }
    const url = new URL(rewrittenPath, request.url);
    url.search = request.nextUrl.search;
    const res = NextResponse.redirect(url);
    const isoCountry = rewrittenPath.includes('/pt/br') ? 'BR'
      : rewrittenPath.includes('/en/us') ? 'US'
      : rewrittenPath.includes('/en/gb') ? 'GB'
      : rewrittenPath.includes('/es/es') ? 'ES' : '';
    const locale = rewrittenPath.split('/')[1] || 'pt';
    if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
    res.cookies.set('geo_locale', locale, { path: '/', maxAge: 60 * 60 * 6 });
    return res;
  }

  // Normalização de caminho: se houver um terceiro segmento que é um país (ex.: /en/us/br),
  // e não for uma moeda válida, remover o segmento extra e redirecionar para /locale/country.
  {
    const m = pathname.match(/^\/(pt|en|es)\/([^\/]*)\/([^\/]*)(?:\/(.*))?$/i);
    if (m) {
      const locale = m[1].toLowerCase();
      const countrySlugRaw = m[2].toLowerCase();
      const third = m[3].toLowerCase();
      const rest = m[4] ? `/${m[4]}` : '';

      const countrySet = new Set(['br','us','gb','uk','ca','au','es','pt','mx','do','dom']);
      const currencySet = new Set(['brl','usd','gbp','eur','cad','aud','mxn','dop']);

      if (countrySet.has(third) || currencySet.has(third)) {
        const alias: Record<string,string> = { uk: 'gb', dom: 'dom' };
        const countrySlug = alias[countrySlugRaw] || countrySlugRaw;
        const url = new URL(`/${locale}/${countrySlug}${rest}`, request.url);
        url.search = request.nextUrl.search;
        const res = NextResponse.redirect(url);
        const isoCountry = countrySlug === 'br' ? 'BR' : countrySlug === 'us' ? 'US' : countrySlug === 'gb' ? 'GB' : countrySlug === 'ca' ? 'CA' : countrySlug === 'au' ? 'AU' : countrySlug === 'es' ? 'ES' : '';
        if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
        res.cookies.set('geo_locale', locale, { path: '/', maxAge: 60 * 60 * 6 });
        return res;
      }
    }
  }

  // Detecta dispositivo: considera mobile e tablet como permitidos
  const isMobileOrTablet = /Mobi|Android|iPhone|iPod|IEMobile|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(ua)
    || /iPad|Tablet/i.test(ua);
  const isDesktop = !isMobileOrTablet;

  // Rotas isentas de bloqueio de desktop para validações e páginas críticas

  // Excluir explicitamente vídeos do processamento de locale
  if (pathname.startsWith('/videos/') || 
      pathname.match(/\.(webm|mp4)$/)) {
    return NextResponse.next();
  }

  // Otimização: processar apenas rotas que realmente precisam
  if (pathname.startsWith('/api/')) {
    const uaSuspicious = (() => {
      const uaLower = ua.toLowerCase();
      if (!uaLower) return true;
      return /(headlesschrome|curl|python-requests|wget|httpclient|phantomjs)/i.test(uaLower);
    })();
    const method = request.method.toUpperCase();
    const isSensitiveApi = /^\/api\/(save-photos|upload-photos|submit-order)(\/|$)/i.test(pathname);
    const badMethodOnSensitive = isSensitiveApi && method !== 'POST';

    if (uaSuspicious || badMethodOnSensitive) {
      return new Response(null, { status: 403 });
    }

    // Enforce same-origin/allowlist para APIs sensíveis
    try {
      const origin = request.headers.get('origin') || '';
      const secFetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase();
      const isDev = process.env.NODE_ENV !== 'production';
      const allowedFromEnv = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const originAllowed = isDev
        ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        : (!!origin && allowedFromEnv.some(a => origin.startsWith(a)));
      const sameOriginLike = secFetchSite === 'same-origin' || secFetchSite === 'none';
      if (isSensitiveApi && method === 'POST' && !originAllowed && !sameOriginLike) {
        return new Response(null, { status: 403 });
      }
    } catch {}

    const reqHeaders = new Headers(request.headers);
    const vercelCountry = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
    const allowedCountries = new Set(['BR','US','GB','CA','AU','ES']);
    const geoSuspect = vercelCountry && !allowedCountries.has(vercelCountry);
    const markSuspect = geoSuspect || /^\/api\//.test(pathname);
    if (markSuspect) reqHeaders.set('x-waf-suspect', '1');

    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  // Bloqueio por dispositivo: impedir acesso via desktop (exceto quando cookie de bypass estiver presente)
  // Permitir explicitamente a página de login do desktop
  try { console.log('[MW] global decision', { isDesktop, hasDesktopBypass, pathname }); } catch {}
  if (isDesktop && !hasDesktopBypass && !pathname.includes('/desktop-blocked') && !pathname.includes('/desktop-login')) {
    // Detecta locale atual a partir do caminho, default 'pt'
    const localeMatch = pathname.match(/^\/(pt|en|es)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'pt';
    const url = new URL(`/${locale}/desktop-blocked`, request.url);
    const res = NextResponse.redirect(url);
    try { console.log('[MW] global rewrite to blocked', { target: `/${locale}/desktop-blocked` }); } catch {}
    const isoCountry = locale === 'pt' ? 'BR' : locale === 'es' ? 'ES' : 'US';
    if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
    res.cookies.set('geo_locale', locale, { path: '/', maxAge: 60 * 60 * 6 });
    return res;
  }

  // Aplicar middleware de internacionalização para outras rotas
  // Antes de aplicar, se a rota for apenas /pt, /en, /es (sem país), tentar reescrever para país adequado
  const onlyLocaleMatch = pathname.match(/^\/(pt|en|es)\/?$/);
  if (onlyLocaleMatch) {
    const baseLocale = onlyLocaleMatch[1];
    const acceptLanguage = request.headers.get('accept-language') || '';
    const vercelCountry = request.headers.get('x-vercel-ip-country') || '';
    const cfCountry = request.headers.get('cf-ipcountry') || '';
    const ipCountry = (vercelCountry || cfCountry).toUpperCase();

    const primaryLang = acceptLanguage.split(',')[0]?.toLowerCase() || '';
    const countryFromLang = primaryLang.includes('-') ? primaryLang.split('-')[1].toUpperCase() : '';

    // Mapeamento simples de país para slug usado na URL
    const mapCountryToSlug = (code?: string): string | null => {
      switch ((code || '').toUpperCase()) {
        case 'BR': return 'br';
        case 'US': return 'us';
        case 'GB': return 'gb';
        case 'UK': return 'gb';
        case 'CA': return 'ca';
        case 'AU': return 'au';
        case 'ES': return 'es';
        default: return null;
      }
    };

    const detectedCountrySlug = mapCountryToSlug(ipCountry) || mapCountryToSlug(countryFromLang);

    let rewriteTarget: string | null = null;
    if (baseLocale === 'pt') {
      rewriteTarget = `/pt/${detectedCountrySlug || 'br'}`;
    } else if (baseLocale === 'en') {
      // Priorizar US, GB; depois CA, AU; fallback US
      const candidate = detectedCountrySlug || 'us';
      const supported = ['us', 'gb', 'ca', 'au'];
      rewriteTarget = `/en/${supported.includes(candidate) ? candidate : 'us'}`;
    } else if (baseLocale === 'es') {
      rewriteTarget = `/es/${detectedCountrySlug || 'es'}`;
    }

    if (rewriteTarget) {
      if (isDesktop && !hasDesktopBypass) {
        const blockedUrl = new URL(`/${baseLocale}/desktop-blocked`, request.url);
        blockedUrl.search = request.nextUrl.search;
        const res = NextResponse.redirect(blockedUrl);
        const isoCountryBlocked = baseLocale === 'pt' ? 'BR' : baseLocale === 'es' ? 'ES' : 'US';
        if (isoCountryBlocked) res.cookies.set('geo_country', isoCountryBlocked, { path: '/', maxAge: 60 * 60 * 6 });
        res.cookies.set('geo_locale', baseLocale, { path: '/', maxAge: 60 * 60 * 6 });
        return res;
      }

      const url = new URL(rewriteTarget, request.url);
      url.search = request.nextUrl.search;
      const res = NextResponse.rewrite(url);
      const slug = rewriteTarget.split('/')[2] || '';
      const isoCountry = slug === 'br' ? 'BR' : slug === 'us' ? 'US' : slug === 'gb' ? 'GB' : slug === 'ca' ? 'CA' : slug === 'au' ? 'AU' : slug === 'es' ? 'ES' : '';
      if (isoCountry) res.cookies.set('geo_country', isoCountry, { path: '/', maxAge: 60 * 60 * 6 });
      res.cookies.set('geo_locale', baseLocale, { path: '/', maxAge: 60 * 60 * 6 });
      return res;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Matcher para aplicar o middleware
  matcher: [
    // Aplicar a todas as rotas exceto arquivos estáticos e vídeos
    '/((?!_next/static|_next/image|favicon.ico|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4)$).*)',
    // Aplicar especificamente às APIs
    '/api/:path*'
  ]
};