// 🔗 UTM Session Management - Gerenciamento de Sessão UTM

/**
 * Limpa a sessão UTM do localStorage
 */
export function clearUtmSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('utm_session_id');
    localStorage.removeItem('utm_session_timestamp');
  }
}

/**
 * Gera um ID único de sessão UTM baseado nos parâmetros UTM atuais
 * @returns {string} ID da sessão UTM
 */
export function getUtmSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-side-session';
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  // Extrair parâmetros UTM
  const utmParams = {
    source: urlParams.get('utm_source') || 'direct',
    medium: urlParams.get('utm_medium') || 'none',
    campaign: urlParams.get('utm_campaign') || 'none',
    term: urlParams.get('utm_term') || '',
    content: urlParams.get('utm_content') || ''
  };

  // Gerar timestamp da sessão
  const timestamp = Date.now();
  
  // Verificar se já existe uma sessão ativa (dentro de 30 minutos)
  const existingSession = localStorage.getItem('utm_session_id');
  const sessionTimestamp = localStorage.getItem('utm_session_timestamp');
  
  // Verificar se a sessão existente está no formato antigo (contém "direct-none-none-timestamp")
  const isOldFormat = existingSession && existingSession.match(/^direct-none-none-\d+$/);
  
  if (existingSession && sessionTimestamp && !isOldFormat) {
    const timeDiff = timestamp - parseInt(sessionTimestamp);
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutos em ms
    
    if (timeDiff < thirtyMinutes) {
      return existingSession;
    }
  }

  // Se é formato antigo, limpar a sessão
  if (isOldFormat) {
    clearUtmSession();
  }

  // Criar nova sessão com ID único
  // Usar um hash mais limpo baseado nos UTMs + timestamp + random
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sessionKey = `${utmParams.source}-${utmParams.medium}-${utmParams.campaign}`;
  const sessionId = `${sessionKey}-${timestamp}-${randomSuffix}`;
  
  // Salvar no localStorage
  localStorage.setItem('utm_session_id', sessionId);
  localStorage.setItem('utm_session_timestamp', timestamp.toString());
  
  return sessionId;
}

/**
 * Obtém os parâmetros UTM atuais da URL
 * @returns {object} Objeto com parâmetros UTM
 */
export function getCurrentUtmParams() {
  if (typeof window === 'undefined') {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    fbclid: urlParams.get('fbclid') || undefined,
    gclid: urlParams.get('gclid') || undefined,
    click_id: urlParams.get('click_id') || undefined
  };
}

const utmSessionModule = {
  getUtmSessionId,
  getCurrentUtmParams,
  clearUtmSession
};

export default utmSessionModule;