'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { 
  getUtmSessionId, 
  getSessionData, 
  renewUtmSessionId 
} from '@/lib/utm-session';
import { 
  extractUtmParams, 
  buildCompleteUrl, 
  buildPersonalizationUrl,
  buildCheckoutUrl,
  buildThankYouUrl,
  updateCurrentUrlWithUtm,
  type UtmParams
} from '@/lib/url-builder';

/**
 * Hook para gerenciar tracking UTM e construção de URLs
 */
export function useUtmTracking(localeParam?: 'pt' | 'en' | 'es') {
  const localeFromHook = useLocale() as 'pt' | 'en' | 'es';
  const locale: 'pt' | 'en' | 'es' = localeParam || localeFromHook;
  const [sessionId, setSessionId] = useState<string>('');
  const [utmParams, setUtmParams] = useState<UtmParams>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializa o tracking UTM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Extrai parâmetros UTM da URL atual
    const currentUtm = extractUtmParams();
    setUtmParams(currentUtm);

    // Obtém ou cria session ID único para esta sessão
    const currentSessionId = getUtmSessionId(locale, currentUtm.utm_source);
    setSessionId(currentSessionId);

    // Salva UTMs no localStorage para uso nos checkouts
    // Sempre salva o session_id, mesmo sem UTMs na URL
    try {
      const utmWithSession = { ...currentUtm, utm_session_id: currentSessionId };
      localStorage.setItem('pers_utm_params', JSON.stringify(utmWithSession));
      console.log('UTMs e session_id salvos no localStorage:', utmWithSession);
      console.log('Session ID único gerado:', currentSessionId);
    } catch (error) {
      console.error('Erro ao salvar UTMs no localStorage:', error);
    }

    setIsInitialized(true);
  }, [locale]);

  /**
   * Atualiza parâmetros UTM e renova session se necessário
   */
  const updateUtmParams = (newParams: UtmParams, renewSession = false) => {
    const updatedParams = { ...utmParams, ...newParams };
    setUtmParams(updatedParams);

    let currentSessionId = sessionId;
    if (renewSession) {
      currentSessionId = renewUtmSessionId(locale, newParams.utm_source);
      setSessionId(currentSessionId);
    }

    // Atualiza localStorage com novos parâmetros e session_id
    try {
      const utmWithSession = { ...updatedParams, utm_session_id: currentSessionId };
      localStorage.setItem('pers_utm_params', JSON.stringify(utmWithSession));
      console.log('UTMs atualizados no localStorage:', utmWithSession);
    } catch (error) {
      console.error('Erro ao atualizar UTMs no localStorage:', error);
    }
  };

  /**
   * Constrói URL completa com parâmetros atuais
   */
  const buildUrl = (path?: string, additionalParams?: UtmParams) => {
    return buildCompleteUrl({
      locale,
      path,
      utm: { ...utmParams, utm_session_id: sessionId },
      customParams: additionalParams
    });
  };

  /**
   * Constrói URL para formulário de personalização
   */
  const buildPersonalizationLink = (step: string) => {
    return buildPersonalizationUrl(locale, step, { ...utmParams, utm_session_id: sessionId });
  };

  /**
   * Constrói URL para checkout
   */
  const buildCheckoutLink = (provider: 'lastlink' | 'cartpanda', persData?: string) => {
    return buildCheckoutUrl(locale, provider, { ...utmParams, utm_session_id: sessionId }, persData);
  };

  /**
   * Constrói URL para página de agradecimento
   */
  const buildThankYouLink = (provider: 'lastlink' | 'cartpanda', orderData?: UtmParams) => {
    return buildThankYouUrl(locale, provider, { ...utmParams, utm_session_id: sessionId }, orderData);
  };

  /**
   * Atualiza URL atual com novos parâmetros
   */
  const updateCurrentUrl = (newParams: UtmParams) => {
    return updateCurrentUrlWithUtm({ ...utmParams, ...newParams, utm_session_id: sessionId });
  };

  /**
   * Obtém dados completos da sessão
   */
  const getSessionInfo = () => {
    return getSessionData();
  };

  /**
   * Força renovação da sessão
   */
  const renewSession = () => {
    const newSessionId = renewUtmSessionId(locale, utmParams.utm_source);
    setSessionId(newSessionId);
    return newSessionId;
  };

  /**
   * Verifica se há parâmetros UTM ativos
   */
  const hasUtmParams = () => {
    return Object.keys(utmParams).some(key => 
      key.startsWith('utm_') && utmParams[key]
    );
  };

  /**
   * Obtém parâmetros UTM formatados para analytics
   */
  const getAnalyticsParams = () => {
    return {
      session_id: sessionId,
      source: utmParams.utm_source || 'direct',
      medium: utmParams.utm_medium || 'none',
      campaign: utmParams.utm_campaign || 'none',
      locale
    };
  };

  return {
    // Estado
    sessionId,
    utmParams,
    locale,
    isInitialized,
    
    // Funções de atualização
    updateUtmParams,
    renewSession,
    
    // Construtores de URL
    buildUrl,
    buildPersonalizationLink,
    buildCheckoutLink,
    buildThankYouLink,
    updateCurrentUrl,
    
    // Utilitários
    getSessionInfo,
    hasUtmParams,
    getAnalyticsParams
  };
}