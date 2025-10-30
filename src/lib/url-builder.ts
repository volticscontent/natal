'use client';

import { getUtmSessionId } from './utm-session';

/**
 * Configurações de domínio por locale
 */
const DOMAIN_CONFIG = {
  pt: 'elfisanta.com.br',
  en: 'elfisanta.com',
  es: 'elfisanta.com'
} as const;

/**
 * Parâmetros UTM suportados
 */
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_session_id?: string;
  fbclid?: string; // Facebook Click ID
  gclid?: string;  // Google Click ID
  click_id?: string; // Click ID genérico
  [key: string]: string | undefined; // Index signature para compatibilidade com Record<string, string>
}

/**
 * Parâmetros de personalização
 */
interface PersonalizationParams {
  form_step?: string;
  pers_data?: string;
  checkout_provider?: string;
}

/**
 * Configuração completa da URL
 */
interface UrlConfig {
  locale: 'pt' | 'en' | 'es';
  path?: string;
  utm?: UtmParams;
  personalization?: PersonalizationParams;
  customParams?: UtmParams;
}

/**
 * Constrói URL completa seguindo o padrão:
 * https://dominio.com/locale/path?utm_params&pers_params&utm_session_id=unique_id
 */
export function buildCompleteUrl(config: UrlConfig): string {
  const { locale, path = '', utm = {}, personalization = {}, customParams = {} } = config;
  
  // Verifica se estamos em ambiente de desenvolvimento
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  let baseUrl: string;
  
  if (isDevelopment) {
    // Em desenvolvimento, usa o domínio atual
    baseUrl = `${window.location.protocol}//${window.location.host}`;
    // Sempre adiciona o locale em desenvolvimento
    baseUrl += `/${locale}`;
  } else {
    // Em produção, usa o domínio configurado
    const domain = DOMAIN_CONFIG[locale];
    baseUrl = `https://${domain}`;
    
    // Adiciona locale se não for o padrão (pt para .com.br)
    if (locale !== 'pt' || domain !== 'elfisanta.com.br') {
      baseUrl += `/${locale}`;
    }
  }
  
  // Adiciona o path se fornecido
  if (path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    baseUrl += cleanPath;
  }
  
  // Gera utm_session_id único se não fornecido
  const sessionId = utm.utm_session_id || getUtmSessionId(locale, utm.utm_source);
  
  // Constrói parâmetros da query
  const queryParams = new URLSearchParams();
  
  // Adiciona UTM parameters
  const utmWithSession = { ...utm, utm_session_id: sessionId };
  Object.entries(utmWithSession).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  
  // Adiciona parâmetros de personalização
  Object.entries(personalization).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  
  // Adiciona parâmetros customizados
  Object.entries(customParams).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  
  // Constrói URL final
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Detecta UTMs orgânicas baseado no referrer
 */
function detectOrganicUtms(): Partial<UtmParams> {
  if (typeof window === 'undefined' || !document.referrer) {
    return {};
  }

  try {
    const referrer = new URL(document.referrer);
    const hostname = referrer.hostname.toLowerCase();

    // Google (busca orgânica)
    if (hostname.includes('google.')) {
      return {
        utm_source: 'google',
        utm_medium: 'organic',
        utm_campaign: 'organic_search'
      };
    }

    // Facebook (tráfego orgânico)
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
      return {
        utm_source: 'facebook',
        utm_medium: 'organic',
        utm_campaign: 'organic_social'
      };
    }

    // Instagram (tráfego orgânico)
    if (hostname.includes('instagram.com')) {
      return {
        utm_source: 'instagram',
        utm_medium: 'organic',
        utm_campaign: 'organic_social'
      };
    }

    // TikTok (tráfego orgânico)
    if (hostname.includes('tiktok.com')) {
      return {
        utm_source: 'tiktok',
        utm_medium: 'organic',
        utm_campaign: 'organic_social'
      };
    }

    // YouTube (tráfego orgânico)
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return {
        utm_source: 'youtube',
        utm_medium: 'organic',
        utm_campaign: 'organic_video'
      };
    }

    // WhatsApp (compartilhamento)
    if (hostname.includes('whatsapp.com') || hostname.includes('wa.me')) {
      return {
        utm_source: 'whatsapp',
        utm_medium: 'social',
        utm_campaign: 'organic_share'
      };
    }

    // Outros referrers (tráfego de referência)
    if (referrer.hostname !== window.location.hostname) {
      return {
        utm_source: hostname.replace('www.', ''),
        utm_medium: 'referral',
        utm_campaign: 'organic_referral'
      };
    }
  } catch (error) {
    console.warn('Erro ao detectar UTMs orgânicas:', error);
  }

  return {};
}

/**
 * Extrai parâmetros UTM da URL atual
 */
export function extractUtmParams(): UtmParams {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  
  // Primeiro, tenta extrair UTMs da URL
  const urlUtms = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_session_id: urlParams.get('utm_session_id') || undefined,
    fbclid: urlParams.get('fbclid') || undefined,
    gclid: urlParams.get('gclid') || undefined,
    click_id: urlParams.get('click_id') || undefined,
  };

  // Se não há UTMs na URL, tenta detectar UTMs orgânicas
  const hasUrlUtms = Object.values(urlUtms).some(value => value !== undefined);
  
  if (!hasUrlUtms) {
    const organicUtms = detectOrganicUtms();
    return { ...urlUtms, ...organicUtms };
  }

  return urlUtms;
}

/**
 * Constrói URL para formulário de personalização
 */
export function buildPersonalizationUrl(
  locale: 'pt' | 'en' | 'es',
  step: string,
  utm?: UtmParams
): string {
  return buildCompleteUrl({
    locale,
    path: `/pers/${step}`,
    utm
  });
}

/**
 * Constrói URL para checkout
 */
export function buildCheckoutUrl(
  locale: 'pt' | 'en' | 'es',
  provider: 'lastlink' | 'cartpanda',
  utm?: UtmParams,
  persData?: string
): string {
  return buildCompleteUrl({
    locale,
    path: '/checkout',
    utm,
    personalization: {
      checkout_provider: provider,
      pers_data: persData
    }
  });
}

/**
 * Constrói URL para página de agradecimento
 */
export function buildThankYouUrl(
  locale: 'pt' | 'en' | 'es',
  provider: 'lastlink' | 'cartpanda',
  utm?: UtmParams,
  orderData?: UtmParams
): string {
  return buildCompleteUrl({
    locale,
    path: `/obrigado/${provider}`,
    utm,
    customParams: orderData
  });
}

/**
 * Atualiza URL atual com novos parâmetros UTM
 */
export function updateCurrentUrlWithUtm(newUtm: Partial<UtmParams>): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  const currentUrl = new URL(window.location.href);
  const currentUtm = extractUtmParams();
  
  // Merge UTM parameters
  const mergedUtm = { ...currentUtm, ...newUtm };
  
  // Determina locale da URL atual
  const pathSegments = currentUrl.pathname.split('/').filter(Boolean);
  const locale = (['pt', 'en', 'es'].includes(pathSegments[0]) ? pathSegments[0] : 'pt') as 'pt' | 'en' | 'es';
  
  return buildCompleteUrl({
    locale,
    path: currentUrl.pathname,
    utm: mergedUtm,
    customParams: Object.fromEntries(currentUrl.searchParams.entries()) as UtmParams
  });
}